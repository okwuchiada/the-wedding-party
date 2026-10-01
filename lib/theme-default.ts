/** Same rule as planAllowsTheme: an empty list means the plan includes every theme. */
export function isPresetIncluded(allowed: string[], key: string) {
  return allowed.length === 0 || allowed.includes(key);
}

/** The theme a new site starts on: the first one the couple can publish on their starting plan. */
export function defaultPresetKey(allowed: string[], presets: readonly { key: string }[]) {
  return (presets.find((p) => isPresetIncluded(allowed, p.key)) ?? presets[0]).key;
}
