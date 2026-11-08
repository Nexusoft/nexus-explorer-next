import styles from './Header.module.scss';
import { useRouter } from 'next/router';
import Search from 'components/common/NE_SearchBar';
import TYPES from 'types';
import { useEffect, useState } from 'react';
import { NETWORKS } from 'types/ConstantsTypes';
import { useAppContext } from 'contexts/AppContext';
import Brand from './Brand';
import { DesktopNavbar, Hamburger, MobileMenu } from './Navbar';

/**
 * Header component for the website
 * @returns {JSX.Element}
 */
export const Header = () => {
  const [toggleMobileMenu, setToggle] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const router = useRouter();
  const { appContext, setAppContext } = useAppContext();

  const handleNetworkChange = (e) => {
    const val = e.target.value;
    const network = NETWORKS[val.toUpperCase()];
    setAppContext('network', network);
  };

  useEffect(() => {
    // Toggle class to body to change theme mode depending on network
    document.body.classList.toggle(
      'testnet-logo',
      appContext.network.name == NETWORKS.TESTNET.name
    );
  }, [appContext.network]);

  const handleMenuToggle = () => {
    const body = document.querySelector('body');
    setToggle((prev) => {
      !prev
        ? body.setAttribute('style', 'overflow: hidden')
        : body.removeAttribute('style');
      return !prev;
    });
  };

  return (
    <>
      <header className={styles.container}>
        <div className={styles.header}>
          <div className={styles.nav}>
            <Brand network={appContext.network.name} />
            <DesktopNavbar
              activePathname={router.pathname}
              network={appContext.network.name}
              onNetworkChange={handleNetworkChange}
            />
            <Hamburger onClick={handleMenuToggle} />
          </div>
          <div className={styles.searchBar}>
            <Search
              long
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={TYPES.PLACE_HOLDER.SEARCH}
              onSearch={() => {
                const q = searchInput.trim();
                if (!q) return;
                router.push(`/scan/${encodeURIComponent(q)}`);
              }}
            />
          </div>
        </div>
      </header>
      <MobileMenu
        isOpen={toggleMobileMenu}
        network={appContext.network.name}
        activePathname={router.pathname}
        onNetworkChange={handleNetworkChange}
        onClose={handleMenuToggle}
      />
    </>
  );
};

export default Header;
