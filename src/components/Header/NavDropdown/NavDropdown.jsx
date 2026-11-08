import styles from './NavDropdown.module.scss';
import { FiChevronDown } from 'react-icons/fi';
import { Children } from 'react';
import { cls } from 'utils';

export const NavDropdown = ({ title = ' ', children, selected = false }) => {
  return (
    <div className={styles.dropDown}>
      <button
        className={cls(styles.dropDown__btn, selected && styles.selected)}>
        {title}
        <FiChevronDown size="0.9rem" color="inherit" aria-hidden="true" />
      </button>
      <div className={styles.dropDown__content}>
        {Children.map(children, (child) => {
          return <div className={styles.dropDown__content__item}>{child}</div>;
        })}
      </div>
    </div>
  );
};
