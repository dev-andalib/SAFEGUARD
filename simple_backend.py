from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Simple backend is running!'
    })

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Simple text analysis (mock)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        text = data.get('text', '').strip()
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        logger.info(f"Analyzing text: {text[:50]}...")
        
        # Simple mock analysis based on keywords
        toxic_keywords = ['hate', 'stupid', 'idiot', 'terrible', 'awful', 'bad']
        text_lower = text.lower()
        
        toxic_score = 0
        for keyword in toxic_keywords:
            if keyword in text_lower:
                toxic_score += 0.2
        
        toxic_score = min(toxic_score, 1.0)  # Cap at 1.0
        label = 'toxic' if toxic_score > 0.3 else 'safe'
        
        response = {
            'label': label,
            'score': toxic_score,
            'text_length': len(text)
        }
        
        logger.info(f"Analysis result: {label} ({toxic_score:.3f})")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get backend statistics"""
    return jsonify({
        'model': 'simple-mock-analyzer',
        'status': 'running',
        'endpoints': {
            'analyze': '/analyze',
            'health': '/health'
        }
    })

if __name__ == '__main__':
    logger.info("Starting simple Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
