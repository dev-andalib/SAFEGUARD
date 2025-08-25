# Content Analyzer Pro 🚀

A modern browser extension that provides real-time content analysis with AI-powered toxicity detection for social media platforms.

## ✨ Features

- **Real-time Analysis**: Automatically scans and analyzes content as you browse Twitter/X
- **AI-Powered Detection**: Uses Hugging Face transformers for accurate toxicity classification
- **Modern Dark UI**: Sleek, professional interface with smooth animations
- **Live Statistics**: Track analyzed content and toxicity levels
- **Configurable Backend**: Easy backend URL configuration
- **Pause/Resume**: Control analysis on-the-fly

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Python Flask + Hugging Face Transformers
- **Browser Extension**: Chrome Extension Manifest V3
- **Styling**: Modern CSS with gradients and animations

## 📦 Installation

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this project folder
4. The extension should now appear in your extensions list

### 2. Set Up the Backend

The extension requires a Python Flask backend for AI analysis. Here's a quick setup:

```bash
# Install Python dependencies
pip install flask transformers torch flask-cors

# Create a simple backend (save as backend.py)
```

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Load the toxicity classifier
classifier = pipeline("text-classification", model="unitary/toxic-bert")

@app.route('/analyze', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Analyze the text
        result = classifier(text)[0]
        
        # Map the result to our expected format
        label = 'toxic' if result['label'] == 'LABEL_1' else 'safe'
        score = result['score']
        
        return jsonify({
            'label': label,
            'score': score
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### 3. Run the Backend

```bash
python backend.py
```

### 4. Configure the Extension

1. Click the extension icon in your browser
2. Update the backend URL to `http://localhost:5000/analyze`
3. Make sure analysis is enabled

## 🎯 Usage

1. **Navigate to Twitter/X**: Go to `twitter.com` or `x.com`
2. **Automatic Analysis**: The extension will automatically start analyzing tweets
3. **View Results**: Analysis results appear as overlays on each tweet
4. **Control via Popup**: Click the extension icon to:
   - View statistics
   - Pause/resume analysis
   - Update backend URL
   - Monitor recent activity

## 🎨 UI Components

### Status Bar
- Fixed position in top-right corner
- Shows analysis status (Active/Paused)
- Toggle button for quick control

### Analysis Results
- Color-coded toxicity levels:
  - 🟢 Safe (Green)
  - 🟡 Low Toxic (Yellow)
  - 🟠 Medium Toxic (Orange)
  - 🔴 High Toxic (Red)
- Percentage scores and visual progress bars
- Smooth animations and hover effects

### Popup Interface
- Modern dark theme with gradients
- Real-time statistics dashboard
- Activity feed with timestamps
- Configuration controls

## 🔧 Configuration

### Backend URL
Update the backend URL in the popup to point to your Flask server:
- Local: `http://localhost:5000/analyze`
- Ngrok: `https://your-ngrok-url.ngrok.io/analyze`

### Analysis Settings
- Toggle analysis on/off
- View real-time statistics
- Monitor activity feed

## 📊 Statistics

The extension tracks:
- **Total Analyzed**: Number of content pieces analyzed
- **Toxic Count**: Number of toxic content detected
- **Activity Log**: Recent analysis events

## 🚀 Deployment

### For Production
1. **Backend**: Deploy Flask app to cloud service (Heroku, AWS, etc.)
2. **Ngrok**: Use ngrok for local development: `ngrok http 5000`
3. **Extension**: Update backend URL to production endpoint

### For Demo
1. Run Flask backend locally
2. Use ngrok to create public URL
3. Update extension backend URL
4. Share ngrok URL with team

## 🎯 Future Enhancements

- Support for multiple social media platforms
- Advanced sentiment analysis
- Custom classification models
- User preferences and filters
- Export analysis reports
- Real-time notifications

## 🐛 Troubleshooting

### Extension Not Working
1. Check if backend is running on correct port
2. Verify backend URL in extension popup
3. Check browser console for errors
4. Ensure extension has proper permissions

### Analysis Not Appearing
1. Refresh the Twitter/X page
2. Check if analysis is enabled in popup
3. Verify backend is responding correctly
4. Check network tab for API calls

### Backend Issues
1. Ensure all Python dependencies are installed
2. Check Flask server logs
3. Verify CORS is properly configured
4. Test API endpoint directly

## 📝 Development

### File Structure
```
content-analyzer-pro/
├── manifest.json          # Extension configuration
├── content.js            # Main content script
├── background.js         # Service worker
├── popup.html           # Popup interface
├── popup.js             # Popup functionality
├── popup.css            # Popup styles
├── styles.css           # Content script styles
├── icons/               # Extension icons
└── README.md           # This file
```

### Key Features
- **MutationObserver**: Watches for new content dynamically
- **Real-time Communication**: Chrome messaging API
- **Modern CSS**: Gradients, animations, responsive design
- **Error Handling**: Graceful fallbacks and user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for real-time content analysis**
