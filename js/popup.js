document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('list');
  const loadBtn = document.getElementById('load');
  const saveBtn = document.getElementById('save');
  const clearBtn = document.getElementById('clear');
  const defaultBtn = document.getElementById('default');
  const hideCheckbox = document.getElementById('hideToggle');

  // Load current list and mode from storage
  loadBtn.addEventListener('click', () => {
    chrome.storage.local.get(['blacklist', 'hideMode'], (data) => {
      textarea.value = (data.blacklist || []).join('\n');
      hideCheckbox.checked = data.hideMode || false;
    });
  });

  // Save list and mode
  saveBtn.addEventListener('click', () => {
    const lines = textarea.value.trim().split('\n').map(line => line.trim().replace(/^@?/, '@').toLowerCase()).filter(Boolean);
    const hideMode = hideCheckbox.checked;
    chrome.storage.local.set({ blacklist: lines, hideMode: hideMode }, () => {
      alert('Saved successfully! Refresh X page to apply.');
      // Reload current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
      });
    });
  });

  // Clear all
  clearBtn.addEventListener('click', () => {
    chrome.storage.local.set({ blacklist: [], hideMode: false }, () => {
      textarea.value = '';
      hideCheckbox.checked = false;
      alert('Cleared all');
    });
  });

  // Load default bot list from JSON
  defaultBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(chrome.runtime.getURL('data/blacklist.json'));
      const data = await response.json();
      textarea.value = data.blacklist.join('\n');
      alert('Loaded default JSON list');
    } catch (error) {
      alert('Failed to load default JSON: ' + error.message);
    }
  });

  // Initial load
  loadBtn.click();
});