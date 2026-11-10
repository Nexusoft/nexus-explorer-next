import { useState } from 'react';
import styles from './SearchBar.module.scss';
import { FiSearch } from 'react-icons/fi';

/**
 * Search box; suggestions = [{key, label, note}] shown in a list under it,
 * onPick(item) when one is chosen with the mouse or arrows + Enter
 */
function SearchBar(props) {
  const suggestions = props?.suggestions || [];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const shown = open && suggestions.length > 0;

  function pick(item) {
    setOpen(false);
    setActive(-1);
    props?.onPick?.(item);
  }

  function handleKeyDown(e) {
    if (!shown) {
      if (e.key === 'ArrowDown' && suggestions.length) setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => {
        const n = i + step;
        if (n < -1) return suggestions.length - 1;
        return n >= suggestions.length ? -1 : n;
      });
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === 'Escape') {
      //first Escape closes the list, the next one clears the box as usual
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className={styles.wrap}>
      <form
        className={styles.searchBar}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          props?.onSearch?.();
        }}>
        <input
          type="search"
          results={5}
          value={props?.value}
          onChange={(e) => {
            setOpen(true);
            setActive(-1);
            props?.onChange?.(e);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          //later than a click on a suggestion, which then still lands
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={props?.placeholder}
          className={styles.searchInput}
          aria-label="Search the blockchain"
          role="combobox"
          aria-expanded={shown}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={
            shown && active >= 0 ? `search-suggestion-${active}` : undefined
          }
          autoComplete="off"
        />
        <button type="submit" className={styles.searchBtn}>
          <FiSearch aria-hidden="true" />
          <span>Search</span>
        </button>
      </form>
      {shown && (
        <ul
          id="search-suggestions"
          role="listbox"
          className={styles.suggestions}>
          {suggestions.map((s, i) => (
            <li
              key={s.key}
              id={`search-suggestion-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? styles.active : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}>
              <span className={styles.label}>{s.label}</span>
              <span className={styles.note}>{s.note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
