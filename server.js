const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple toxicity analysis function
function analyzeText(text) {
    const toxicKeywords = ['hate', 'stupid', 'idiot', 'terrible', 'awful', 'bad', 'horrible', 'disgusting'];
    const textLower = text.toLowerCase();
    
    let toxicScore = 0;
    for (const keyword of toxicKeywords) {
        if (textLower.includes(keyword)) {
            toxicScore += 0.15;
        }
    }
    
    toxicScore = Math.min(toxicScore, 1.0);
    const label = toxicScore > 0.3 ? 'toxic' : 'safe';
    
    return {
        label: label,
        score: toxicScore,
        text_length: text.length
    };
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Content Analyzer Backend is running!',
        timestamp: new Date().toISOString()
    });
});

// Analysis endpoint
app.post('/analyze', (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'No text provided' });
        }
        
        console.log(`Analyzing text: ${text.substring(0, 50)}...`);
        
        const result = analyzeText(text);
        
        console.log(`Analysis result: ${result.label} (${result.score.toFixed(3)})`);
        
        res.json(result);
        
    } catch (error) {
        console.error('Error analyzing text:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stats endpoint
app.get('/stats', (req, res) => {
    res.json({
        model: 'simple-keyword-analyzer',
        status: 'running',
        endpoints: {
            analyze: '/analyze',
            health: '/health',
            stats: '/stats'
        }
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Content Analyzer Backend running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔍 Analysis endpoint: http://localhost:${port}/analyze`);
});
