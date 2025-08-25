// Content Analyzer Pro - Background Service Worker

class BackgroundManager {
  constructor() {
    this.stats = {
      totalAnalyzed: 0,
      toxicCount: 0
    };
    this.init();
  }

  init() {
    console.log('🚀 Background service worker initialized');
    this.setupMessageListeners();
    this.loadStats();
  }

  setupMessageListeners() {
    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'updateStats':
          await this.updateStats(message.stats);
          sendResponse({ success: true });
          break;

        case 'getStats':
          sendResponse({ stats: this.stats });
          break;

        case 'incrementAnalyzed':
          this.stats.totalAnalyzed++;
          await this.saveStats();
          sendResponse({ success: true, stats: this.stats });
          break;

        case 'incrementToxic':
          this.stats.toxicCount++;
          await this.saveStats();
          sendResponse({ success: true, stats: this.stats });
          break;

        case 'resetStats':
          this.stats = { totalAnalyzed: 0, toxicCount: 0 };
          await this.saveStats();
          sendResponse({ success: true, stats: this.stats });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
    await this.saveStats();
    
    // Broadcast stats update to all tabs
    this.broadcastStatsUpdate();
  }

  async saveStats() {
    try {
      await chrome.storage.local.set({
        totalAnalyzed: this.stats.totalAnalyzed,
        toxicCount: this.stats.toxicCount
      });
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['totalAnalyzed', 'toxicCount']);
      this.stats.totalAnalyzed = result.totalAnalyzed || 0;
      this.stats.toxicCount = result.toxicCount || 0;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  broadcastStatsUpdate() {
    // Send stats update to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'statsUpdated',
            stats: this.stats
          }).catch(() => {
            // Ignore errors for tabs that don't have content scripts
          });
        }
      });
    });

    // Send to popup if open
    chrome.runtime.sendMessage({
      action: 'updateStats',
      stats: this.stats
    }).catch(() => {
      // Ignore errors if popup is not open
    });
  }

  handleInstallation(details) {
    if (details.reason === 'install') {
      console.log('🎉 Content Analyzer Pro installed');
      
      // Set default settings
      chrome.storage.local.set({
        backendUrl: 'http://localhost:5000/analyze',
        isEnabled: true,
        totalAnalyzed: 0,
        toxicCount: 0
      });

      // Open welcome page
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html')
      });
    } else if (details.reason === 'update') {
      console.log('🔄 Content Analyzer Pro updated');
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    // Inject content script when navigating to Twitter/X
    if (changeInfo.status === 'complete' && tab.url) {
      if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
        // Content script will be automatically injected via manifest
        console.log('📱 Twitter/X page detected');
      }
    }
  }

  // Utility method to get extension info
  getExtensionInfo() {
    return {
      name: 'Content Analyzer Pro',
      version: '1.0.0',
      description: 'Real-time content analysis with AI-powered toxicity detection'
    };
  }
}

// Initialize background manager
const backgroundManager = new BackgroundManager();

// Handle service worker lifecycle
self.addEventListener('activate', (event) => {
  console.log('🔄 Service worker activated');
});

self.addEventListener('install', (event) => {
  console.log('📦 Service worker installed');
  self.skipWaiting();
});
