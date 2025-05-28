import './style.scss';
import IMask from 'imask';
import { Contact, ContactValidator } from './classes';

/* -------------------- Переменные DOM -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Основные элементы
  const openBtn = document.querySelector('.contact-list__groups-btn');
  const modal = document.getElementById('groupsModal');
  const closeBtn = document.getElementById('groupsModalClose');
  const overlay = modal?.querySelector('.groups-modal__overlay');
  const confirmModal = document.getElementById('confirmModal');
  const confirmClose = document.getElementById('confirmModalClose');
  const confirmBackdrop = confirmModal?.querySelector('.confirm-modal__backdrop');
  const confirmCancel = confirmModal?.querySelector('.confirm-modal__cancel-btn');
  const addContactBtn = document.querySelector('.contact-list__add-btn');
  const contactModal = document.getElementById('contactModal');
  const contactModalClose = document.getElementById('contactModalClose');
  const contactModalOverlay = contactModal?.querySelector('.contact-modal__overlay');
  const dropdown = document.getElementById('groupDropdown');
  const selected = dropdown?.querySelector('.custom-dropdown__selected') as HTMLElement;
  const list = dropdown?.querySelector('.custom-dropdown__list') as HTMLElement;
  const placeholder = dropdown?.querySelector('.custom-dropdown__placeholder') as HTMLElement;
  const saveBtn = document.querySelector('.contact-modal__save-btn');
  const fioInput = document.querySelector('.contact-modal__input[placeholder="Введите ФИО"]') as HTMLInputElement;
  const phoneInput = document.querySelector('.contact-modal__input[placeholder="Введите номер"]') as HTMLInputElement;
  const groupsList = document.querySelector('.groups-modal__contacts-list') as HTMLElement | null;
  const confirmDeleteBtn = document.querySelector('.confirm-modal__delete-btn');
  const confirmCancelBtn = document.querySelector('.confirm-modal__cancel-btn');
  const confirmCloseBtn = document.getElementById('confirmModalClose');
  const saveGroupsBtn = document.querySelector('.groups-modal__save-btn');
  const editContactModal = document.getElementById('editContactModal');
  const editContactModalClose = document.getElementById('editContactModalClose');
  const editFioInput = document.getElementById('editFioInput') as HTMLInputElement;
  const editPhoneInput = document.getElementById('editPhoneInput') as HTMLInputElement;
  const editGroupDropdown = document.getElementById('editGroupDropdown');
  const editGroupPlaceholder = editGroupDropdown?.querySelector('.custom-dropdown__placeholder') as HTMLElement;
  const editGroupList = editGroupDropdown?.querySelector('.custom-dropdown__list') as HTMLElement;
  const editContactSaveBtn = document.getElementById('editContactSaveBtn');

  /* -------------------- Глобальные переменные -------------------- */
  let tempGroups: { id: string, name: string }[] = [];
  let groupToDeleteId: string | null = null;
  let groupToDeleteName: string | null = null;
  let isAddGroupVisible = false;
  let editingContact: { name: string, number: string, group: string } | null = null;

  /* -------------------- Маска для телефона -------------------- */
  if (phoneInput) {
    IMask(phoneInput, {
      mask: '+{7} (000) 000-00-00'
    });
  }

  /* -------------------- Утилиты -------------------- */
  function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }
  function showToast(message: string, type: 'success' | 'error' = 'error') {
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
  function getAllGroupsFromStorage(): { id: string, name: string }[] {
    const groups: { id: string, name: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'loglevel') {
        groups.push({ id: generateId(), name: key });
      }
    }
    return groups;
  }
  function getAllGroupNamesFromStorage(): string[] {
    const names: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'loglevel') names.push(key);
    }
    return names;
  }

  /* -------------------- Модалки: открытие/закрытие -------------------- */
  function closeModal() {
    modal?.classList.remove('groups-modal--active');
  }
  function closeContactModal() {
    contactModal?.classList.remove('contact-modal--active');
    document.querySelectorAll('.contact-modal__input--error').forEach(el => el.classList.remove('contact-modal__input--error'));
    document.querySelectorAll('.custom-dropdown__selected--error').forEach(el => el.classList.remove('custom-dropdown__selected--error'));
    document.querySelectorAll('.contact-modal__error-message').forEach(el => el.remove());
    if (contactModal) {
      delete (contactModal as any)._editContact;
      const title = contactModal.querySelector('.contact-modal__title');
      if (title) title.textContent = 'Добавление контакта';
    }
  }
  function closeConfirmModal() {
    confirmModal?.classList.remove('confirm-modal--active');
    groupToDeleteId = null;
    groupToDeleteName = null;
  }
  function closeEditContactModal() {
    editContactModal?.classList.remove('contact-modal--active');
    editingContact = null;
  }

  /* -------------------- События: закрытие модалок -------------------- */
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  if (contactModalClose) contactModalClose.addEventListener('click', closeContactModal);
  if (contactModalOverlay) contactModalOverlay.addEventListener('click', closeContactModal);

  if (confirmClose) confirmClose.addEventListener('click', closeConfirmModal);
  if (confirmBackdrop) confirmBackdrop.addEventListener('click', closeConfirmModal);
  if (confirmCancel) confirmCancel.addEventListener('click', closeConfirmModal);
  if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeConfirmModal);
  if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', closeConfirmModal);

  /* -------------------- Открытие модалок -------------------- */
  if (addContactBtn && contactModal) {
    addContactBtn.addEventListener('click', () => {
      document.querySelectorAll('.contact-modal__input--error').forEach(el => el.classList.remove('contact-modal__input--error'));
      document.querySelectorAll('.custom-dropdown__selected--error').forEach(el => el.classList.remove('custom-dropdown__selected--error'));
      document.querySelectorAll('.contact-modal__error-message').forEach(el => el.remove());
      contactModal.classList.add('contact-modal--active');
    });
  }
  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      tempGroups = getAllGroupsFromStorage();
      renderGroupsList();
      modal.classList.add('groups-modal--active');
    });
  }

  /* -------------------- Группы: добавление, удаление, переименование -------------------- */
  if (saveGroupsBtn) {
    saveGroupsBtn.addEventListener('click', () => {
      const names = tempGroups.map(g => g.name.trim().toLowerCase());
      const hasDuplicates = names.some((name, idx) => names.indexOf(name) !== idx);
      if (hasDuplicates) {
        showToast('Группы должны иметь уникальные названия');
        return;
      }
      // Получаем старые группы
      const oldGroups: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== 'loglevel') oldGroups.push(key);
      }
      // Сохраняем соответствие id -> старое имя
      const oldGroupsById: Record<string, string> = {};
      let idx = 0;
      for (const key of oldGroups) {
        if (tempGroups[idx]) oldGroupsById[tempGroups[idx].id] = key;
        idx++;
      }
      // Переносим контакты при переименовании
      tempGroups.forEach(g => {
        const oldName = oldGroupsById[g.id];
        if (oldName && oldName !== g.name) {
          const contacts = localStorage.getItem(oldName);
          if (contacts !== null) {
            localStorage.setItem(g.name, contacts);
            localStorage.removeItem(oldName);
          }
        } else if (!oldName) {
          localStorage.setItem(g.name, JSON.stringify([]));
        }
      });
      // Удаляем удалённые группы
      oldGroups.forEach(name => {
        if (!tempGroups.some(g => g.name === name)) {
          localStorage.removeItem(name);
        }
      });
      modal?.classList.remove('groups-modal--active');
      renderGroupsBlocks();
      showToast('Группы успешно сохранены', 'success');
    });
  }

  // Рендер списка групп в модалке
  function renderGroupsList() {
    if (!groupsList) return;
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
      // Обработчик изменения имени группы
      const input = wrap.querySelector('input') as HTMLInputElement;
      input.addEventListener('input', () => {
        const id = input.dataset.id;
        if (!id) return;
        const group = tempGroups.find(g => g.id === id);
        if (group) group.name = input.value;
      });
    });
  }

  // Добавление новой группы
  const addGroupBtn = document.querySelector('.groups-modal__add-btn');
  if (addGroupBtn && groupsList) {
    addGroupBtn.addEventListener('click', () => {
      if (isAddGroupVisible) return;
      isAddGroupVisible = true;
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
          isAddGroupVisible = false;
          return;
        }
        if (tempGroups.some(g => g.name.toLowerCase() === value.toLowerCase())) {
          showToast('Группа с таким именем уже существует');
          wrap.remove();
          isAddGroupVisible = false;
          return;
        }
        tempGroups.push({ id: generateId(), name: value });
        renderGroupsList();
        wrap.remove();
        isAddGroupVisible = false;
      }
      input.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') saveNewGroup();
      });
      input.addEventListener('blur', saveNewGroup);
      wrap.querySelector('.groups-modal__trash-btn')?.addEventListener('click', () => {
        wrap.remove();
        isAddGroupVisible = false;
      });
    });
  }

  // Удаление группы (через confirm modal)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.groups-modal__trash-btn') &&
      target.closest('.groups-modal__contacts-list')
    ) {
      const btn = target.closest('.groups-modal__trash-btn') as HTMLElement;
      groupToDeleteId = btn.dataset.id || null;
      const input = btn.parentElement?.querySelector('input.groups-modal__input') as HTMLInputElement | null;
      groupToDeleteName = input?.value || null;
      confirmModal?.classList.add('confirm-modal--active');
    }
  });
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (groupToDeleteName) {
        localStorage.removeItem(groupToDeleteName);
        tempGroups = getAllGroupsFromStorage();
        renderGroupsList();
        renderGroupsBlocks();
      }
      closeConfirmModal();
      showToast('Группа успешно удалена', 'success');
    });
  }

  /* -------------------- Дропдаун выбора группы (добавление контакта) -------------------- */
  if (selected && dropdown && list && placeholder) {
    selected.addEventListener('click', () => {
      renderDropdownGroups();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target as Node)) {
        dropdown.classList.remove('open');
      }
    });
  }
  function renderDropdownGroups() {
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

  /* -------------------- Контакты: добавление, редактирование, удаление -------------------- */
  // Добавление контакта
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      let hasError = false;
      document.querySelectorAll('.contact-modal__input--error').forEach(el => el.classList.remove('contact-modal__input--error'));
      document.querySelectorAll('.custom-dropdown__selected--error').forEach(el => el.classList.remove('custom-dropdown__selected--error'));
      document.querySelectorAll('.contact-modal__error-message').forEach(el => el.remove());

      const contact = new Contact(fioInput.value, phoneInput.value);

      if (!ContactValidator.validateName(contact.name)) {
        fioInput.classList.add('contact-modal__input--error');
        fioInput.parentElement?.insertAdjacentHTML('beforeend', `<div class="contact-modal__error-message">Поле является обязательным</div>`);
        hasError = true;
      }
      if (!ContactValidator.validateNumber(contact.number)) {
        phoneInput.classList.add('contact-modal__input--error');
        phoneInput.insertAdjacentHTML('afterend', `<div class="contact-modal__error-message">Поле является обязательным</div>`);
        hasError = true;
      }
      const selectedGroup = document.querySelector('.custom-dropdown__item--active');
      const groupName = selectedGroup ? selectedGroup.textContent : '';
      if (!groupName) {
        selected?.classList.add('custom-dropdown__selected--error');
        selected?.parentElement?.insertAdjacentHTML('beforeend', `<div class="contact-modal__error-message">Необходимо выбрать группу</div>`);
        hasError = true;
      }
      if (hasError) {
        e.preventDefault();
        return false;
      }
      // Проверка на дублирующийся номер
      if (groupName) {
        const groupContacts = JSON.parse(localStorage.getItem(groupName) || '[]');
        const isDuplicate = groupContacts.some((c: { number: string }) => c.number === contact.number);
        if (isDuplicate) {
          showToast('Контакт с таким номером уже существует в этой группе');
          return;
        }
        groupContacts.push(contact);
        localStorage.setItem(groupName, JSON.stringify(groupContacts));
        showToast('Контакт успешно добавлен', 'success');
      }
      // Очистка формы и закрытие модалки
      fioInput.value = '';
      phoneInput.value = '';
      placeholder.textContent = 'Выберите группу';
      placeholder.style.opacity = '0.3';
      document.querySelectorAll('.custom-dropdown__item--active').forEach(i => i.classList.remove('custom-dropdown__item--active'));
      contactModal?.classList.remove('contact-modal--active');
      const title = contactModal?.querySelector('.contact-modal__title');
      if (title) title.textContent = 'Добавление контакта';
    });
  }

  // Рендер групп и контактов
  function renderGroupsBlocks() {
    const container = document.querySelector('.contact-list__groups-render') as HTMLElement;
    const emptyMessage = document.querySelector('.contact-list__empty-message') as HTMLElement;
    if (!container) return;
    const groupNames = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'loglevel') groupNames.push(key);
    }
    container.innerHTML = '';
    if (groupNames.length === 0) {
      emptyMessage.style.display = '';
      return;
    }
    emptyMessage.style.display = 'none';
    groupNames.forEach((name, idx) => {
      const block = document.createElement('div');
      block.className = 'contact-list__group-block';
      if (idx === 0) block.style.marginTop = '56px';
      block.innerHTML = `
        <div class="contact-list__group-bg">
          <div class="contact-list__group-title">${name}</div>
          <div class="contact-list__group-icon">
            <img class="contact-list__group-arrow" src="/img/vector.png" alt="arrow" style="transition: transform 0.3s;" />
          </div>
        </div>
      `;
      const contactsList = document.createElement('div');
      contactsList.className = 'contact-list__contacts-list';
      contactsList.style.display = 'none';
      container.appendChild(block);
      container.appendChild(contactsList);
      const groupBg = block.querySelector('.contact-list__group-bg') as HTMLElement;
      const arrow = block.querySelector('.contact-list__group-arrow') as HTMLImageElement;
      groupBg.addEventListener('click', () => {
        const isOpen = contactsList.style.display === 'block';
        document.querySelectorAll('.contact-list__contacts-list').forEach(el => (el as HTMLElement).style.display = 'none');
        document.querySelectorAll('.contact-list__group-block').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.contact-list__group-arrow').forEach(img => (img as HTMLImageElement).style.transform = '');
        if (!isOpen) {
          arrow.style.transform = 'rotate(180deg)';
          renderContactsForGroup(name, contactsList);
          contactsList.style.display = 'block';
          block.classList.add('open');
        }
      });
    });
  }
  function renderContactsForGroup(groupName: string, container: HTMLElement) {
    container.innerHTML = '';
    const contacts = JSON.parse(localStorage.getItem(groupName) || '[]');
    contacts.forEach((contact: { name: string, number: string }, idx: number) => {
      const dividerBg = document.createElement('div');
      dividerBg.className = 'contact-list__contact-divider-bg';
      container.appendChild(dividerBg);
      const divider = document.createElement('div');
      divider.className = 'contact-list__contact-divider';
      container.appendChild(divider);
      const contactBlock = document.createElement('div');
      contactBlock.className = 'contact-list__contact-block';
      if (idx === 0) contactBlock.classList.add('first-in-list');
      contactBlock.innerHTML = `
        <div class="contact-list__contact-name"><div>${contact.name}</div></div>
        <div class="contact-list__contact-row">
          <div class="contact-list__contact-number"><div>${contact.number}</div></div>
          <div class="contact-list__contact-actions">
            <div class="contact-edit-btn groups-modal__trash-btn" title="Редактировать">
              <svg class="contact-edit-icon" width="18" height="18" viewBox="0 0 18 18" fill="currentColor"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M0 14.25V18H3.75L14.81 6.94L11.06 3.19L0 14.25ZM17.71 4.04C18.1 3.65 18.1 3.02 17.71 2.63L15.37 0.289998C14.98 -0.100002 14.35 -0.100002 13.96 0.289998L12.13 2.12L15.88 5.87L17.71 4.04Z" fill="currentColor"/>
              </svg>
            </div>
            <div class="contact-trash-btn groups-modal__trash-btn" title="Удалить">
              <svg class="groups-modal__trash-icon" width="16" height="20" viewBox="0 0 16 20" fill="currentColor"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M1.66664 17.3889C1.66664 18.55 2.61664 19.5 3.77775 19.5H12.2222C13.3833 19.5 14.3333 18.55 14.3333 17.3889V4.72222H1.66664V17.3889ZM4.26331 9.87333L5.75164 8.385L7.99997 10.6228L10.2378 8.385L11.7261 9.87333L9.48831 12.1111L11.7261 14.3489L10.2378 15.8372L7.99997 13.5994L5.7622 15.8372L4.27386 14.3489L6.51164 12.1111L4.26331 9.87333ZM11.6944 1.55556L10.6389 0.5H5.36108L4.30553 1.55556H0.611084V3.66667H15.3889V1.55556H11.6944Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      `;
      container.appendChild(contactBlock);
      // Удаление контакта
      const trashBtn = contactBlock.querySelector('.contact-trash-btn') as HTMLElement;
      trashBtn?.addEventListener('click', () => {
        const contactsArr = JSON.parse(localStorage.getItem(groupName) || '[]');
        const newContacts = contactsArr.filter((c: { name: string, number: string }) => !(c.name === contact.name && c.number === contact.number));
        localStorage.setItem(groupName, JSON.stringify(newContacts));
        renderContactsForGroup(groupName, container);
        showToast('Контакт успешно удалён', 'success');
      });
      // Редактирование контакта
      const editBtn = contactBlock.querySelector('.contact-edit-btn') as HTMLElement;
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          openEditContactModal(contact, groupName);
        });
      }
    });
  }

  /* -------------------- Контакт: редактирование (модалка) -------------------- */
  function renderEditDropdownGroups(selectedGroup: string) {
    if (!editGroupList) return;
    editGroupList.innerHTML = '';
    const groupNames = getAllGroupNamesFromStorage();
    groupNames.forEach(name => {
      const item = document.createElement('div');
      item.className = 'custom-dropdown__item';
      item.textContent = name;
      if (name === selectedGroup) item.classList.add('custom-dropdown__item--active');
      editGroupList.appendChild(item);
      item.addEventListener('click', () => {
        editGroupList.querySelectorAll('.custom-dropdown__item').forEach(i => i.classList.remove('custom-dropdown__item--active'));
        item.classList.add('custom-dropdown__item--active');
        editGroupPlaceholder.textContent = name;
        editGroupPlaceholder.style.opacity = '1';
        editGroupDropdown?.classList.remove('open');
      });
    });
  }
  function openEditContactModal(contact: { name: string, number: string }, groupName: string) {
    editFioInput.classList.remove('contact-modal__input--error');
    editPhoneInput.classList.remove('contact-modal__input--error');
    editGroupPlaceholder.classList.remove('custom-dropdown__selected--error');
    editContactModal?.querySelectorAll('.contact-modal__error-message').forEach(el => el.remove());
    editFioInput.value = contact.name;
    editPhoneInput.value = contact.number;
    editGroupPlaceholder.textContent = groupName;
    editGroupPlaceholder.style.opacity = '1';
    renderEditDropdownGroups(groupName);
    editingContact = { name: contact.name, number: contact.number, group: groupName };
    editContactModal?.classList.add('contact-modal--active');
  }
  if (editContactModalClose) editContactModalClose.addEventListener('click', closeEditContactModal);
  editContactModal?.querySelector('.contact-modal__overlay')?.addEventListener('click', closeEditContactModal);
  if (editGroupDropdown && editGroupPlaceholder) {
    editGroupDropdown.querySelector('.custom-dropdown__selected')?.addEventListener('click', () => {
      renderEditDropdownGroups(editGroupPlaceholder.textContent || '');
      editGroupDropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!editGroupDropdown.contains(e.target as Node)) {
        editGroupDropdown.classList.remove('open');
      }
    });
  }
  if (editContactSaveBtn) {
    editContactSaveBtn.addEventListener('click', () => {
      let hasError = false;
      editFioInput.classList.remove('contact-modal__input--error');
      editPhoneInput.classList.remove('contact-modal__input--error');
      editGroupPlaceholder.classList.remove('custom-dropdown__selected--error');
      editContactModal?.querySelectorAll('.contact-modal__error-message').forEach(el => el.remove());
      if (!editFioInput.value.trim()) {
        editFioInput.classList.add('contact-modal__input--error');
        editFioInput.parentElement?.insertAdjacentHTML('beforeend', `<div class="contact-modal__error-message">Поле является обязательным</div>`);
        hasError = true;
      }
      if (!editPhoneInput.value.trim()) {
        editPhoneInput.classList.add('contact-modal__input--error');
        editPhoneInput.insertAdjacentHTML('afterend', `<div class="contact-modal__error-message">Поле является обязательным</div>`);
        hasError = true;
      }
      const selectedGroup = editGroupList.querySelector('.custom-dropdown__item--active');
      const groupName = selectedGroup ? selectedGroup.textContent : '';
      if (!groupName) {
        editGroupPlaceholder.classList.add('custom-dropdown__selected--error');
        editGroupPlaceholder.parentElement?.insertAdjacentHTML('beforeend', `<div class="contact-modal__error-message">Необходимо выбрать группу</div>`);
        hasError = true;
      }
      if (hasError || !editingContact || !groupName) return;
      // Удалить старый контакт из старой группы
      const oldContacts = JSON.parse(localStorage.getItem(editingContact.group) || '[]');
      const filtered = oldContacts.filter((c: { name: string, number: string }) =>
        !(c.name === editingContact!.name && c.number === editingContact!.number)
      );
      localStorage.setItem(editingContact.group, JSON.stringify(filtered));
      // Добавить новый контакт в новую группу
      const newContacts = JSON.parse(localStorage.getItem(groupName) || '[]');
      newContacts.push({ name: editFioInput.value.trim(), number: editPhoneInput.value.trim() });
      localStorage.setItem(groupName, JSON.stringify(newContacts));
      closeEditContactModal();
      renderGroupsBlocks();
      showToast('Контакт успешно изменён', 'success');
    });
  }

  /* -------------------- Инициализация -------------------- */
  renderGroupsBlocks();
});