const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const observer = new IntersectionObserver(entries => {
  for (const {target: canvas, isIntersecting} of entries) {
    if (!isIntersecting) continue;
    observer.unobserve(canvas);
    import('./scene.js?v=staff-avatars').then(({mountGreeters}) => mountGreeters(canvas, reducedMotion))
      .catch(() => { canvas.hidden = true; });
  }
});
for (const canvas of document.querySelectorAll('.campus-greeters')) observer.observe(canvas);
