import { useEffect, useState } from 'react';
import { useDarkMode } from 'hooks/useDarkMode/useDarkMode';
import { readCssVars } from 'utils/cssVars';

/**
 * Chart colors from CSS tokens, read again when the theme changes
 * useThemeColors({ line: '--c-link' }) => [{ line: '#0868a8' } or null, isDarkMode]
 * `names` must be a constant (module level), it is not a dependency
 */
export function useThemeColors(names) {
  const [isDarkMode] = useDarkMode();
  const [colors, setColors] = useState(null);
  useEffect(() => {
    //wait a frame so the theme class is on the body before reading the tokens
    const id = requestAnimationFrame(() => setColors(readCssVars(names)));
    return () => cancelAnimationFrame(id);
  }, [isDarkMode]);
  return [colors, isDarkMode];
}
