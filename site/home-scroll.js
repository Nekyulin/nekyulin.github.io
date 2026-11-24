const cover = document.querySelector('.home-hero');
const coverTitle = document.querySelector('#home-title img');
const coverCaption = document.querySelector('.home-greeting');
const bar = document.querySelector('.library-bar-home');
const wordmark = bar.querySelector('.library-wordmark');
const barTitle = wordmark.firstElementChild;
const barCaption = wordmark.querySelector('.library-cover-caption');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let expanded;
let collapsed;
let scrollDistance;
let frame = 0;

function render() {
  frame = 0;
  const progress = Math.min(1, Math.max(0, window.scrollY / scrollDistance));
  const offset = 1 - progress * progress * (3 - 2 * progress);

  document.body.style.setProperty('--cover-progress', progress);
  document.body.style.setProperty('--figure-drop', `${progress * scrollDistance}px`);
  bar.classList.toggle('is-collapsed', progress === 1);
  if (reducedMotion.matches) {
    barTitle.style.transform = '';
    document.body.classList.add('home-motion');
    return;
  }

  const startScale = expanded.width / collapsed.width;
  const scale = 1 + (startScale - 1) * offset;
  const x = (expanded.left - collapsed.left) * offset;
  const y = (expanded.top - collapsed.top) * offset;
  barTitle.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

  const captionScale = scale / startScale;
  const captionY = y + expanded.captionOffset * captionScale;
  barCaption.style.transform = `translate3d(${x}px, ${captionY}px, 0) scale(${captionScale})`;
  document.body.classList.add('home-motion');
}

function scheduleRender() {
  if (!frame) frame = requestAnimationFrame(render);
}

function measure() {
  const title = coverTitle.getBoundingClientRect();
  const coverRect = cover.getBoundingClientRect();
  expanded = {
    left: title.left,
    top: title.top - coverRect.top,
    width: title.width,
    captionOffset: coverCaption.getBoundingClientRect().top - title.top,
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
