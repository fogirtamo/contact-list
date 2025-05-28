import './style.scss';
import IMask from 'imask';
import { Contact, ContactValidator } from './classes';
import { getAllGroupsFromStorage, getAllGroupNamesFromStorage } from './storage';
import { showToast } from './toast';
import { renderGroupsList, addNewGroup } from './groups';
import { renderContactsForGroup } from './contacts';
import { renderDropdownGroups } from './dropdown';

document.addEventListener("DOMContentLoaded", () => {
  // DOM-элементы
  const openBtn = document.querySelector('.contact-list__groups-btn');
  const modal = document.getElementById('groupsModal');
  const closeBtn = document.getElementById('groupsModalClose');
  const overlay = modal?.querySelector('.groups-modal__overlay');
  const confirmModal = document.getElementById('confirmModal');
  const confirmCloseBtn = document.getElementById('confirmModalClose');
  const confirmBackdrop = confirmModal?.querySelector('.confirm-modal__backdrop');
  const confirmCancelBtn = document.querySelector('.confirm-modal__cancel-btn');
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
  const saveGroupsBtn = document.querySelector('.groups-modal__save-btn');
  const addGroupBtn = document.querySelector('.groups-modal__add-btn');
  const groupsRender = document.querySelector('.contact-list__groups-render') as HTMLElement;
  const emptyMessage = document.querySelector('.contact-list__empty-message') as HTMLElement;
  const editContactModal = document.getElementById('editContactModal');
  const editContactModalClose = document.getElementById('editContactModalClose');
  const editFioInput = document.getElementById('editFioInput') as HTMLInputElement;
  const editPhoneInput = document.getElementById('editPhoneInput') as HTMLInputElement;
  const editGroupDropdown = document.getElementById('editGroupDropdown');
  const editGroupPlaceholder = editGroupDropdown?.querySelector('.custom-dropdown__placeholder') as HTMLElement;
  const editGroupList = editGroupDropdown?.querySelector('.custom-dropdown__list') as HTMLElement;
  const editContactSaveBtn = document.getElementById('editContactSaveBtn');


  // Глобальные переменные
  let tempGroups: { id: string, name: string }[] = [];
  let groupToDeleteName: string | null = null;
  let isAddGroupVisible = false;
  let editingContact: { name: string, number: string, group: string } | null = null;


  // Маска для телефона
  if (phoneInput) {
    IMask(phoneInput, {
      mask: '+{7} (000) 000-00-00'
    });
  }

  // Модалки: закрытие
  function closeModal(modal: HTMLElement | null) {
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
    groupToDeleteName = null;
  }

  // События закрытия модалок
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
  if (overlay) overlay.addEventListener('click', () => closeModal(modal));
  if (contactModalClose) contactModalClose.addEventListener('click', closeContactModal);
  if (contactModalOverlay) contactModalOverlay.addEventListener('click', closeContactModal);
  if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', closeConfirmModal);
  if (confirmBackdrop) confirmBackdrop.addEventListener('click', closeConfirmModal);
  if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeConfirmModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal(modal);
  });

  // Открытие модалок
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
      if (groupsList) {
        renderGroupsList(groupsList, tempGroups, (id, value) => {
          const group = tempGroups.find(g => g.id === id);
          if (group) group.name = value;
        });
      }
      modal.classList.add('groups-modal--active');
    });
  }

  // Добавление новой группы
  if (addGroupBtn && groupsList) {
    addGroupBtn.addEventListener('click', () => {
      addNewGroup(
        groupsList,
        tempGroups,
        isAddGroupVisible,
        (v) => { isAddGroupVisible = v; },
        () => renderGroupsList(groupsList, tempGroups, (id, value) => {
          const group = tempGroups.find(g => g.id === id);
          if (group) group.name = value;
        })
      );
    });
  }

  // Сохранение групп
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

  // Удаление группы (через confirm modal)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.groups-modal__trash-btn') &&
      target.closest('.groups-modal__contacts-list')
    ) {
      const btn = target.closest('.groups-modal__trash-btn') as HTMLElement;
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
        if (groupsList) {
          renderGroupsList(groupsList, tempGroups, (id, value) => {
            const group = tempGroups.find(g => g.id === id);
            if (group) group.name = value;
          });
        }
        renderGroupsBlocks();
      }
      closeConfirmModal();
      showToast('Группа успешно удалена', 'success');
    });
  }

  // Дропдаун выбора группы (добавление контакта)
  if (selected && dropdown && list && placeholder) {
    selected.addEventListener('click', () => {
      renderDropdownGroups(list, placeholder, dropdown);
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target as Node)) {
        dropdown.classList.remove('open');
      }
    });
  }

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
      renderGroupsBlocks();
    });
  }

  // Рендер групп и контактов
  function renderGroupsBlocks() {
    if (!groupsRender) return;
    const groupNames = getAllGroupNamesFromStorage();
    groupsRender.innerHTML = '';
    if (groupNames.length === 0) {
      if (emptyMessage) emptyMessage.style.display = '';
      return;
    }
    if (emptyMessage) emptyMessage.style.display = 'none';
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
      groupsRender.appendChild(block);
      groupsRender.appendChild(contactsList);
      const groupBg = block.querySelector('.contact-list__group-bg') as HTMLElement;
      const arrow = block.querySelector('.contact-list__group-arrow') as HTMLImageElement;
      groupBg.addEventListener('click', () => {
        const isOpen = contactsList.style.display === 'block';
        document.querySelectorAll('.contact-list__contacts-list').forEach(el => (el as HTMLElement).style.display = 'none');
        document.querySelectorAll('.contact-list__group-block').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.contact-list__group-arrow').forEach(img => (img as HTMLImageElement).style.transform = '');
        if (!isOpen) {
          arrow.style.transform = 'rotate(180deg)';
          renderContactsForGroup(name, contactsList, openEditContactModal); // <--- ВАЖНО!
          contactsList.style.display = 'block';
          block.classList.add('open');
        }
      });
    });
  }
  // Функция открытия модалки редактирования
  function openEditContactModal(contact: { name: string, number: string }, groupName: string) {
    if (!editContactModal || !editFioInput || !editPhoneInput || !editGroupPlaceholder) return;
    editFioInput.value = contact.name;
    editPhoneInput.value = contact.number;
    editGroupPlaceholder.textContent = groupName;
    editGroupPlaceholder.style.opacity = '1';
    editingContact = { name: contact.name, number: contact.number, group: groupName };
    editContactModal.classList.add('contact-modal--active');
  }
  // Закрытие модалки редактирования
  function closeEditContactModal() {
    editContactModal?.classList.remove('contact-modal--active');
    editingContact = null;
  }
  if (editContactModalClose) editContactModalClose.addEventListener('click', closeEditContactModal);
  editContactModal?.querySelector('.contact-modal__overlay')?.addEventListener('click', closeEditContactModal);

  // Сохранение изменений контакта
  if (editContactSaveBtn) {
    editContactSaveBtn.addEventListener('click', () => {
      if (!editingContact) return;
      const newName = editFioInput.value.trim();
      const newNumber = editPhoneInput.value.trim();
      const groupName = editGroupPlaceholder.textContent || '';
      if (!newName || !newNumber || !groupName) return;
      // Удалить старый контакт
      const oldContacts = JSON.parse(localStorage.getItem(editingContact.group) || '[]');
      const filtered = oldContacts.filter((c: { name: string, number: string }) =>
        !(c.name === editingContact!.name && c.number === editingContact!.number)
      );
      localStorage.setItem(editingContact.group, JSON.stringify(filtered));
      // Добавить новый контакт в новую группу
      const newContacts = JSON.parse(localStorage.getItem(groupName) || '[]');
      newContacts.push({ name: newName, number: newNumber });
      localStorage.setItem(groupName, JSON.stringify(newContacts));
      closeEditContactModal();
      renderGroupsBlocks();
      showToast('Контакт успешно изменён', 'success');
    });
  }

  if (editGroupPlaceholder && editGroupDropdown && editGroupList) {
    editGroupPlaceholder.addEventListener('click', () => {
      renderDropdownGroups(editGroupList, editGroupPlaceholder, editGroupDropdown);
      editGroupDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (
        editGroupDropdown.classList.contains('open') &&
        !editGroupDropdown.contains(e.target as Node) &&
        e.target !== editGroupPlaceholder
      ) {
        editGroupDropdown.classList.remove('open');
      }
    });
  }

  // Инициализация
  renderGroupsBlocks();
});