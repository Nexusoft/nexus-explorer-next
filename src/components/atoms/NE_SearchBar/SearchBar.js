import styles from './SearchBar.module.scss';
import SearchIcon from 'assets/icons/search.svg';
import Image from 'next/image';

function SearchBar(props) {
  return (
    <div className={styles.searchBar}>
      <input
        type="search"
        results={5}
        value={props?.value}
        onChange={props?.onChange}
        placeholder={props?.placeholder}
        className={styles.searchInput}
        onKeyDown={props?.onKeyDown}
      />
      <button
        type="submit"
        onClick={props?.onSearch}
        className={styles.searchBtn}>
        <Image
          src={SearchIcon}
          alt="search"
          className={styles.searchIcon}
          width="24"
          height="24"
        />
      </button>
    </div>
  );
}

export default SearchBar;