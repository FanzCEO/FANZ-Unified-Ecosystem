export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateEnum<T>(value: any, enumObject: Record<string, T>, fieldName: string): void {
  const validValues = Object.values(enumObject);
  if (!validValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${validValues.join(', ')}`,
      fieldName
    );
  }
}

export function validateArray(value: any, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }
}

export function validateEmail(value: string, fieldName: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid email address`, fieldName);
  }
}

export function validateString(value: any, fieldName: string, minLength?: number, maxLength?: number): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }
  
  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName);
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters long`, fieldName);
  }
}

export function validateUUID(value: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`, fieldName);
  }
}

export function validateDate(value: any, fieldName: string): void {
  if (!(value instanceof Date) && !Date.parse(value)) {
    throw new ValidationError(`${fieldName} must be a valid date`, fieldName);
  }
}

// Type conversion helpers for query parameters
export function toString(value: any): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] || '';
  return String(value);
}

export function toNumber(value: any): number {
  const str = toString(value);
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
}

export function toBoolean(value: any): boolean {
  const str = toString(value).toLowerCase();
  return str === 'true' || str === '1' || str === 'yes';
}
