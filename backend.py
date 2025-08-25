from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variable to store the classifier
classifier = None

def load_classifier():
    """Load the toxicity classifier model"""
    global classifier
    try:
        logger.info("Loading toxicity classifier...")
        classifier = pipeline("text-classification", model="unitary/toxic-bert")
        logger.info("Classifier loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Error loading classifier: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'classifier_loaded': classifier is not None
    })

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Analyze text for toxicity"""
    try:
        # Check if classifier is loaded
        if classifier is None:
            return jsonify({'error': 'Classifier not loaded'}), 503
        
        # Get text from request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        text = data.get('text', '').strip()
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        logger.info(f"Analyzing text: {text[:50]}...")
        
        # Analyze the text
        result = classifier(text)[0]
        
        # Map the result to our expected format
        # The model returns LABEL_0 for non-toxic and LABEL_1 for toxic
        label = 'toxic' if result['label'] == 'LABEL_1' else 'safe'
        score = result['score']
        
        response = {
            'label': label,
            'score': score,
            'text_length': len(text)
        }
        
        logger.info(f"Analysis result: {label} ({score:.3f})")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-batch', methods=['POST'])
def analyze_batch():
    """Analyze multiple texts at once"""
    try:
        if classifier is None:
            return jsonify({'error': 'Classifier not loaded'}), 503
        
        data = request.get_json()
        if not data or 'texts' not in data:
            return jsonify({'error': 'No texts array provided'}), 400
        
        texts = data['texts']
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({'error': 'Invalid texts array'}), 400
        
        logger.info(f"Analyzing batch of {len(texts)} texts")
        
        # Analyze all texts
        results = classifier(texts)
        
        # Process results
        processed_results = []
        for i, result in enumerate(results):
            label = 'toxic' if result['label'] == 'LABEL_1' else 'safe'
            processed_results.append({
                'index': i,
                'label': label,
                'score': result['score'],
                'text': texts[i][:100] + '...' if len(texts[i]) > 100 else texts[i]
            })
        
        return jsonify({
            'results': processed_results,
            'total_analyzed': len(texts)
        })
        
    except Exception as e:
        logger.error(f"Error analyzing batch: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get model statistics"""
    return jsonify({
        'model': 'unitary/toxic-bert',
        'classifier_loaded': classifier is not None,
        'endpoints': {
            'analyze': '/analyze',
            'analyze_batch': '/analyze-batch',
            'health': '/health'
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Load the classifier on startup
    if load_classifier():
        logger.info("Starting Flask server...")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        logger.error("Failed to load classifier. Exiting...")
        exit(1)
