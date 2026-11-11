const links = [...document.querySelectorAll('nav a')];
const sections = [...document.querySelectorAll('main section')];
const dialog = document.querySelector('dialog');
let active = sections[0].id;

function updateActiveSlide() {
  const guide = Math.max(innerHeight * 0.32, document.querySelector('main').getBoundingClientRect().top);
  const current = sections.filter(section => section.getBoundingClientRect().top <= guide).at(-1);
  active = current?.id ?? sections[0].id;
  for (const link of links) {
    if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

addEventListener('scroll', updateActiveSlide, { passive: true });
addEventListener('resize', updateActiveSlide);
addEventListener('load', updateActiveSlide);
updateActiveSlide();

document.querySelector('#notes').addEventListener('click', () => {
  const slide = presenterNotes.find(note => note.id === active);
  document.querySelector('#notes-title').textContent = slide.label + ' · ' + slide.time;
  const paragraphs = slide.paragraphs.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  });
  document.querySelector('#notes-content').replaceChildren(...paragraphs);
  dialog.showModal();
  dialog.scrollTop = 0;
});
