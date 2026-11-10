import styles from './ThemeMode.module.scss';
import { BsMoonFill, BsSunFill } from 'react-icons/bs';
import { useDarkMode } from 'hooks';

/**
 * Toggle button Component for theme selection
 *
 * @param {boolean} isDark theme status
 * @param {Function} onClick onClick function
 */
export default function ThemeMode() {
  const [isDarkMode, setDarkMode] = useDarkMode();
  return (
    <button
      className={styles.themeMode}
      onClick={() => setDarkMode(!isDarkMode)}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Light mode' : 'Dark mode'}>
      {isDarkMode ? (
        <BsSunFill color="inherit" />
      ) : (
        <BsMoonFill color="inherit" />
      )}
    </button>
  );
}
