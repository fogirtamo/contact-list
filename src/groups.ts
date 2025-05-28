import { showToast } from './toast';
import { generateId } from './storage';

export function renderGroupsList(groupsList: HTMLElement, tempGroups: { id: string, name: string }[], onInput: (id: string, value: string) => void) {
  groupsList.innerHTML = '';
  tempGroups.forEach((group) => {
    const wrap = document.createElement('div');
    wrap.className = 'groups-modal__input-wrap';
    wrap.dataset.id = group.id;
    wrap.innerHTML = `
      <input class="groups-modal__input" type="text" placeholder="Введите название" value="${group.name}" data-id="${group.id}" />
      <div class="groups-modal__trash-btn" title="Удалить">
        <svg class="groups-modal__trash-icon" width="16" height="20" viewBox="0 0 16 20" fill="currentColor"
          xmlns="http://www.w3.org/2000/svg">
          <path d="M1.66664 17.3889C1.66664 18.55 2.61664 19.5 3.77775 19.5H12.2222C13.3833 19.5 14.3333 18.55 14.3333 17.3889V4.72222H1.66664V17.3889ZM4.26331 9.87333L5.75164 8.385L7.99997 10.6228L10.2378 8.385L11.7261 9.87333L9.48831 12.1111L11.7261 14.3489L10.2378 15.8372L7.99997 13.5994L5.7622 15.8372L4.27386 14.3489L6.51164 12.1111L4.26331 9.87333ZM11.6944 1.55556L10.6389 0.5H5.36108L4.30553 1.55556H0.611084V3.66667H15.3889V1.55556H11.6944Z" fill="currentColor"/>
        </svg>
      </div>
    `;
    groupsList.appendChild(wrap);
    const input = wrap.querySelector('input') as HTMLInputElement;
    input.addEventListener('input', () => onInput(group.id, input.value));
  });
}

export function addNewGroup(
  groupsList: HTMLElement,
  tempGroups: { id: string, name: string }[],
  isAddGroupVisible: boolean,
  isAddGroupVisibleSetter: (v: boolean) => void,
  renderGroupsListFn: () => void
) {
  if (isAddGroupVisible) return;
  isAddGroupVisibleSetter(true);
  const wrap = document.createElement('div');
  wrap.className = 'groups-modal__input-wrap groups-modal__input-wrap--new';
  wrap.innerHTML = `
    <input class="groups-modal__input" type="text" placeholder="Введите название" />
    <div class="groups-modal__trash-btn" title="Удалить">
      <svg class="groups-modal__trash-icon" width="16" height="20" viewBox="0 0 16 20" fill="currentColor"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M1.66664 17.3889C1.66664 18.55 2.61664 19.5 3.77775 19.5H12.2222C13.3833 19.5 14.3333 18.55 14.3333 17.3889V4.72222H1.66664V17.3889ZM4.26331 9.87333L5.75164 8.385L7.99997 10.6228L10.2378 8.385L11.7261 9.87333L9.48831 12.1111L11.7261 14.3489L10.2378 15.8372L7.99997 13.5994L5.7622 15.8372L4.27386 14.3489L6.51164 12.1111L4.26331 9.87333ZM11.6944 1.55556L10.6389 0.5H5.36108L4.30553 1.55556H0.611084V3.66667H15.3889V1.55556H11.6944Z" fill="currentColor"/>
      </svg>
    </div>
  `;
  groupsList.appendChild(wrap);
  const input = wrap.querySelector('input') as HTMLInputElement;
  input.focus();
  function saveNewGroup() {
    const value = input.value.trim();
    if (!value) {
      showToast('Введите название группы');
      wrap.remove();
      isAddGroupVisibleSetter(false);
      return;
    }
    if (tempGroups.some(g => g.name.toLowerCase() === value.toLowerCase())) {
      showToast('Группа с таким именем уже существует');
      wrap.remove();
      isAddGroupVisibleSetter(false);
      return;
    }
    tempGroups.push({ id: generateId(), name: value });
    renderGroupsListFn();
    wrap.remove();
    isAddGroupVisibleSetter(false);
  }
  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') saveNewGroup();
  });
  input.addEventListener('blur', saveNewGroup);
  wrap.querySelector('.groups-modal__trash-btn')?.addEventListener('click', () => {
    wrap.remove();
    isAddGroupVisibleSetter(false);
  });
}