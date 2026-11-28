const languageToggle = document.querySelector('.language-toggle');
const wordmarks = document.querySelectorAll('[data-wordmark]');
const tagTitle = document.querySelector('#tag-title');
const assetBase = document.currentScript.src;
const giscusScript = document.querySelector('.article-comments script[data-lang]');
const giscusOrigin = 'https://giscus.app';
const languageKey = 'library-language';

const messages = {
  'zh-CN': {
    siteTitle: '御琳书屋',
    wordmark: { file: 'library-title-zh.svg', width: 3960, height: 951 },
    welcome: '谢谢你来看我。',
    sendEmail: '发送邮件',
    starOnGitHub: '给 GitHub 仓库点 Star',
    posts: '文章',
    noPosts: '还没有发表文章。',
    morePosts: '更多文章',
    pinned: '已置顶',
    comments: '评论',
    backToPosts: '返回文章列表',
    noTranslation: '本文暂无另一语言版本',
    readEnglish: '阅读英文版',
    readChinese: '阅读中文版',
    switchTo: '切换到中文',
  },
  en: {
    siteTitle: "Nekyulin's Library",
    wordmark: { file: 'library-title.svg', width: 864, height: 101 },
    welcome: 'Thanks for stopping by.',
    sendEmail: 'Send email',
    starOnGitHub: 'Star on GitHub',
    posts: 'Posts',
    noPosts: 'No posts yet.',
    morePosts: 'More posts',
    pinned: 'Pinned',
    comments: 'Comments',
    backToPosts: 'Back to posts',
    noTranslation: 'No alternate language version available',
    readEnglish: 'Read the English version',
    readChinese: 'Read the Chinese version',
    switchTo: 'Switch to English',
  },
};
const titlePrefix = document.title.slice(0, -messages['zh-CN'].siteTitle.length);

function savedLanguage(fallback) {
  try {
    return localStorage.getItem(languageKey) === 'en' ? 'en' : 'zh-CN';
  } catch {
    return fallback;
  }
}

let language = savedLanguage('zh-CN');

function localizeContent(root) {
  const text = messages[language];
  for (const element of root.querySelectorAll('[data-i18n]')) {
    element.textContent = text[element.dataset.i18n];
  }
  for (const element of root.querySelectorAll('[data-i18n-label]')) {
    element.setAttribute('aria-label', text[element.dataset.i18nLabel]);
  }
}

function applyLanguage() {
  const text = messages[language];
  const otherLanguage = language === 'en' ? 'zh-CN' : 'en';
  document.documentElement.lang = language;
  const tagName = tagTitle?.querySelector(`[lang="${language}"]`)?.textContent;
  document.title = (tagName ? `${tagName} | ` : titlePrefix) + text.siteTitle;
  if (languageToggle) {
    languageToggle.lang = otherLanguage;
    languageToggle.setAttribute('aria-label', messages[otherLanguage].switchTo);
  }

  localizeContent(document);
  const { file, width, height } = text.wordmark;
  for (const wordmark of wordmarks) {
    wordmark.width = width;
    wordmark.height = height;
    wordmark.src = new URL(file, assetBase).href;
    if (wordmark.alt) wordmark.alt = text.siteTitle;
  }

  if (giscusScript) {
    giscusScript.dataset.lang = language;
    const frame = document.querySelector('.giscus-frame');
    frame?.contentWindow?.postMessage({ giscus: { setConfig: { lang: language } } }, giscusOrigin);
  }
  window.dispatchEvent(new Event('library-language-changed'));
}

applyLanguage();
if (languageToggle) languageToggle.hidden = false;
window.addEventListener('library-posts-appended', event => localizeContent(event.detail));
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  language = savedLanguage(language);
  applyLanguage();
});
languageToggle?.addEventListener('click', () => {
  language = language === 'en' ? 'zh-CN' : 'en';
  applyLanguage();
  try {
    localStorage.setItem(languageKey, language);
  } catch {
    // The current page still uses the selected language.
  }
});
