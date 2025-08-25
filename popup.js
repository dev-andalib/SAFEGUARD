// Content Analyzer Pro - Popup Script

class PopupManager {
  constructor() {
    this.stats = {
      totalAnalyzed: 0,
      toxicCount: 0
    };
    this.init();
  }

  async init() {
    console.log('🚀 Popup initialized');
    this.setupEventListeners();
    await this.loadStats();
    this.updateUI();
    this.startActivityUpdates();
  }

  setupEventListeners() {
    // Analysis toggle
    const analysisToggle = document.getElementById('analysisToggle');
    analysisToggle.addEventListener('change', (e) => {
      this.toggleAnalysis(e.target.checked);
    });

    // Backend URL update
    const updateUrlBtn = document.getElementById('updateUrl');
    updateUrlBtn.addEventListener('click', () => {
      this.updateBackendUrl();
    });

    // Footer buttons
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
      this.openHelp();
    });

    // Enter key for URL input
    const urlInput = document.getElementById('backendUrl');
    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.updateBackendUrl();
      }
    });
  }

  async toggleAnalysis(enabled) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleAnalysis',
          enabled: enabled
        });

        // Update status indicator
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (enabled) {
          statusDot.classList.add('active');
          statusDot.classList.remove('inactive');
          statusText.textContent = 'Active';
        } else {
          statusDot.classList.remove('active');
          statusDot.classList.add('inactive');
          statusText.textContent = 'Paused';
        }

        this.addActivity(`Analysis ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Error toggling analysis:', error);
      this.addActivity('Error: Could not toggle analysis', 'error');
    }
  }

  async updateBackendUrl() {
    const urlInput = document.getElementById('backendUrl');
    const newUrl = urlInput.value.trim();

    if (!newUrl) {
      this.showNotification('Please enter a valid URL', 'error');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateBackendUrl',
          url: newUrl
        });

        // Save to storage
        await chrome.storage.local.set({ backendUrl: newUrl });
        
        this.showNotification('Backend URL updated successfully', 'success');
        this.addActivity('Backend URL updated');
      }
    } catch (error) {
      console.error('Error updating backend URL:', error);
      this.showNotification('Error updating backend URL', 'error');
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

  updateUI() {
    document.getElementById('totalAnalyzed').textContent = this.stats.totalAnalyzed;
    document.getElementById('toxicCount').textContent = this.stats.toxicCount;
  }

  addActivity(text, type = 'info') {
    const activityList = document.getElementById('activityList');
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const icon = this.getActivityIcon(type);
    const time = this.getRelativeTime();
    
    activityItem.innerHTML = `
      <div class="activity-icon">${icon}</div>
      <div class="activity-content">
        <div class="activity-text">${text}</div>
        <div class="activity-time">${time}</div>
      </div>
    `;

    // Add to the beginning of the list
    activityList.insertBefore(activityItem, activityList.firstChild);

    // Keep only the last 5 activities
    const activities = activityList.querySelectorAll('.activity-item');
    if (activities.length > 5) {
      activities[activities.length - 1].remove();
    }

    // Add animation
    activityItem.style.opacity = '0';
    activityItem.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
      activityItem.style.transition = 'all 0.3s ease';
      activityItem.style.opacity = '1';
      activityItem.style.transform = 'translateX(0)';
    }, 10);
  }

  getActivityIcon(type) {
    const icons = {
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    };
    return icons[type] || icons.info;
  }

  getRelativeTime() {
    return 'Just now';
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#e53e3e' : type === 'success' ? '#48bb78' : '#667eea'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  startActivityUpdates() {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'updateStats') {
        this.stats = message.stats;
        this.updateUI();
      } else if (message.action === 'addActivity') {
        this.addActivity(message.text, message.type);
      }
    });

    // Request current stats from content script
    this.requestStats();
  }

  async requestStats() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'getStats'
        });
      }
    } catch (error) {
      console.error('Error requesting stats:', error);
    }
  }

  openSettings() {
    this.addActivity('Settings clicked');
    // In a real implementation, this would open a settings page
    this.showNotification('Settings feature coming soon!', 'info');
  }

  openHelp() {
    this.addActivity('Help clicked');
    // In a real implementation, this would open help documentation
    this.showNotification('Help documentation coming soon!', 'info');
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.popupManager = new PopupManager();
});

// Handle popup window focus to refresh stats
window.addEventListener('focus', () => {
  if (window.popupManager) {
    window.popupManager.requestStats();
  }
});
