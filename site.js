const links = [...document.querySelectorAll('nav a')];
const sections = [...document.querySelectorAll('main section')];
const dialog = document.querySelector('dialog');
const pane = document.querySelector('main');
let active;

function showSlide() {
  const selected = sections.find(section => '#' + section.id === location.hash) ?? sections[0];
  if (active === selected.id) return;

  active = selected.id;
  for (const section of sections) {
    section.hidden = section !== selected;
    for (const video of section.querySelectorAll('video')) {
      if (section.hidden) video.pause();
      else video.play().catch(() => {
        // The playback controls remain available if autoplay is blocked.
      });
    }
  }
  for (const link of links) {
    if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
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

const sidebarToggle = document.querySelector('#toggle-sidebar');
const sidebarContent = document.querySelector('#slide-sidebar');
sidebarToggle.addEventListener('click', () => {
  const collapsed = document.body.classList.toggle('sidebar-collapsed');
  sidebarContent.hidden = collapsed;
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.textContent = collapsed ? 'Show slide list' : 'Hide slide list';
});
