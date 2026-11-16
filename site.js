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
  'avatar-studio': 'campus',
  possibilities: 'adaptive',
  capabilities: 'initiative',
  'teacher-dashboard': 'initiative',
  library: 'adaptive',
  wa: 'adaptive',
  constraints: 'adaptive',
  pilot: 'adaptive',
  skillquest: 'opening',
  basil: 'adaptive'
};
let active = 0;
const disclosureButtons = [...document.querySelectorAll('.nav-disclosure > button')];
function closeDropdowns(restoreFocus = false) {
  for (const button of disclosureButtons) {
    if (button.getAttribute('aria-expanded') === 'true' && restoreFocus) button.focus();
    button.setAttribute('aria-expanded', 'false');
    document.getElementById(button.getAttribute('aria-controls')).hidden = true;
  }
}
for (const button of disclosureButtons) {
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    closeDropdowns();
    button.setAttribute('aria-expanded', String(open));
    document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
  });
}
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-disclosure')) closeDropdowns();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDropdowns(true);
});


function updateMedia() {
  for (const frame of document.querySelectorAll('iframe[data-src]')) {
    const hidden = frame.closest('[hidden]');
    if (!hidden && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
    if (hidden && frame.hasAttribute('data-stop-on-hide')) frame.removeAttribute('src');
  }
  for (const video of document.querySelectorAll('video')) {
    if (video.closest('[hidden]')) {
      video.pause();
      video.dataset.wasVisible = 'false';
      if (!video.hasAttribute('data-sound-on-by-default')) video.muted = true;
    } else {
      const soundDefault = video.hasAttribute('data-sound-on-by-default');
      if (soundDefault && video.dataset.wasVisible !== 'true') {
        video.muted = false;
        video.volume = 1;
      }
      video.dataset.wasVisible = 'true';
      video.play().catch(() => {
        if (soundDefault) {
          const button = video.nextElementSibling;
          if (button?.matches('[data-sound]')) button.textContent = 'Play with sound';
        }
      });
    }
  }
}

function showSlide() {
  closeDropdowns();
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
  document.querySelectorAll('.topic-bar a, .topic-cards a').forEach(link => {
    if (link.hash === '#' + slides[active].id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (requested === 'capabilities' || requested === 'teacher-dashboard') {
    selectView(document.querySelector('#initiative [data-view="portfolio-live"]'));
  } else if (requested === 'avatar-studio') {
    selectView(document.querySelector('#campus > .split > .media-switch > .media-choices [data-view="7"]'));
  } else {
    updateMedia();
  }
  window.scrollTo(0, 0);
}

function step(amount) {
  const slide = slides[active + amount];
  if (slide) location.hash = slide.id;
}

document.querySelectorAll('.topic-bar a, .topic-cards a, #topics nav a').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    history.pushState(null, '', link.hash);
    topics.close();
    showSlide();
  });
});
addEventListener('popstate', showSlide);
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
  if (group.classList.contains('initiative-switch')) {
    const view = button.dataset.view;
    const portfolio = view === 'portfolio' || view === 'portfolio-live';
    const archon = view === 'archon' || view === 'archon-live';
    const delivery = view !== 'old' && view !== 'blueprint';
    const expandedMenus = {
      'initiative-delivery-menu': delivery,
      'initiative-portfolio-menu': portfolio,
      'initiative-archon-menu': archon
    };
    for (const parent of group.querySelectorAll('[data-initiative-menu]')) {
      const expanded = expandedMenus[parent.dataset.initiativeMenu];
      parent.setAttribute('aria-expanded', String(expanded));
      parent.setAttribute('aria-pressed', String(expanded));
      group.querySelector('#' + parent.dataset.initiativeMenu).hidden = !expanded;
    }
    for (const child of group.querySelectorAll('.initiative-menu-row [data-view]:not([data-initiative-menu])')) {
      child.setAttribute('aria-pressed', String(child.dataset.view === view));
    }
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
  button.addEventListener('click', () => {
    if (video.paused) { video.muted = false; video.play().catch(() => {}); }
    else video.muted = !video.muted;
    updateSoundButton();
  });
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
    closeDropdowns();
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
