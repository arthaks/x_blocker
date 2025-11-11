// 处理消息传递（popup/content间）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBlacklist') {
    chrome.storage.local.get('blacklist', sendResponse);
    return true; // 异步响应
  } else if (request.action === 'setBlacklist') {
    chrome.storage.local.set({ blacklist: request.list }, sendResponse);
    return true;
  }
});