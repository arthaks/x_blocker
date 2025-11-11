// 从本地JSON加载默认名单
let blacklist = [];
let hideMode = false;  // 新增：隐藏模式

// 异步加载默认名单
async function loadDefaultBlacklist() {
  try {
    const response = await fetch(chrome.runtime.getURL('data/blacklist.json'));
    const data = await response.json();
    blacklist = data.blacklist || [];
    console.log('默认黑名单加载成功:', blacklist);
  } catch (error) {
    console.error('加载默认黑名单失败:', error);
    blacklist = [];
  }
}

// 先加载默认，再从storage拉取用户自定义（覆盖默认）+隐藏模式
loadDefaultBlacklist().then(() => {
  chrome.storage.local.get(['blacklist', 'hideMode'], (data) => {  // 加 hideMode
    if (data.blacklist && data.blacklist.length > 0) {
      blacklist = data.blacklist;
    }
    hideMode = data.hideMode || false;  // 新增
    console.log('最终黑名单:', blacklist, '隐藏模式:', hideMode);  // 加日志
    initObserver();
  });
});

// 初始化MutationObserver监听动态内容
function initObserver() {
  const observer = new MutationObserver(scanAndHighlight);
  observer.observe(document.body, { childList: true, subtree: true });
  // 初始扫描
  scanAndHighlight();
}

// 扫描并高亮/隐藏函数
function scanAndHighlight() {
  console.log('开始扫描...');
  // X的稳定选择器：推文容器 [data-testid="tweet"]，用户名 [data-testid="User-Name"] 或 [data-testid="UserCell"]
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  console.log('找到推文容器数:', tweets.length);
  tweets.forEach(tweet => {
    if (tweet.classList.contains('highlighted')) return; // 避免重复处理

    const userNameEl = tweet.querySelector('[data-testid="User-Name"]') || tweet.querySelector('[href*="/"] span[dir="ltr"]'); // 备用选择器
    if (userNameEl) {
      let fullName = userNameEl.textContent.trim();
      // 改进提取：用正则匹配纯 @handle，忽略显示名和时间
      let match = fullName.match(/@([a-zA-Z0-9_]+)/);
      let username = match ? `@${match[1]}` : '';  // 只取 @zhuren1992
      console.log('完整 fullName:', fullName);
      console.log('提取 username:', username);

      if (username && blacklist.some(item => item.toLowerCase() === username.toLowerCase())) { // 忽略大小写匹配
        if (hideMode) {
          // 隐藏模式：直接屏蔽推文
          tweet.style.display = 'none';
          console.log(`隐藏了: ${username}`);
        } else {
          // 高亮模式
          tweet.style.backgroundColor = '#fff3cd'; // 浅黄
          tweet.style.border = '2px solid #ffc107'; // 黄边框
          tweet.classList.add('highlighted');

          // 加标签：用户名前插"[BOT?]" 
          const label = document.createElement('span');
          label.textContent = ' [BOT?]';
          label.style.color = 'red';
          label.style.fontWeight = 'bold';
          label.style.fontSize = '12px';
          userNameEl.prepend(label);
        }
        console.log(`处理了: ${username} (模式: ${hideMode ? '隐藏' : '高亮'})`);
      } else if (username) {
        console.log(`用户名 ${username} 不在黑名单`);
      }
    } else {
      console.log('未找到用户名元素');
    }
  });
}