import { showToast } from './toast';

export function renderContactsForGroup(groupName: string, container: HTMLElement, openEditContactModal: (contact: { name: string, number: string }, groupName: string) => void) {
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
      renderContactsForGroup(groupName, container, openEditContactModal);
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