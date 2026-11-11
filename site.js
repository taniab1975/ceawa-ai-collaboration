const slides = [...document.querySelectorAll('.slide')];
const topics = document.getElementById('topics');
const presenter = document.getElementById('presenter');
const topicLinks = [...topics.querySelectorAll('nav a')];
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const fullscreen = document.getElementById('fullscreen');
const aliases = {
  cloning: 'careers-archon',
  'loopy-tunes': 'careers-archon',
  'how-it-started': 'blueprint',
  'avatar-studio': 'blueprint',
  possibilities: 'adaptive',
  'teacher-dashboard': 'capabilities',
  library: 'adaptive',
  wa: 'adaptive',
  constraints: 'adaptive',
  pilot: 'adaptive',
  basil: 'adaptive'
};
let active = 0;

function updateMedia() {
  for (const video of document.querySelectorAll('video')) {
    if (video.closest('[hidden]')) {
      video.pause();
      video.muted = true;
    } else {
      video.play().catch(() => {});
    }
  }
}

function showSlide() {
  const requested = location.hash.slice(1);
  const id = Object.hasOwn(aliases, requested) ? aliases[requested] : requested;
  if (id !== requested) history.replaceState(null, '', '#' + id);
  active = Math.max(0, slides.findIndex(slide => slide.id === id));
  slides.forEach((slide, index) => { slide.hidden = index !== active; });
  topicLinks.forEach((link, index) => {
    if (index === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  document.getElementById('current-topic').textContent = topicLinks[active].textContent;
  previous.disabled = active === 0;
  next.disabled = active === slides.length - 1;
  updateMedia();
  window.scrollTo(0, 0);
}

function step(amount) {
  const slide = slides[active + amount];
  if (slide) location.hash = slide.id;
}

addEventListener('hashchange', showSlide);
previous.addEventListener('click', () => step(-1));
next.addEventListener('click', () => step(1));
for (const button of document.querySelectorAll('[data-menu]')) {
  button.addEventListener('click', () => topics.showModal());
}
for (const link of topicLinks) {
  link.addEventListener('click', () => topics.close());
}
document.getElementById('notes').addEventListener('click', () => {
  const paragraphs = presenterNotes[slides[active].id].map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  });
  document.getElementById('notes-content').replaceChildren(...paragraphs);
  presenter.showModal();
});
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
});
document.addEventListener('keydown', event => {
  if (topics.open || presenter.open || event.target.closest('video, input, textarea, select') || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => {
    const group = button.closest('.media-switch');
    for (const choice of group.querySelectorAll('[data-view]')) {
      choice.setAttribute('aria-pressed', String(choice === button));
    }
    for (const view of group.querySelectorAll('[data-panel]')) {
      view.hidden = view.dataset.panel !== button.dataset.view;
    }
    updateMedia();
  });
}
for (const button of document.querySelectorAll('[data-sound]')) {
  const video = button.previousElementSibling;
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => { video.muted = !video.muted; });
  video.addEventListener('volumechange', () => {
    button.textContent = video.muted ? 'Turn sound on' : 'Mute sound';
    button.setAttribute('aria-pressed', String(!video.muted));
  });
}
showSlide();
