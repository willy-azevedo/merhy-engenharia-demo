(() => {
  const photos = [...document.querySelectorAll('.work-photo')];
  const viewer = document.querySelector('.work-viewer');
  const image = viewer.querySelector('.work-viewer-image');
  const title = viewer.querySelector('h2');
  const counter = viewer.querySelector('.work-viewer-count');
  let index = 0;
  let opener;
  function show(next) {
    index = (next + photos.length) % photos.length;
    const photo = photos[index];
    image.src = photo.querySelector('img').getAttribute('src');
    image.alt = photo.querySelector('img').alt;
    title.textContent = photo.dataset.name;
    counter.textContent = photos.length === 1 ? 'Ponta Grossa · PR' : `${index + 1} / ${photos.length} · Ponta Grossa`;
  }
  photos.forEach((photo, photoIndex) => photo.addEventListener('click', () => {
    opener = photo;
    show(photoIndex);
    viewer.showModal();
    document.documentElement.classList.add('work-viewer-open');
  }));
  viewer.querySelector('.work-viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('[data-work-previous]').addEventListener('click', () => show(index - 1));
  viewer.querySelector('[data-work-next]').addEventListener('click', () => show(index + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  viewer.addEventListener('click', event => {
    const bounds = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('work-viewer-open');
    opener?.focus();
  });
})();
