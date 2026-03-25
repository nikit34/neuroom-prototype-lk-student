/**
 * No-op storage for dev mode — stores always start fresh on reload.
 */
export const noopStorage = {
  getItem: (_name: string): Promise<string | null> => Promise.resolve(null),
  setItem: (_name: string, _value: string): Promise<void> => Promise.resolve(),
  removeItem: (_name: string): Promise<void> => Promise.resolve(),
};
