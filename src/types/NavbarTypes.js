import ASSESTS from 'assets';
import { NETWORKS } from './ConstantsTypes';

const navLinks = [
  { title: 'Home', path: '/' },
  { title: 'Blocks', path: '/blocks' },
  { title: 'Transactions', path: '/transactions' },
  {
    title: 'Accounts',
    path: '#',
    children: [
      { title: 'Rich list', path: '/richlist' },
      { title: 'Top stakers', path: '/trustlist' },
    ],
  },
  {
    title: 'Registers',
    path: '#',
    children: [
      { title: 'Global names', path: '/globalnames' },
      { title: 'Namespaces', path: '/namespaces' },
      { title: 'Tokens', path: '/tokens' },
      { title: 'Assets', path: '/assets' },
    ],
  },
  { title: 'Market', path: '/market', disabledNets: [NETWORKS.TESTNET.name] },
  { title: 'Metrics', path: '/metrics' },
  { title: 'Charts', path: '/charts' },
  {
    title: 'DAO',
    path: '#',
    children: [
      { title: 'Embassy', path: '/dao/embassy' },
      { title: 'Ambassador', path: '/dao/ambassador' },
      { title: 'Developer', path: '/dao/developer' },
    ],
    disabledNets: [NETWORKS.TESTNET.name],
  },
];

export const NavbarTypes = {
  NAVBAR: {
    BRAND: ASSESTS.BRAND.PRIMARY,
    NAVLIST: navLinks,
  },
};
