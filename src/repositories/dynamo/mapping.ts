export function getRequiredString(item: Record<string, unknown>, key: string): string {
  const val = item[key];
  if (typeof val !== 'string' || val.trim() === '') {
    throw new Error(`Missing or invalid required string field: ${key}`);
  }
  return val;
}

export function getOptionalString(item: Record<string, unknown>, key: string): string | undefined {
  const val = item[key];
  if (val == null) return undefined;
  if (typeof val !== 'string') {
    throw new Error(`Invalid optional string field: ${key}`);
  }
  return val;
}

export function getRequiredNumber(item: Record<string, unknown>, key: string): number {
  const val = item[key];
  if (typeof val !== 'number') {
    throw new Error(`Missing or invalid required number field: ${key}`);
  }
  return val;
}

export function getOptionalNumber(item: Record<string, unknown>, key: string): number | undefined {
  const val = item[key];
  if (val == null) return undefined;
  if (typeof val !== 'number') {
    throw new Error(`Invalid optional number field: ${key}`);
  }
  return val;
}

export function getRequiredBoolean(item: Record<string, unknown>, key: string): boolean {
  const val = item[key];
  if (typeof val !== 'boolean') {
    throw new Error(`Missing or invalid required boolean field: ${key}`);
  }
  return val;
}

export function getOptionalBoolean(item: Record<string, unknown>, key: string): boolean | undefined {
  const val = item[key];
  if (val == null) return undefined;
  if (typeof val !== 'boolean') {
    throw new Error(`Invalid optional boolean field: ${key}`);
  }
  return val;
}

export function getRequiredDate(item: Record<string, unknown>, key: string): Date {
  const val = item[key];
  if (typeof val !== 'string') {
    throw new Error(`Missing or invalid required date field: ${key}`);
  }
  const date = new Date(val);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format for field: ${key}`);
  }
  return date;
}

export function getOptionalDate(item: Record<string, unknown>, key: string): Date | undefined {
  const val = item[key];
  if (val == null) return undefined;
  if (typeof val !== 'string') {
    throw new Error(`Invalid optional date field: ${key}`);
  }
  const date = new Date(val);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format for optional field: ${key}`);
  }
  return date;
}

export function getRequiredObject<T>(item: Record<string, unknown>, key: string): T {
  const val = item[key];
  if (val == null) {
    throw new Error(`Missing required object field: ${key}`);
  }
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch (e) {
      throw new Error(`Invalid JSON string for required object field: ${key}`);
    }
  }
  if (typeof val === 'object' && !Array.isArray(val)) {
    return val as T;
  }
  throw new Error(`Invalid required object field: ${key}`);
}

export function getOptionalObject<T>(item: Record<string, unknown>, key: string): T | undefined {
  const val = item[key];
  if (val == null) return undefined;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch (e) {
      throw new Error(`Invalid JSON string for optional object field: ${key}`);
    }
  }
  if (typeof val === 'object' && !Array.isArray(val)) {
    return val as T;
  }
  throw new Error(`Invalid optional object field: ${key}`);
}

export function getRequiredArray<T>(item: Record<string, unknown>, key: string): T[] {
  const val = item[key];
  if (val == null) {
    throw new Error(`Missing required array field: ${key}`);
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val) as unknown;
      if (!Array.isArray(parsed)) throw new Error();
      return parsed as T[];
    } catch (e) {
      throw new Error(`Invalid JSON string for required array field: ${key}`);
    }
  }
  if (Array.isArray(val)) {
    return val as T[];
  }
  throw new Error(`Invalid required array field: ${key}`);
}

export function getOptionalArray<T>(item: Record<string, unknown>, key: string): T[] | undefined {
  const val = item[key];
  if (val == null) return undefined;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val) as unknown;
      if (!Array.isArray(parsed)) throw new Error();
      return parsed as T[];
    } catch (e) {
      throw new Error(`Invalid JSON string for optional array field: ${key}`);
    }
  }
  if (Array.isArray(val)) {
    return val as T[];
  }
  throw new Error(`Invalid optional array field: ${key}`);
}

export function toItem(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error('Value is not a valid DynamoDB item record');
}

