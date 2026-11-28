const cover = document.querySelector('.home-hero');
const coverTitle = document.querySelector('#home-title img');
const coverCaption = document.querySelector('.home-caption');
const captionAnchor = coverCaption.parentElement;
const bar = document.querySelector('.library-bar-home');
const wordmark = bar.querySelector('.library-wordmark');
const barTitle = wordmark.firstElementChild;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let expanded;
let collapsed;
let scrollDistance;
let frame = 0;

function render() {
  frame = 0;
  const scroll = window.scrollY;
  const progress = Math.min(1, Math.max(0, scroll / scrollDistance));
  const offset = 1 - progress * progress * (3 - 2 * progress);

  document.body.style.setProperty('--cover-progress', progress);
  document.body.style.setProperty('--figure-drop', `${progress * scrollDistance}px`);
  bar.classList.toggle('is-collapsed', progress === 1);
  const animate = !reducedMotion.matches;
  const captionOpacity = animate ? Math.max(0, 1 - progress * 4) : 1;
  coverCaption.style.opacity = captionOpacity;
  coverCaption.style.visibility = captionOpacity === 0 ? 'hidden' : '';
  if (!animate) {
    barTitle.style.transform = '';
    coverCaption.style.transform = '';
    document.body.classList.add('home-motion');
    return;
  }

  const startScale = expanded.width / collapsed.width;
  const scale = 1 + (startScale - 1) * offset;
  const x = (expanded.left - collapsed.left) * offset;
  const y = (expanded.top - collapsed.top) * offset;
  barTitle.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

  if (captionOpacity > 0) {
    const captionScale = scale / startScale;
    const captionX = collapsed.left + x - expanded.left;
    const captionY = collapsed.top + y + expanded.captionOffset * captionScale - (expanded.captionTop - scroll);
    coverCaption.style.transform = `translate3d(${captionX}px, ${captionY}px, 0) scale(${captionScale})`;
  } else {
    coverCaption.style.transform = '';
  }
  document.body.classList.add('home-motion');
}

function scheduleRender() {
  if (!frame) frame = requestAnimationFrame(render);
}

function measure() {
  const title = coverTitle.getBoundingClientRect();
  const coverRect = cover.getBoundingClientRect();
  const caption = captionAnchor.getBoundingClientRect();
  expanded = {
    left: title.left,
    top: title.top - coverRect.top,
    width: title.width,
    captionTop: caption.top + window.scrollY,
    captionOffset: caption.top - title.top,
  };
  collapsed = wordmark.getBoundingClientRect();
  scrollDistance = Math.max(1, Math.floor(coverRect.height - bar.getBoundingClientRect().height));
  scheduleRender();
}

measure();
window.addEventListener('scroll', scheduleRender, { passive: true });
window.addEventListener('resize', measure);
window.addEventListener('pageshow', measure);
window.addEventListener('library-language-changed', measure);
reducedMotion.addEventListener('change', scheduleRender);

const layoutObserver = new ResizeObserver(measure);
for (const element of [cover, coverTitle, coverCaption, wordmark]) layoutObserver.observe(element);
