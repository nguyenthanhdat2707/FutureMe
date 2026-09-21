export function getString(row: unknown, key: string): string {
    if (row && typeof row === 'object' && key in row) {
        const val = (row as Record<string, unknown>)[key];
        if (typeof val === 'string') return val;
    }
    return '';
}

export function getOptionalString(row: unknown, key: string): string | undefined {
    if (row && typeof row === 'object' && key in row) {
        const val = (row as Record<string, unknown>)[key];
        if (typeof val === 'string' && val !== '') return val;
    }
    return undefined;
}

export function getDate(row: unknown, key: string): Date {
    const val = getString(row, key);
    return val ? new Date(val) : new Date();
}

export function getOptionalDate(row: unknown, key: string): Date | undefined {
    const val = getOptionalString(row, key);
    return val ? new Date(val) : undefined;
}

export function getNumber(row: unknown, key: string): number {
    if (row && typeof row === 'object' && key in row) {
        const val = (row as Record<string, unknown>)[key];
        if (typeof val === 'number') return val;
    }
    return 0;
}

export function getOptionalNumber(row: unknown, key: string): number | undefined {
    if (row && typeof row === 'object' && key in row) {
        const val = (row as Record<string, unknown>)[key];
        if (typeof val === 'number') return val;
    }
    return undefined;
}

export function getJson<T>(row: unknown, key: string, fallback: T): T {
    const val = getString(row, key);
    if (!val) return fallback;
    try {
        return JSON.parse(val) as T;
    } catch {
        return fallback;
    }
}
