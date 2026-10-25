const box = document.querySelector('#shotbox');
const img = document.querySelector('#shotbox-img');
const cap = document.querySelector('#shotbox-cap');

document.querySelectorAll('[data-shot]').forEach((button) => {
  button.addEventListener('click', () => {
    img.src = button.dataset.shot;
    img.alt = button.dataset.cap || '';
    cap.textContent = button.dataset.cap || '';
    box.showModal();
  });
});
