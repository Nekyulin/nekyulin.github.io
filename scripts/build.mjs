import { cp, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { katex } from '@mdit/plugin-katex';
import MarkdownIt from 'markdown-it';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const postsPath = join(root, 'posts');
const outputPath = join(root, 'dist');
const stylesheet = await readFile(join(root, 'site', 'style.css'));
const stylesheetVersion = createHash('sha256').update(stylesheet).digest('hex').slice(0, 12);
const katexPath = dirname(fileURLToPath(import.meta.resolve('katex/dist/katex.min.css')));
const webFonts = [
  { name: 'cascadia-code', styles: ['index.css', 'wght-italic.css'] },
  { name: 'noto-serif-sc', styles: ['index.css'] },
];
const siteTitle = '御琳书屋';
const welcome = '谢谢你来看我。';
const markdown = new MarkdownIt({ linkify: true }).use(katex, { delimiters: 'all' });
const { escapeHtml } = markdown.utils;
const postPageSize = 12;
const englishDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
});

const siteBase = process.env.BLOG_SITE_URL?.trim().replace(/\/+$/, '');
const siteUrl = siteBase ? new URL(`${siteBase}/`) : undefined;
if (siteUrl && (siteUrl.protocol !== 'https:' || siteUrl.username || siteUrl.password || siteUrl.search || siteUrl.hash)) {
  throw new Error('BLOG_SITE_URL 必须是网站的公开 HTTPS 地址。');
}

const analyticsSite = process.env.GOATCOUNTER_SITE?.trim().toLowerCase();
if (analyticsSite && !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(analyticsSite)) {
  throw new Error('GOATCOUNTER_SITE 填写 GoatCounter 子域名前缀，例如 tc-blog。');
}

const commentsRepo = process.env.GISCUS_REPO?.trim();
const commentsRepoId = process.env.GISCUS_REPO_ID?.trim();
const commentsCategory = process.env.GISCUS_CATEGORY?.trim();
const commentsCategoryId = process.env.GISCUS_CATEGORY_ID?.trim();
const commentsEnabled = Boolean(commentsRepoId || commentsCategory || commentsCategoryId);
if (commentsEnabled && (!commentsRepo || !commentsRepoId || !commentsCategory || !commentsCategoryId || !siteUrl)) {
  throw new Error('启用评论需要 GISCUS_REPO、GISCUS_REPO_ID、GISCUS_CATEGORY、GISCUS_CATEGORY_ID 和 BLOG_SITE_URL。');
}

function renderWordmark(home, { decorative = false, language } = {}) {
  const english = language === 'en';
  const file = english ? 'library-title.svg' : 'library-title-zh.svg';
  const alt = decorative ? '' : english ? "Nekyulin's Library" : siteTitle;
  const size = english ? 'width="864" height="101"' : 'width="3960" height="951"';
  return `<img${language ? '' : ' data-wordmark'} src="${home}${file}" alt="${escapeHtml(alt)}" ${size}>`;
}

function renderLanguageToggle() {
  return `<button class="icon-action language-toggle" type="button" lang="en" aria-label="Switch to English" hidden>
    <span class="action-icon language-icon" aria-hidden="true"></span>
  </button>`;
}

async function readTags() {
  const config = JSON.parse((await readFile(join(root, 'tags.json'), 'utf8')).replace(/^\uFEFF/, ''));
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('tags.json 应为以标签 ID 为键的对象。');
  }

  const ids = new Map();
  const names = new Map();
  for (const [id, entry] of Object.entries(config)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(id)) {
      throw new Error(`tags.json 中的标签 ID 无法用于网址：${id}`);
    }
    const zh = typeof entry?.['zh-CN'] === 'string' ? entry['zh-CN'].trim().normalize() : '';
    const en = typeof entry?.en === 'string' ? entry.en.trim().normalize() : '';
    if (!zh || !en) throw new Error(`标签 ${id} 需要填写 zh-CN 和 en。`);

    const tag = { id, zh, en };
    for (const name of new Set([zh.toLowerCase(), en.toLowerCase()])) {
      if (names.has(name)) throw new Error(`标签名称重复：${name}。请复用 ${names.get(name).id}。`);
      names.set(name, tag);
    }
    ids.set(id, tag);
  }
  return { ids, names };
}

