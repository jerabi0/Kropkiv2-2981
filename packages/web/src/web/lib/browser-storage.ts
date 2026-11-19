// Browser privacy settings or a full quota must not throw through UI callbacks.
export function readStorage(store: () => Storage, key: string): string | null {
  try { return store().getItem(key); } catch { return null; }
}
export function writeStorage(store: () => Storage, key: string, value: string): boolean {
  try { store().setItem(key, value); return true; } catch { return false; }
}
export function removeStorage(store: () => Storage, key: string): void {
  try { store().removeItem(key); } catch { /* No storage available. */ }
}