export function safeJsonParse(val: string): unknown {
    return JSON.parse(val);
}