function renderArticleTranslation(translation) {
  const icon = '<span class="action-icon language-icon" aria-hidden="true"></span>';
  const attributes = 'class="icon-action article-translation"';
  if (!translation) {
    return `<button ${attributes} type="button" aria-label="本文暂无另一语言版本" data-i18n-label="noTranslation" disabled>${icon}</button>`;
  }
  const [label, key] = translation.lang === 'en' ? ['阅读英文版', 'readEnglish'] : ['阅读中文版', 'readChinese'];
  return `<a ${attributes} href="${translation.href}" hreflang="${translation.lang}" aria-label="${label}" data-i18n-label="${key}">${icon}</a>`;
}

function layout({ title, description, home, path = '', content, math = false, homepage = false, articleTranslation, articleLanguage, hasMorePosts = false }) {
  const fontStyles = webFonts.flatMap(({ name, styles }) => styles.map(style =>
    `<link rel="stylesheet" href="${home}fonts/${name}/${style}">`));
  const canonical = siteUrl ? new URL(path, siteUrl).href : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ''}
  ${fontStyles.join('\n  ')}
  <link rel="stylesheet" href="${home}style.css?v=${stylesheetVersion}">
  ${math ? `<link rel="stylesheet" href="${home}katex/katex.min.css">` : ''}
  <script src="${home}language.js" defer></script>
</head>
<body>
  <header class="library-bar${homepage ? ' library-bar-home' : ''}"${homepage ? ' aria-hidden="true"' : ''}>
    ${homepage ? '' : `<div class="library-bar-actions">
      <a class="icon-action library-back" href="${home}#posts" aria-label="返回文章列表" data-i18n-label="backToPosts">
        <span class="action-icon back-icon" aria-hidden="true"></span>
      </a>
      ${articleTranslation === undefined ? '' : renderArticleTranslation(articleTranslation)}
    </div>`}
    <div class="library-wordmark"${articleLanguage ? ` lang="${articleLanguage}"` : ''}>
      ${renderWordmark(home, { decorative: homepage, language: articleLanguage })}
      ${homepage ? `<p class="home-caption library-cover-caption" data-i18n="welcome">${welcome}</p>` : ''}
    </div>
  </header>
  <main${homepage ? '' : ' class="article-main"'}>${content}</main>
  ${homepage ? `<script src="${home}home-scroll.js" defer></script>` : ''}
  ${hasMorePosts ? `<script src="${home}post-list.js" defer></script>` : ''}
  ${analyticsSite ? `<script async src="https://gc.zgo.at/count.js" data-goatcounter="https://${analyticsSite}.goatcounter.com/count"></script>` : ''}
