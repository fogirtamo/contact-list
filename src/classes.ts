// Класс для контакта
export class Contact {
  name: string;
  number: string;

  constructor(name: string, number: string) {
    this.name = name.trim();
    this.number = number.trim();
  }
}

// Класс для валидации контакта
export class ContactValidator {
  static validateName(name: string): boolean {
    return !!name.trim();
  }

  static validateNumber(number: string): boolean {
    return !!number.trim() && number.replace(/\D/g, '').length >= 10;
  }
}