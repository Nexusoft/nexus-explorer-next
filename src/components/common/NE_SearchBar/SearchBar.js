import styles from './SearchBar.module.scss';
import { FiSearch } from 'react-icons/fi';

function SearchBar(props) {
  return (
    <form
      className={styles.searchBar}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        props?.onSearch?.();
      }}>
      <input
        type="search"
        results={5}
        value={props?.value}
        onChange={props?.onChange}
        placeholder={props?.placeholder}
        className={styles.searchInput}
        aria-label="Search the blockchain"
      />
      <button type="submit" className={styles.searchBtn}>
        <FiSearch aria-hidden="true" />
        <span>Search</span>
      </button>
    </form>
  );
}

export default SearchBar;
