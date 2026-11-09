import styles from './Header.module.scss';
import { useRouter } from 'next/router';
import Search from 'components/common/NE_SearchBar';
import TYPES from 'types';
import { useEffect, useState } from 'react';
import { NETWORKS } from 'types/ConstantsTypes';
import { useAppContext } from 'contexts/AppContext';
import Brand from './Brand';
import { DesktopNavbar, Hamburger, MobileMenu } from './Navbar';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useDebounce } from 'hooks/useDebounce/useDebounce';
import { classifySearch, NAME_KIND_LABEL } from 'utils/search';

const maxSuggestions = 8;

/**
 * Header component for the website
 * @returns {JSX.Element}
 */
export const Header = () => {
  const [toggleMobileMenu, setToggle] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const router = useRouter();
  const { appContext, setAppContext } = useAppContext();
  const { network, getIndex } = useNetwork();

  //names as you type, only for text that is no other search format
  const typed = searchInput.trim();
  const nameQuery = useDebounce(
    typed.length >= 2 && !classifySearch(typed) ? typed : '',
    250
  );
  const suggestRQ = useQuery(
    ['nameSuggest', network.name, nameQuery],
    () => getIndex('search', { q: nameQuery }),
    {
      enabled: !!nameQuery,
      keepPreviousData: true,
      staleTime: 60000,
      retry: false,
    }
  );
  //previous answer while the next one loads, minus names that no longer match
  const suggestions =
    typed.length >= 2 && !classifySearch(typed)
      ? (suggestRQ.data?.result || [])
          .filter((r) => r.name?.toLowerCase().startsWith(typed.toLowerCase()))
          .slice(0, maxSuggestions)
          .map((r) => ({
            key: r.address,
            address: r.address,
            name: r.name,
            label: r.name,
            note: NAME_KIND_LABEL[r.kind] || r.kind,
          }))
      : [];

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
              suggestions={suggestions}
              onPick={(s) => {
                setSearchInput(s.name);
                router.push(`/scan/${s.address}`);
              }}
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
