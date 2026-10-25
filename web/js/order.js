document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const value = button.dataset.copy || '';
    try {
      await navigator.clipboard.writeText(value);
      const old = button.textContent;
      button.textContent = 'Đã chép';
      setTimeout(() => {
        button.textContent = old;
      }, 1600);
    } catch {
      button.textContent = value;
    }
  });
});

const image = document.querySelector('.qr img');
if (image) {
  image.addEventListener('error', () => {
    const note = document.createElement('p');
    note.className = 'qr-miss';
    note.textContent = 'Ảnh QR chưa tải được. Bạn chuyển khoản theo số tài khoản bên cạnh, đúng số tiền và đúng nội dung.';
    image.replaceWith(note);
  });
}
