const slides = [...document.querySelectorAll('.slide')];
const topics = document.getElementById('topics');
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
  capabilities: 'skillquest',
  'teacher-dashboard': 'skillquest',
  library: 'adaptive',
  wa: 'adaptive',
  constraints: 'adaptive',
  pilot: 'adaptive',
  basil: 'adaptive'
};
let active = 0;

function updateMedia() {
  for (const frame of document.querySelectorAll('iframe[data-src]')) {
    const hidden = frame.closest('[hidden]');
    if (!hidden && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
    if (hidden && frame.hasAttribute('data-stop-on-hide')) frame.removeAttribute('src');
  }
  for (const video of document.querySelectorAll('video')) {
    if (video.closest('[hidden]')) {
      video.pause();
      if (!video.hasAttribute('data-sound-on-by-default')) video.muted = true;
    } else {
      video.play().catch(() => {});
    }
  }
}

function showSlide() {
  closeReference();
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
  if (requested === 'capabilities' || requested === 'teacher-dashboard') {
    selectView(document.querySelector('#skillquest > .split > .media-switch > .media-choices [data-view="1"]'));
    const portfolioView = requested === 'teacher-dashboard' ? '1' : 'student';
    selectView(document.querySelector(`.portfolio-demo [data-view="${portfolioView}"]`));
  } else if (requested === 'avatar-studio') {
    selectView(document.querySelector('#blueprint > .split > .media-switch > .media-choices [data-view="2"]'));
  } else {
    updateMedia();
  }
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
  link.addEventListener('click', () => {
    topics.close();
    closeReference();
    updateMedia();
  });
}
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
});
document.addEventListener('keydown', event => {
  if (topics.open || activeReference || event.target.closest('video, input, textarea, select, .student-evidence') || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
function selectView(button) {
  const group = button.closest('.media-switch');
  for (const choice of group.querySelectorAll(':scope > .media-choices [data-view]')) {
    choice.setAttribute('aria-pressed', String(choice === button));
  }
  for (const view of group.querySelectorAll(':scope > .media-frame > [data-panel]')) {
    view.hidden = view.dataset.panel !== button.dataset.view;
  }
  updateMedia();
}
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => selectView(button));
}
for (const button of document.querySelectorAll('[data-sound]')) {
  const video = button.previousElementSibling;
  function updateSoundButton() {
    button.textContent = video.muted ? 'Turn sound on' : 'Mute sound';
    button.setAttribute('aria-pressed', String(!video.muted));
  }
  button.addEventListener('click', () => { video.muted = !video.muted; });
  video.addEventListener('volumechange', updateSoundButton);
  updateSoundButton();
}
const stage = document.getElementById('stage');
const controls = document.querySelector('.controls');
const referencePanel = document.getElementById('quick-reference');
const referenceFrame = document.getElementById('reference-frame');
const referenceActions = document.getElementById('reference-actions');
const referenceOpen = document.getElementById('reference-open');
let activeReference = null;
document.querySelector('.brand').addEventListener('click', () => {
  closeReference();
  updateMedia();
});

function closeReference(restoreFocus = false) {
  if (!activeReference) return;
  const button = activeReference;
  activeReference = null;
  button.setAttribute('aria-pressed', 'false');
  referencePanel.hidden = true;
  referenceActions.hidden = true;
  referenceFrame.removeAttribute('src');
  stage.hidden = false;
  controls.hidden = false;
  document.body.classList.remove('reference-open');
  if (restoreFocus) button.focus();
}

for (const button of document.querySelectorAll('.quick-references button')) {
  button.addEventListener('click', () => {
    if (activeReference === button) {
      closeReference();
      updateMedia();
      return;
    }
    activeReference?.setAttribute('aria-pressed', 'false');
    activeReference = button;
    button.setAttribute('aria-pressed', 'true');
    referenceFrame.title = button.textContent.trim();
    referenceFrame.src = button.dataset.embed;
    referenceOpen.href = button.dataset.open;
    stage.hidden = true;
    controls.hidden = true;
    referencePanel.hidden = false;
    referenceActions.hidden = false;
    document.body.classList.add('reference-open');
    updateMedia();
  });
}

document.getElementById('reference-close').addEventListener('click', () => {
  closeReference(true);
  updateMedia();
});
showSlide();
