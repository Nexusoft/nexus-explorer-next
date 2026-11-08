import { useAppContext } from 'contexts/AppContext';
import { useEffect } from 'react';
import TYPES from 'types';
import { useMediaQuery } from '../useMediaQuery/useMediaQuery';

/**
 * Dark mode from the saved choice, else the system setting
 * @returns [isDark, setDark, isDark]
 */
export function useDarkMode() {
  const { appContext, setAppContext, storageLoaded } = useAppContext();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isDark =
    appContext.theme == null
      ? prefersDarkMode
      : appContext.theme === TYPES.THEME.DARK;

  //wait for the saved choice, the script in _document already set the class before paint
  useEffect(() => {
    if (!storageLoaded) return;
    document.body.classList.toggle(TYPES.THEME.DARK, isDark);
  }, [isDark, storageLoaded]);

  const setDark = (value) => {
    const next = typeof value === 'function' ? value(isDark) : value;
    setAppContext('theme', next ? TYPES.THEME.DARK : TYPES.THEME.LIGHT);
  };

  return [isDark, setDark, isDark];
}
