// Note.comの記事内容を取得する
function getArticleContent() {
  console.log('Getting article content from Note...');
  
  // タイトルを取得
  let title = '';
  const titleSelectors = [
    'h1.o-noteContentHeader__title',
    'h1[class*="title"]',
    'article h1',
    '.note-common-styles__textnote-title',
    'h1'
  ];
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      title = element.textContent.trim();
      console.log('Found title:', title);
      break;
    }
  }
  
  // 本文を取得
  let content = '';
  const contentSelectors = [
    '.note-common-styles__textnote__body',
    'div[class*="noteBody"]',
    '.o-noteContentText',
    'article .note-body',
    'article section',
    'article',
    'main'
  ];
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // クローンを作成して不要な要素を削除
      const clone = element.cloneNode(true);
      
      // 不要な要素を削除
      const removeSelectors = [
        'script',
        'style',
        'button',
        'nav',
        'aside',
        '.note-status',
        '.note-actions',
        '[class*="Share"]',
        '[class*="Like"]',
        '[class*="Comment"]'
      ];
      
      removeSelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });
      
      // テキストを取得
      content = clone.textContent || clone.innerText || '';
      content = content.trim();
      
      if (content.length > 100) {
        console.log('Found content with length:', content.length);
        break;
      }
    }
  }
  
  // コンテンツが取得できなかった場合の代替処理
  if (!content || content.length < 100) {
    console.log('Trying alternative content extraction...');
    
    // メインコンテンツエリアを探す
    const main = document.querySelector('main') || document.querySelector('article');
    if (main) {
      const paragraphs = main.querySelectorAll('p, div[class*="text"], div[class*="body"]');
      const texts = [];
      
      paragraphs.forEach(p => {
        const text = p.textContent?.trim();
        if (text && text.length > 20) {
          texts.push(text);
        }
      });
      
      if (texts.length > 0) {
        content = texts.join('\n\n');
        console.log('Alternative extraction successful, length:', content.length);
      }
    }
  }
  
  // 著者情報を取得
  let author = '';
  const authorSelectors = [
    '.o-noteContentHeader__name',
    'a[href*="/user/"] span',
    '[class*="author"]',
    '[class*="creator"]'
  ];
  
  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      author = element.textContent.trim();
      break;
    }
  }
  
  // 公開日時を取得
  let publishedAt = '';
  const dateSelectors = [
    'time',
    '[datetime]',
    '[class*="date"]',
    '[class*="time"]'
  ];
  
  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      publishedAt = element.getAttribute('datetime') || element.textContent?.trim() || '';
      if (publishedAt) break;
    }
  }
  
  // タグを取得
  const tags = [];
  const tagElements = document.querySelectorAll('a[href*="/hashtag/"], [class*="tag"]');
  tagElements.forEach(el => {
    const tag = el.textContent?.trim();
    if (tag && tag.startsWith('#')) {
      tags.push(tag.substring(1));
    }
  });
  
  return {
    title: title || document.title,
    content: content,
    url: window.location.href,
    author: author,
    publishedAt: publishedAt,
    tags: tags,
    contentLength: content.length
  };
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  if (request.action === 'getContent') {
    try {
      const articleData = getArticleContent();
      
      if (!articleData.content || articleData.content.length < 50) {
        sendResponse({ 
          error: '記事内容を取得できませんでした。記事ページで実行してください。' 
        });
      } else {
        console.log('Sending article data:', {
          title: articleData.title,
          contentLength: articleData.contentLength,
          url: articleData.url
        });
        sendResponse(articleData);
      }
    } catch (error) {
      console.error('Error getting content:', error);
      sendResponse({ 
        error: 'エラーが発生しました: ' + error.message 
      });
    }
  }
  
  return true; // 非同期レスポンスのために必要
});

console.log('Note Analytics content script loaded');