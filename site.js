const links = [...document.querySelectorAll('nav a')];
const sections = [...document.querySelectorAll('main section')];
const dialog = document.querySelector('dialog');
const pane = document.querySelector('main');
let active;

function showSlide() {
  if (location.hash === '#loopy-tunes') history.replaceState(null, '', '#careers-archon');
  if (location.hash === '#avatar-studio') history.replaceState(null, '', '#how-it-started');
  const selected = sections.find(section => '#' + section.id === location.hash) ?? sections[0];
  if (active === selected.id) return;

  active = selected.id;
  for (const section of sections) {
    section.hidden = section !== selected;
    for (const video of section.querySelectorAll('video')) {
      if (section.hidden) {
        video.pause();
        if (video.id) video.muted = true;
      }
      else video.play().catch(() => {
        // The playback controls remain available if autoplay is blocked.
      });
    }
  }
  for (const link of links) {
    if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  if (active === 'blueprint') {
    const frame = selected.querySelector('iframe');
    if (!frame.hasAttribute('src')) frame.src = selected.querySelector('#blueprint-live-link').href;
  }
  pane.scrollTop = 0;
}

addEventListener('hashchange', showSlide);
showSlide();

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  pane.focus();
});

document.querySelector('#notes').addEventListener('click', () => {
  const slide = presenterNotes.find(note => note.id === active);
  document.querySelector('#notes-title').textContent = slide.time ? slide.label + ' · ' + slide.time : slide.label;
  const paragraphs = slide.paragraphs.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  });
  document.querySelector('#notes-content').replaceChildren(...paragraphs);
  dialog.showModal();
  dialog.scrollTop = 0;
});

const sidebar = document.querySelector('#slide-panel');
const sidebarToggle = document.querySelector('#toggle-sidebar');
const edge = document.querySelector('#slide-edge');
let pinned = true;

function setSidebarOpen(open) {
  sidebar.inert = !open;
  document.body.classList.toggle('sidebar-open', open);
  edge.setAttribute('aria-expanded', String(open));
}

function hideSidebar() {
  setSidebarOpen(false);
  edge.focus({preventScroll:true});
}

sidebarToggle.addEventListener('click', () => {
  pinned = !pinned;
  document.body.classList.toggle('sidebar-collapsed', !pinned);
  edge.hidden = pinned;
  sidebarToggle.textContent = pinned ? 'Hide slide list' : 'Pin slide list';
  if (pinned) setSidebarOpen(true);
  else hideSidebar();
});

edge.addEventListener('click', () => {
  setSidebarOpen(true);
  sidebarToggle.focus({preventScroll:true});
});
document.addEventListener('pointermove', event => {
  if (pinned || event.pointerType !== 'mouse') return;
  const withinSidebar = !sidebar.inert && event.clientX < sidebar.getBoundingClientRect().right;
  setSidebarOpen(event.clientX < 12 || withinSidebar);
});
document.addEventListener('pointerdown', event => {
  if (!pinned && !sidebar.contains(event.target) && event.target !== edge) setSidebarOpen(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !pinned && !sidebar.inert && !dialog.open) hideSidebar();
});

for (const button of document.querySelectorAll('[data-sound-for]')) {
  const video = document.getElementById(button.dataset.soundFor);
  video.addEventListener('volumechange', () => {
    const audible = !video.muted && video.volume > 0;
    button.setAttribute('aria-pressed', String(audible));
    button.textContent = audible ? 'Turn sound off' : 'Turn sound on';
  });
  button.addEventListener('click', () => {
    video.muted = !video.muted && video.volume > 0;
    if (!video.muted && video.volume === 0) video.volume = 1;
    if (!video.muted) video.play().catch(() => {});
  });
}
