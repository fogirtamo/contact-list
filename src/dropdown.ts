import { getAllGroupNamesFromStorage } from './storage';

export function renderDropdownGroups(list: HTMLElement, placeholder: HTMLElement, dropdown: HTMLElement) {
  if (!list) return;
  list.innerHTML = '';
  const groupNames = getAllGroupNamesFromStorage();
  groupNames.forEach(name => {
    const item = document.createElement('div');
    item.className = 'custom-dropdown__item';
    item.textContent = name;
    list.appendChild(item);
    item.addEventListener('click', () => {
      document.querySelectorAll('.custom-dropdown__item').forEach(i => i.classList.remove('custom-dropdown__item--active'));
      item.classList.add('custom-dropdown__item--active');
      placeholder.textContent = name;
      placeholder.style.opacity = '1';
      dropdown?.classList.remove('open');
    });
  });
}