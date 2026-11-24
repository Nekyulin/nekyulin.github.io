const postList = document.querySelector('.post-list');
const listTail = document.querySelector('.post-list-tail');
const nextPageLink = listTail?.querySelector('.post-list-next');

if (postList && nextPageLink && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.unobserve(listTail);
    appendNextPage();
  }, { rootMargin: '0px 0px 280px' });

  async function appendNextPage() {
    postList.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(nextPageLink.href);
      if (!response.ok) throw new Error('Could not load posts.');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const rows = page.querySelectorAll('.post-list > li');
      if (!rows.length) throw new Error('No posts were returned.');

      const batch = document.createDocumentFragment();
      for (const row of rows) batch.append(row);
      window.dispatchEvent(new CustomEvent('library-posts-appended', { detail: batch }));
      postList.append(batch);

      const next = page.querySelector('.post-list-next');
      if (next) {
        nextPageLink.setAttribute('href', next.getAttribute('href'));
        observer.observe(listTail);
      } else {
        observer.disconnect();
        listTail.remove();
      }
    } catch {
      observer.disconnect();
      listTail.classList.remove('auto-loading');
    } finally {
      postList.removeAttribute('aria-busy');
    }
  }

  listTail.classList.add('auto-loading');
  observer.observe(listTail);
}
