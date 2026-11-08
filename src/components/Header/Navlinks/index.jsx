import styles from './Navlinks.module.scss';
import TYPES from 'types';
import { NavDropdown } from 'components/Header/NavDropdown';
import Link from 'next/link';
import { useId, useState } from 'react';
import { cls } from 'utils';
import { FiChevronDown } from 'react-icons/fi';

const isRouteEqual = (r1, r2) => r1 === r2;

const shouldHideNavOnSomeNetwork = ({ disabledNets, network }) => {
  return disabledNets.includes(network);
};

/**
 * Static link structure component
 * @param {string} activePathname active pathname
 * @param {string} pathname current link path
 * @param {string} label label of the link
 * @returns
 */
export const StaticNavLinks = ({
  activePathname = '',
  pathname = '',
  label = '',
  isMobile = false,
  onClick = () => null,
}) => {
  const isActivePath = isRouteEqual(activePathname, pathname);

  if (isMobile) {
    return (
      <Link href={pathname}>
        <a
          className={cls(styles.mNav, isActivePath && styles.mactive)}
          aria-current={isActivePath ? 'page' : undefined}
          onClick={onClick}>
          {label}
        </a>
      </Link>
    );
  }

  return (
    <Link href={pathname}>
      <a
        className={cls(styles.navItem, isActivePath && styles.active)}
        aria-current={isActivePath ? 'page' : undefined}>
        {label}
      </a>
    </Link>
  );
};

/**
 * Nested navlinks are flattend
 * @param {string} activePathname active pathname
 * @param {string} title label the link
 * @param {Array} options nested links with title and path
 * @returns {JSX.Element}
 */
export const NestedNavLinks = ({
  activePathname = '',
  title = '',
  options = { title: '', path: '' },
  isMobile = false,
  onClick = () => null,
}) => {
  const hasActiveChild = options.some((item) => activePathname === item.path);
  //section of the current page starts open
  const [isExpand, setExpand] = useState(hasActiveChild);

  if (isMobile) {
    return (
      <div className={styles.mNestedNav}>
        <button
          type="button"
          className={cls(styles.mTitle, hasActiveChild && styles.active)}
          aria-expanded={isExpand}
          onClick={() => setExpand((o) => !o)}>
          {title}
          <FiChevronDown
            aria-hidden="true"
            className={cls(styles.chevron, isExpand && styles.open)}
          />
        </button>
        {isExpand && (
          <div className={styles.mNestedNavlist}>
            {options.map((item, index) => {
              const isActive = isRouteEqual(activePathname, item.path);
              return (
                <Link key={item.path + index} href={item.path}>
                  <a
                    className={cls(styles.mNav, isActive && styles.mactive)}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClick}>
                    {item.title}
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavDropdown
      title={title}
      selected={options.some((item) => activePathname === item.path)}>
      {options.map((item, index) => (
        <Link key={item.path + index} href={item.path}>
          <a
            className={cls(
              isRouteEqual(activePathname, item.path) &&
                styles.dropDown__active,
              styles.dropDown__item
            )}
            aria-current={
              isRouteEqual(activePathname, item.path) ? 'page' : undefined
            }>
            {item.title}
          </a>
        </Link>
      ))}
    </NavDropdown>
  );
};

/**
 * Navigation link component
 */
const NavLinks = ({ activePathname, isMobile, onClick, network }) => {
  const id = useId();

  return (
    <nav className={cls(isMobile ? styles.mlinks : styles.links)}>
      {TYPES.NAVBAR.NAVLIST.map((navItem, index) => {
        if (
          shouldHideNavOnSomeNetwork({
            network,
            disabledNets: navItem?.disabledNets ?? [],
          })
        ) {
          return null;
        }

        if (navItem.children) {
          return (
            <NestedNavLinks
              key={navItem.title + id + index}
              activePathname={activePathname}
              title={navItem.title}
              options={navItem.children}
              onClick={onClick}
              isMobile={isMobile}
            />
          );
        }

        return (
          <StaticNavLinks
            key={navItem.path + id + index}
            activePathname={activePathname}
            pathname={navItem.path}
            label={navItem.title}
            onClick={onClick}
            isMobile={isMobile}
          />
        );
      })}
    </nav>
  );
};

export default NavLinks;
