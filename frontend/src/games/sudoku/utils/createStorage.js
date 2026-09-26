const ROOT = "kho";

/**
 * Namespaced JSON storage. `createStorage("sudoku")` only ever reads and
 * writes keys starting with `kho.sudoku.`, so games cannot touch each
 * other's saved data.
 *
 * Storage can be unavailable or full; reads then fall back and writes
 * report failure instead of throwing.
 */
export function createStorage(namespace, backend = globalThis.localStorage) {
  if (!namespace) throw new Error("createStorage: namespace is required");
  const prefix = `${ROOT}.${namespace}.`;

  return {
    get(key, fallback = null) {
      try {
        const raw = backend.getItem(prefix + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      try {
        backend.setItem(prefix + key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove(key) {
      try {
        backend.removeItem(prefix + key);
      } catch {
        // storage unavailable: nothing to remove
      }
    },

    /** Removes every key of this namespace and nothing else. */
    clear() {
      try {
        const keys = [];
        for (let i = 0; i < backend.length; i++) {
          const key = backend.key(i);
          if (key?.startsWith(prefix)) keys.push(key);
        }
        keys.forEach((key) => backend.removeItem(key));
      } catch {
        // storage unavailable: nothing to clear
      }
    },
  };
}
