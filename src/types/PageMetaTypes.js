const SITE = 'Nexus Explorer';
const page = (name) => `${name} | ${SITE}`;
const homeTitle = `${SITE} - blocks, transactions and accounts of the Nexus blockchain`;
const homeDescription =
  'Block explorer for the Nexus blockchain: search blocks, transactions, accounts, names and tokens, and follow staking, mining and network figures.';

export const PageMetaTypes = {
  PAGEMETA: {
    SITE,
    TITLE: homeTitle,
    DESCRIPTION: homeDescription,
    HOME: { TITLE: homeTitle, DESCRIPTION: homeDescription },
    ABOUT: {
      TITLE: page('About'),
      DESCRIPTION:
        'What the Nexus Explorer shows, where its figures come from and who built it.',
    },
    METRICS: {
      TITLE: page('Network metrics'),
      DESCRIPTION:
        'Nexus supply, inflation, staking and ledger figures for the last day, week and month.',
    },
    BLOCKS: {
      TITLE: page('Blocks'),
      DESCRIPTION:
        'Every Nexus block, newest first, with channel, reward, transactions and size.',
    },
    TRANSACTIONS: {
      TITLE: page('Transactions'),
      DESCRIPTION: 'The newest transactions on the Nexus blockchain.',
    },
    TRUSTLIST: {
      TITLE: page('Top stakers'),
      DESCRIPTION:
        'Nexus trust accounts ranked by trust score, with stake, rate and estimated daily reward.',
    },
    RICHLIST: {
      TITLE: page('Rich list'),
      DESCRIPTION:
        'The largest NXS accounts and how the supply is spread across them.',
    },
    GLOBALNAMES: {
      TITLE: page('Global names'),
      DESCRIPTION: 'Global names registered on the Nexus blockchain.',
    },
    NAMESPACES: {
      TITLE: page('Namespaces'),
      DESCRIPTION: 'Namespaces registered on the Nexus blockchain.',
    },
    ASSETS: {
      TITLE: page('Assets'),
      DESCRIPTION:
        'Assets and supply items registered on the Nexus blockchain: art, achievements, posts and other on-chain records.',
    },
    MARKET: {
      TITLE: page('Market'),
      DESCRIPTION:
        'Open and filled orders on the Nexus on-chain market for tokens traded against NXS.',
    },
    TOKENS: {
      TITLE: page('Tokens'),
      DESCRIPTION:
        'Tokens created on the Nexus blockchain with their maximum and current supply.',
    },
    USER: {
      TITLE: page('Account'),
      DESCRIPTION: 'Nexus account balance and transactions.',
    },
    SEARCH: {
      TITLE: page('Search'),
      DESCRIPTION:
        'Look up a Nexus block, transaction, address or name in the explorer.',
    },
    NOT_FOUND: {
      TITLE: page('Page not found'),
      DESCRIPTION: 'This page does not exist in the Nexus Explorer.',
    },
    DAO: {
      EMBASSY: {
        TITLE: page('Embassy DAO'),
        DESCRIPTION: 'Accounts and balances of the Nexus Embassy DAO.',
      },
      AMBASSADOR: {
        TITLE: page('Ambassador DAO'),
        DESCRIPTION: 'Accounts and balances of the Nexus Ambassador DAO.',
      },
      DEVELOPER: {
        TITLE: page('Developer DAO'),
        DESCRIPTION: 'Accounts and balances of the Nexus Developer DAO.',
      },
      INVOICES: {
        TITLE: (username) => page(`Invoices of ${username}`),
        DESCRIPTION: 'Invoices sent from a Nexus DAO account.',
      },
    },
  },
};
