type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const PREFIX = "vowly-ref:";

/**
 * The transfer reference for one gift, kept for the browser session: a guest who
 * copies it, switches to their bank app and comes back (even to a reloaded page)
 * sees the same reference they paid with. Falls back to a fresh one if storage is blocked.
 */
export function stickyReference(storage: KeyValueStorage, key: string, make: () => string) {
  try {
    const saved = storage.getItem(PREFIX + key);
    if (saved) return saved;
    const fresh = make();
    storage.setItem(PREFIX + key, fresh);
    return fresh;
  } catch {
    return make();
  }
}

/** Once the guest has told the couple, the next gift gets a new reference. */
export function forgetReference(storage: KeyValueStorage, key: string) {
  try {
    storage.removeItem(PREFIX + key);
  } catch {
    // Storage blocked: nothing was kept.
  }
}
