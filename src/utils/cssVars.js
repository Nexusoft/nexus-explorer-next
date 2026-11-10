/**
 * Current values of CSS custom properties, so charts follow the theme tokens
 * readCssVars({ tx: '--c-link' }) => { tx: '#0868a8' }, null on the server
 */
export function readCssVars(names) {
  if (typeof window === 'undefined') return null;
  const css = getComputedStyle(document.body);
  const out = {};
  for (const [key, name] of Object.entries(names)) {
    out[key] = Array.isArray(name)
      ? name.map((n) => css.getPropertyValue(n).trim())
      : css.getPropertyValue(name).trim();
  }
  return out;
}