</body>
</html>\n`;
}

async function readPost(slug, tags) {
  const folder = join(postsPath, slug);
  try {
    const [metadata, body] = await Promise.all([
      readFile(join(folder, 'meta.json'), 'utf8'),
      readFile(join(folder, 'index.md'), 'utf8'),
    ]);
    const {
      title, date, summary = '', tag = '', lang = 'zh-CN', translation, pinned = false, pinPriority = 0,
    } = JSON.parse(metadata.replace(/^\uFEFF/, ''));
    if (typeof title !== 'string' || !title.trim() || typeof summary !== 'string') {
      throw new Error('meta.json 需要填写 title，summary 可以省略，二者都使用字符串。');
    }
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        new Date(date).toJSON()?.slice(0, 10) !== date) {
      throw new Error('meta.json 中的 date 必须是有效的 YYYY-MM-DD 日期。');
    }
    if (typeof tag !== 'string') throw new Error('meta.json 中的 tag 可以省略，填写时只接受一个字符串。');
    if (lang !== 'zh-CN' && lang !== 'en') throw new Error('meta.json 中的 lang 必须是 zh-CN 或 en。');
    if (typeof pinned !== 'boolean') throw new Error('pinned 必须是 true 或 false。');
    if (!Number.isSafeInteger(pinPriority)) throw new Error('pinPriority 必须是整数。');

    const tagName = tag.trim().normalize();
    const category = tags.ids.get(tagName) || tags.names.get(tagName.toLowerCase());
    if (tagName && !category) throw new Error(`标签 ${tagName} 未在 tags.json 中定义。`);

    const alternate = await readTranslation(folder, lang, translation);
    if (alternate && Boolean(summary.trim()) !== Boolean(alternate.summary)) {
      throw new Error('双语文章的原文和译文要同时填写摘要，或同时省略。');
    }
    const files = await readdir(folder, { withFileTypes: true });
    return {
      slug,
      url: `posts/${encodeURIComponent(slug)}/`,
      title: title.trim(),
      date,
      lang,
      tag: category,
      pinned,
      pinPriority,
      summary: summary.trim(),
      html: markdown.render(body.replace(/^\uFEFF/, '')),
      translation: alternate,
      assets: files.some(file => file.name === 'assets' && file.isDirectory())
        ? join(folder, 'assets')
        : undefined,
    };
  } catch (error) {
    throw new Error(`posts/${slug} · ${error.message}`, { cause: error });
  }
}

async function readTranslation(folder, sourceLanguage, metadata) {
  if (metadata === undefined) return;
  if (!metadata || typeof metadata.title !== 'string' || !metadata.title.trim() ||
      (metadata.summary !== undefined && typeof metadata.summary !== 'string')) {
    throw new Error('translation 需要填写 title，可以填写 summary。');
  }

  const lang = sourceLanguage === 'en' ? 'zh-CN' : 'en';
  const file = `index.${lang}.md`;
  const body = await readFile(join(folder, file), 'utf8');
  return {
    lang,
    title: metadata.title.trim(),
    summary: metadata.summary?.trim() || '',
    html: markdown.render(body.replace(/^\uFEFF/, '')),
    file: `${lang}.html`,
  };
}

function tagPath(tag) {
  return `tags/${tag.id}/`;
}

function renderLocalizedCopy(chinese, english, language) {
  if (language) return escapeHtml(language === 'en' ? english : chinese);
  return `<span class="localized-copy" lang="zh-CN">${escapeHtml(chinese)}</span><span class="localized-copy" lang="en">${escapeHtml(english)}</span>`;
}

function renderPostMetadata({ date, tag }, home, language) {
  const dateLabel = renderLocalizedCopy(date, englishDate.format(new Date(date)), language);
  return `<div class="post-meta">
        <time datetime="${date}">${dateLabel}</time>
        ${tag ? `<a class="post-tag" href="${home}${tagPath(tag)}">${renderLocalizedCopy(tag.zh, tag.en, language)}</a>` : ''}
      </div>`;
}

function renderListItem(post, home) {
  const postPath = `${home}${escapeHtml(post.url)}`;
  const versions = post.translation ? [
    { ...post, href: postPath },
    { ...post.translation, href: `${postPath}${post.translation.file}` },
  ] : [{ ...post, href: postPath }];
  const attributes = version => `lang="${version.lang}"${post.translation ? ' class="localized-copy"' : ''}`;
  const titles = versions.map(version => `<a ${attributes(version)} href="${version.href}">${escapeHtml(version.title)}</a>`).join('');
  const summaries = versions.filter(version => version.summary).map(version =>
    `<p ${attributes(version)}>${escapeHtml(version.summary)}</p>`).join('');
  return `
    <li>
      ${renderPostMetadata(post, home)}
      <div>
        <h2>${titles}</h2>
        ${summaries}
      </div>
      ${post.pinned ? `<span class="post-pin" role="img" aria-label="已置顶" data-i18n-label="pinned">
        <span class="action-icon pin-icon" aria-hidden="true"></span>
      </span>` : ''}
    </li>`;
}

function listPageName(page) {
  return page === 1 ? 'index.html' : `page-${page}.html`;
}

function renderPostList(posts, home, page) {
  if (!posts.length) return '<p data-i18n="noPosts">还没有发表文章。</p>';
  const items = posts.slice((page - 1) * postPageSize, page * postPageSize);
  const next = posts.length > page * postPageSize ? `
    <div class="post-list-tail">
      <a class="post-list-next" rel="next" href="./${listPageName(page + 1)}" data-i18n="morePosts">更多文章</a>
    </div>` : '';
  return `<ul class="post-list">${items.map(post => renderListItem(post, home)).join('')}</ul>${next}`;
}

function renderIndex(posts, page) {
  const homepage = page === 1;
  return layout({
    title: siteTitle,
    description: `${siteTitle} 的文章。`,
    home: './',
    homepage,
    path: homepage ? '' : listPageName(page),
    hasMorePosts: posts.length > page * postPageSize,
    content: `
    ${homepage ? `<section class="home-hero" aria-labelledby="home-title">
      <div class="home-art" aria-hidden="true">
        <div class="home-art-background"></div>
        <img src="./home-illustration.svg" alt="" width="1024" height="1536">
      </div>
      <div class="home-inner home-intro">
        <h1 id="home-title">${renderWordmark('./')}</h1>
        <p class="home-caption home-greeting" data-i18n="welcome">${welcome}</p>
        <div class="home-actions">
          <a class="icon-action home-email" href="mailto:Nekyulin@outlook.com" aria-label="发送邮件" data-i18n-label="sendEmail">
            <span class="action-icon email-icon" aria-hidden="true"></span>
          </a>
          ${renderLanguageToggle()}
        </div>
      </div>
    </section>` : ''}
    <section id="posts"${homepage ? ' class="home-inner home-posts"' : ''} aria-label="文章" data-i18n-label="posts">
      ${renderPostList(posts, './', page)}
    </section>`,
  });
}

function renderTagPage(tag, posts, page) {
  const path = tagPath(tag);
  return layout({
    title: `${tag.zh} | ${siteTitle}`,
    description: tag.zh,
    home: '../../',
    path: page === 1 ? path : `${path}${listPageName(page)}`,
    hasMorePosts: posts.length > page * postPageSize,
    content: `
    <header class="post-header">
      <h1 id="tag-title">${renderLocalizedCopy(tag.zh, tag.en)}</h1>
    </header>
    ${renderPostList(posts, '../../', page)}`,
  });
}

function renderComments(slug) {
  if (!commentsEnabled) return '';
  const theme = new URL('comments.css', siteUrl).href;
  return `
    <section class="article-comments" aria-labelledby="comments-title">
      <h2 id="comments-title" data-i18n="comments">评论</h2>
      <div class="giscus" id="comments"></div>
      <script src="https://giscus.app/client.js"
        data-repo="${escapeHtml(commentsRepo)}"
        data-repo-id="${escapeHtml(commentsRepoId)}"
        data-category="${escapeHtml(commentsCategory)}"
        data-category-id="${escapeHtml(commentsCategoryId)}"
        data-mapping="specific"
        data-term="${escapeHtml(slug)}"
        data-strict="1"
        data-reactions-enabled="0"
        data-theme="${escapeHtml(theme)}"
        data-lang="zh-CN"
        data-loading="lazy"
        crossorigin="anonymous"
        defer></script>
    </section>`;
}

function renderPost(post, translated = false) {
  const { slug, url, date, tag, translation } = post;
  const { title, summary, html, lang } = translated ? translation : post;
  const articleTranslation = translated ? { href: './', lang: post.lang } :
    translation ? { href: `./${translation.file}`, lang: translation.lang } : null;
  return layout({
    title: `${title} | ${siteTitle}`,
    description: summary || title,
    home: '../../',
    path: url,
    math: true,
    articleTranslation,
    articleLanguage: lang,
    content: `
    <article lang="${lang}">
      <header class="post-header">
        <h1>${escapeHtml(title)}</h1>
        ${renderPostMetadata({ date, tag }, '../../', lang)}
      </header>
      <div class="prose">${html}</div>
    </article>${renderComments(slug)}`,
  });
}

function comparePosts(first, second) {
  if (first.pinned !== second.pinned) return Number(second.pinned) - Number(first.pinned);
  if (first.pinned && first.pinPriority !== second.pinPriority) return second.pinPriority - first.pinPriority;
  return second.date.localeCompare(first.date) || first.slug.localeCompare(second.slug, 'en');
}

async function writeListPages(destination, posts, renderPage) {
  await mkdir(destination, { recursive: true });
  const pages = Math.max(1, Math.ceil(posts.length / postPageSize));
  for (let page = 1; page <= pages; page += 1) {
    await writeFile(join(destination, listPageName(page)), renderPage(page));
  }
}

async function build() {
  const tags = await readTags();
  const folders = await readdir(postsPath, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const posts = await Promise.all(folders
    .filter(folder => folder.isDirectory() && !folder.name.startsWith('.'))
    .map(folder => readPost(folder.name, tags)));
  posts.sort(comparePosts);

  const postsByTag = new Map();
  for (const post of posts) {
    if (!post.tag) continue;
    if (!postsByTag.has(post.tag)) postsByTag.set(post.tag, []);
    postsByTag.get(post.tag).push(post);
  }

  const nextOutput = await mkdtemp(join(root, '.blog-build-'));
  try {
    const mathAssets = join(nextOutput, 'katex');
    await mkdir(mathAssets);
    await cp(join(katexPath, 'katex.min.css'), join(mathAssets, 'katex.min.css'));
    await cp(join(katexPath, 'fonts'), join(mathAssets, 'fonts'), { recursive: true });
    await cp(join(katexPath, '..', 'LICENSE'), join(mathAssets, 'LICENSE'));
    for (const { name, styles } of webFonts) {
      const source = dirname(fileURLToPath(import.meta.resolve(`@fontsource-variable/${name}`)));
      const destination = join(nextOutput, 'fonts', name);
      await mkdir(destination, { recursive: true });
      for (const file of [...styles, 'LICENSE']) {
        await cp(join(source, file), join(destination, file));
      }
      await cp(join(source, 'files'), join(destination, 'files'), { recursive: true });
    }
    await writeFile(join(nextOutput, 'style.css'), stylesheet);
    await cp(join(root, 'site', 'icons'), join(nextOutput, 'icons'), { recursive: true });
    await cp(join(root, 'site', 'library-title.svg'), join(nextOutput, 'library-title.svg'));
    await cp(join(root, 'site', 'library-title-zh.svg'), join(nextOutput, 'library-title-zh.svg'));
    await cp(join(root, 'site', 'home-scroll.js'), join(nextOutput, 'home-scroll.js'));
    await cp(join(root, 'site', 'language.js'), join(nextOutput, 'language.js'));
    await cp(join(root, 'site', 'post-list.js'), join(nextOutput, 'post-list.js'));
    if (commentsEnabled) await cp(join(root, 'site', 'comments.css'), join(nextOutput, 'comments.css'));
    await cp(join(root, 'site', 'home-illustration.svg'), join(nextOutput, 'home-illustration.svg'));
    await writeListPages(nextOutput, posts, page => renderIndex(posts, page));
    for (const [tag, taggedPosts] of postsByTag) {
      const destination = join(nextOutput, tagPath(tag));
      await writeListPages(destination, taggedPosts, page => renderTagPage(tag, taggedPosts, page));
    }
    for (const post of posts) {
      const destination = join(nextOutput, 'posts', post.slug);
      await mkdir(destination, { recursive: true });
      await writeFile(join(destination, 'index.html'), renderPost(post));
      if (post.translation) await writeFile(join(destination, post.translation.file), renderPost(post, true));
      if (post.assets) {
        await cp(post.assets, join(destination, 'assets'), {
          recursive: true,
          filter: async source => !(await lstat(source)).isSymbolicLink(),
        });
      }
    }

    const previous = await lstat(outputPath).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (previous && (!previous.isDirectory() || await realpath(outputPath) !== outputPath)) {
      throw new Error('dist 必须是构建输出目录。');
    }
    await rm(outputPath, { recursive: true, force: true });
    await rename(nextOutput, outputPath);
  } finally {
    await rm(nextOutput, { recursive: true, force: true });
  }
  console.log(`已生成 ${posts.length} 篇文章和首页（dist/）。`);
}

await build();
