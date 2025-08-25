// Content Analyzer Pro - Real-time content analysis
class ContentAnalyzer {
  constructor() {
    this.backendUrl = 'http://localhost:5000/analyze'; // Will be replaced with ngrok URL
    this.analyzedElements = new Set();
    this.isEnabled = true;
    this.init();
  }

  init() {
    console.log('🚀 Content Analyzer Pro initialized');
    this.setupMutationObserver();
    this.analyzeExistingContent();
    this.createStatusIndicator();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanForTweets(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  scanForTweets(element) {
    // Twitter/X tweet selectors
    const tweetSelectors = [
      '[data-testid="tweet"]',
      '[data-testid="tweetText"]',
      '.tweet-text',
      '[lang]'
    ];

    tweetSelectors.forEach(selector => {
      const tweets = element.querySelectorAll ? element.querySelectorAll(selector) : [];
      tweets.forEach(tweet => {
        if (!this.analyzedElements.has(tweet) && this.isValidTweet(tweet)) {
          this.analyzeTweet(tweet);
        }
      });
    });
  }

  isValidTweet(element) {
    // Check if it's a valid tweet element with text content
    const text = this.extractTweetText(element);
    return text && text.length > 10 && !this.analyzedElements.has(element);
  }

  extractTweetText(element) {
    // Extract text content from tweet element
    let text = '';
    
    if (element.getAttribute('data-testid') === 'tweetText') {
      text = element.textContent || element.innerText;
    } else {
      // Find tweet text within the tweet container
      const tweetText = element.querySelector('[data-testid="tweetText"]');
      if (tweetText) {
        text = tweetText.textContent || tweetText.innerText;
      }
    }
    
    return text.trim();
  }

  async analyzeTweet(tweetElement) {
    if (!this.isEnabled) return;

    const text = this.extractTweetText(tweetElement);
    if (!text) return;

    this.analyzedElements.add(tweetElement);
    
    try {
      // Show loading indicator
      this.showAnalysisIndicator(tweetElement, 'analyzing');
      
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
      });

      if (response.ok) {
        const result = await response.json();
        this.displayAnalysisResult(tweetElement, result);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      this.showAnalysisIndicator(tweetElement, 'error');
    }
  }

  showAnalysisIndicator(element, status) {
    const indicator = document.createElement('div');
    indicator.className = `content-analyzer-indicator ${status}`;
    indicator.innerHTML = `
      <div class="indicator-content">
        ${status === 'analyzing' ? '🔍 Analyzing...' : 
          status === 'error' ? '❌ Error' : ''}
      </div>
    `;
    
    // Position the indicator near the tweet
    const container = element.closest('[data-testid="tweet"]') || element.parentElement;
    if (container) {
      container.appendChild(indicator);
    }
  }

  displayAnalysisResult(tweetElement, result) {
    const container = tweetElement.closest('[data-testid="tweet"]') || tweetElement.parentElement;
    if (!container) return;

    // Remove loading indicator
    const loadingIndicator = container.querySelector('.content-analyzer-indicator.analyzing');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Create result indicator
    const resultIndicator = document.createElement('div');
    resultIndicator.className = 'content-analyzer-result';
    
    const toxicityLevel = this.getToxicityLevel(result.score);
    const colorClass = this.getColorClass(result.label, result.score);
    
    resultIndicator.innerHTML = `
      <div class="result-content ${colorClass}">
        <div class="result-icon">${this.getIcon(result.label)}</div>
        <div class="result-text">
          <div class="result-label">${result.label.toUpperCase()}</div>
          <div class="result-score">${(result.score * 100).toFixed(1)}%</div>
        </div>
        <div class="toxicity-bar">
          <div class="toxicity-fill" style="width: ${result.score * 100}%"></div>
        </div>
      </div>
    `;

    container.appendChild(resultIndicator);
  }

  getToxicityLevel(score) {
    if (score < 0.3) return 'Low';
    if (score < 0.7) return 'Medium';
    return 'High';
  }

  getColorClass(label, score) {
    if (label === 'toxic' && score > 0.7) return 'high-toxic';
    if (label === 'toxic' && score > 0.4) return 'medium-toxic';
    if (label === 'toxic') return 'low-toxic';
    return 'safe';
  }

  getIcon(label) {
    const icons = {
      'toxic': '⚠️',
      'safe': '✅',
      'neutral': '➖'
    };
    return icons[label] || '❓';
  }

  analyzeExistingContent() {
    // Analyze tweets that are already on the page
    setTimeout(() => {
      const tweets = document.querySelectorAll('[data-testid="tweet"]');
      tweets.forEach(tweet => {
        if (!this.analyzedElements.has(tweet)) {
          this.analyzeTweet(tweet);
        }
      });
    }, 2000);
  }

  createStatusIndicator() {
    const statusBar = document.createElement('div');
    statusBar.className = 'content-analyzer-status';
    statusBar.innerHTML = `
      <div class="status-content">
        <span class="status-icon">🔍</span>
        <span class="status-text">Content Analyzer Active</span>
        <button class="status-toggle" onclick="window.contentAnalyzer.toggleAnalysis()">
          ${this.isEnabled ? '⏸️' : '▶️'}
        </button>
      </div>
    `;
    
    document.body.appendChild(statusBar);
  }

  toggleAnalysis() {
    this.isEnabled = !this.isEnabled;
    const toggleBtn = document.querySelector('.status-toggle');
    const statusText = document.querySelector('.status-text');
    
    if (toggleBtn && statusText) {
      toggleBtn.textContent = this.isEnabled ? '⏸️' : '▶️';
      statusText.textContent = this.isEnabled ? 'Content Analyzer Active' : 'Content Analyzer Paused';
    }
  }

  // Handle messages from popup and background
  handleMessage(message) {
    switch (message.action) {
      case 'toggleAnalysis':
        this.isEnabled = message.enabled;
        this.toggleAnalysis();
        break;
      
      case 'updateBackendUrl':
        this.backendUrl = message.url;
        console.log('Backend URL updated:', this.backendUrl);
        break;
      
      case 'getStats':
        this.sendStats();
        break;
      
      case 'statsUpdated':
        // Stats updated from background
        break;
    }
  }

  sendStats() {
    chrome.runtime.sendMessage({
      action: 'updateStats',
      stats: {
        totalAnalyzed: this.analyzedElements.size,
        toxicCount: this.getToxicCount()
      }
    });
  }

  getToxicCount() {
    // Count toxic results (this is a simplified version)
    const toxicResults = document.querySelectorAll('.content-analyzer-result .high-toxic, .content-analyzer-result .medium-toxic');
    return toxicResults.length;
  }
}

// Initialize the analyzer when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.contentAnalyzer = new ContentAnalyzer();
  });
} else {
  window.contentAnalyzer = new ContentAnalyzer();
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (window.contentAnalyzer) {
    window.contentAnalyzer.handleMessage(message);
  }
  sendResponse({ success: true });
});
