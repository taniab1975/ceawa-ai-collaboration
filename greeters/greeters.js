const canvas = document.querySelector('#campus .campus-greeters');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const observer = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  observer.disconnect();
  import('./scene.js').then(({mountGreeters}) => mountGreeters(canvas, reducedMotion))
    .catch(() => { canvas.hidden = true; });
});
observer.observe(canvas);
