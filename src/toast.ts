export function showToast(message: string, type: 'success' | 'error' = 'error') {
  let toast = document.createElement('div');
  toast.className = 'custom-toast';
  if (type === 'success') toast.classList.add('custom-toast--success');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}