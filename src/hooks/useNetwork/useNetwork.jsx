import axios from 'axios';
import { useAppContext } from 'contexts/AppContext';
import { NETWORKS, API_URLS } from 'types/ConstantsTypes';
import { fetchRichlist } from 'utils/common/fetch';

export function useNetwork() {
  const { appContext } = useAppContext();

  const MAINNET_URL = process.env.NEXT_PUBLIC_NEXUS_BASE_URL;
  const TESTNET_URL = process.env.NEXT_PUBLIC_TESTNET_BASE_URL;
  const { MAINNET: MAINNET_PROXY_URL, TESTNET: TESTNET_PROXY_URL } = API_URLS;

  // * Change network url based on the NEXT_PUBLIC_USE_PROXY_MIDDLEWARE env variable
  const isProxyEnabled =
    process.env.NEXT_PUBLIC_USE_PROXY_MIDDLEWARE.toLowerCase() == 'true'
      ? true
      : false;
  const isMainnetSelected = appContext.network.name === NETWORKS.MAINNET.name;

  const url = isMainnetSelected
    ? isProxyEnabled
      ? MAINNET_PROXY_URL
      : MAINNET_URL
    : isProxyEnabled
    ? TESTNET_PROXY_URL
    : TESTNET_URL;

  //optional indexer next to the node (backend /explorer/...), callers fall back to the node API
  async function getIndex(path, params) {
    const res = await axios.get(`${url}/explorer/${path}`, { params });
    return res.data;
  }

  //cached node result from the indexer, or the slow node query when there is none
  async function cachedList(key, fallback, isValid = Array.isArray) {
    try {
      const res = await getIndex(`cache/${key}`);
      if (isValid(res?.result)) return res.result;
    } catch (e) {
      //no indexer, use the node
    }
    return fallback();
  }

  // * resource heavy API takes 4 secs to fetch
  function getMetrics() {
    return axios.get(`${url}/system/get/metrics`, {
      headers: { 'Cache-Control': 'max-age=300' },
    });
  }

  function getInfo() {
    return axios.get(`${url}/system/get/info`);
  }

  // * resource heavy API takes 6 secs with the exisitng node
  function getMining() {
    return axios.get(`${url}/ledger/get/info`, {
      headers: { 'Cache-Control': 'max-age=600' }, // * Cache for 10 min
    });
  }

  //over 30 s on the node, the indexer keeps a copy refreshed every 10 min
  function getLedgerMetrics() {
    return cachedList(
      'ledgermetrics',
      async () => {
        const res = await axios.get(`${url}/ledger/get/metrics`, {
          headers: { 'Cache-Control': 'max-age=600' },
        });
        return res.data.result;
      },
      (r) => !!r && typeof r === 'object' && !Array.isArray(r)
    );
  }

  async function getRecentBlocks(MAX_ROWS = 6) {
    const res = await axios.get(
      `${url}/ledger/list/blocks?verbose=summary&limit=${MAX_ROWS}`
    );
    return res.data.result;
  }

  const getTrustlist = async ({ queryKey }) => {
    const [, page, limit] = queryKey;
    const cached = await cachedList('trustlist', () => null);
    if (cached)
      return { result: cached.slice(page * limit, (page + 1) * limit) };
    const res = await axios.get(`${url}/register/list/finance:trust`, {
      headers: { 'Cache-Control': 'max-age=300' },
      params: {
        page: queryKey[1],
        limit: queryKey[2],
        sort: 'trust',
        order: 'desc',
      },
    });
    return res.data;
  };

  const getRichlist = async (page = 0, limit = 111) => {
    const cached = await cachedList('richlist', () => null);
    if (cached && (page + 1) * limit <= cached.length) {
      return { data: cached.slice(page * limit, (page + 1) * limit) };
    }
    return fetchRichlist(url, page, limit);
  };

  // ! fetch doesnt return rejected promise by default which is required by react-query to correctly handle error scenarios, hence use axios library th
  const getGlobalNames = async () => {
    const cached = await cachedList('globalnames', () => null);
    if (cached) return { result: cached };
    const res = await axios(`${url}/register/list/names:global`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300',
      },
      data: {
        limit: 1000,
        page: 0,
      },
    });
    return res.data;
  };

  const getGlobalName = async (address) => {
    const res = await axios(`${url}/names/get/global?address=${address}`, {
      headers: { 'Cache-Control': 'max-age=300' },
    });
    return res.data.result;
  };

  const getNamespaces = async () => {
    const cached = await cachedList('namespaces', () => null);
    if (cached) return { data: { result: cached } };
    return axios.get(`${url}/register/list/names:namespaces?limit=1000`, {
      headers: { 'Cache-Control': 'max-age=300' },
    });
  };

  const getNamespace = async (address) => {
    const res = await axios.get(
      `${url}/names/get/namespace?address=${address}`,
      {
        headers: { 'Cache-Control': 'max-age=300' },
      }
    );
    return res.data.result;
  };

  //NXS market pairs, collected by the indexer only (null when it is not running)
  const getMarkets = () => cachedList('markets', () => null);

  /**
   * A username: the chain keeps no plain usernames, but every profile has a "default" and
   * a "trust" account named username:default / username:trust. {username, genesis} or null
   */
  const findUser = async (username) => {
    const name = (username || '').trim();
    if (!name || name.includes(':')) return null;
    for (const [endpoint, account] of [
      ['finance/get/account', 'default'],
      ['finance/get/trust', 'trust'],
    ]) {
      try {
        const res = await axios.get(`${url}/${endpoint}`, {
          params: { name: `${name}:${account}` },
        });
        const owner = res.data?.result?.owner;
        if (owner) return { username: name, genesis: owner };
      } catch (e) {
        //no such account, try the next one
      }
    }
    return null;
  };

  //{chains, top: [{owner, total, balance, stake, accounts}]}, hourly, indexer only
  const getRichChains = () =>
    cachedList(
      'richchains',
      () => null,
      (v) => Array.isArray(v?.top)
    );

  //per UTC day [day, blocks stake/prime/hash, mint stake/prime/hash, txs, transfers], indexer only
  const getDaily = () => cachedList('daily', () => null);

  //asset registers without content, indexer only like the markets
  const getAssets = () => cachedList('assets', () => null);

  //registers of one signature chain from the hourly owner index, null without an index
  const getOwner = async (genesis) => {
    try {
      return (await getIndex(`owner/${genesis}`)).result;
    } catch (e) {
      return null;
    }
  };

  //{token address: {accounts, owners, top}}, indexer only, refreshed hourly
  const getTokenHolders = () =>
    cachedList(
      'tokenholders',
      () => null,
      (v) => !!v && typeof v === 'object' && !Array.isArray(v)
    );

  const getTokens = async () => {
    const cached = await cachedList('tokens', () => null);
    if (cached) return { data: { result: cached } };
    return axios.get(
      `${url}/register/list/finance:tokens?sort=maxsupply&limit=1000`,
      {
        headers: { 'Cache-Control': 'max-age=300' },
      }
    );
  };

  const getToken = async (address) => {
    const res = await axios.get(
      `${url}/register/get/finance:token?address=${address}`,
      {
        headers: { 'Cache-Control': 'max-age=300' },
      }
    );
    return res.data.result;
  };

  const getBlocks = async ({ queryKey }) => {
    const res = await axios.get(
      `${url}/ledger/list/blocks?limit=${queryKey[1]}&page=${queryKey[2]}`
    );
    return res.data.result;
  };

  const getTransactions = ({ queryKey }) =>
    axios.get(
      `${url}/ledger/list/blocks?verbose=summary&page=${queryKey[1]}&limit=${queryKey[2]}`
    );

  // todo: need seperate api functions for the finance/get/account, finance/get/trust
  const getScanResults = async (endpoint, params) => {
    const res = await axios.get(`${url}/${endpoint}`, {
      params: params,
    });
    return res.data;
  };

  // todo: add suppprt for adresses also
  const getAccount = async (username) => {
    const res = await axios.get(
      `${url}/register/get/finance:account?name=${username}`
    );
    return res.data.result;
  };

  const getTrust = async (username) => {
    const res = await axios.get(
      `${url}/register/get/finance:trust?name=${username}`
    );
    return res.data.result;
  };

  const getTrustTransactions = async (address, page, limit) => {
    const res = await axios.get(`${url}/register/transactions/finance:trust`, {
      params: {
        address: address,
        page: page,
        limit: limit,
      },
    });
    return res.data;
  };

  const getAccountTransactions = async (address, page, limit) => {
    const res = await axios.get(
      `${url}/register/transactions/finance:account`,
      {
        params: {
          address: address,
          page: page,
          limit: limit,
        },
      }
    );
    return res.data;
  };

  const getTokenTransactions = async (address, page, limit) => {
    const res = await axios.get(`${url}/register/transactions/finance:token`, {
      params: {
        address: address,
        page: page,
        limit: limit,
      },
    });
    return res.data;
  };

  const getInvoices = async (username, page, limit) => {
    // example command
    // ./nexus register/list/invoices:invoice limit=20 where='results.owner=username(`US:Interactions`);'

    const params = {
      limit,
      page,
      where: `results.json.recipient=username(\`${username}\`);`,
    };

    const res = await axios.get(`${url}/register/list/invoices:invoice`, {
      headers: { 'Cache-Control': 'max-age=120' },
      params,
    });
    return res.data.result;
  };

  /**
   * Get Invoice info for a given address
   * @param {string} address
   * @returns {Promise}
   */
  const getInvoice = async (address) => {
    const res = await axios.get(
      `${url}/register/get/invoices:invoice?address=${address}`
    );
    return res.data.result;
  };

  function getNetworkListNodes(url, limit, hours, extraParams) {
    const params = {
      limit,
      sort: 'lastseen',
      order: 'desc',
      where: `results.lastseen>=since(\`${hours} hours\`);`,
      ...extraParams,
    };

    return axios.get(`${url}`, {
      headers: { 'Cache-Control': `max-age=${60 * 60}` }, // * Cache for 60 min
      params,
    });
  }

  function getNetworkCountNodes() {
    return axios.get(`${url}/network/list/nodes/address/count?limit=none`, {
      headers: { 'Cache-Control': `max-age=${60 * 1}` }, // * Cache for 1 min
    });
  }
  // /register/list/accounts,trust/total/sum?sort=total&order=desc&limit=none&where=object.token=0
  const getTotalNXS = async () => {
    const res = await axios.get(
      `${url}/register/list/finance:accounts,finance:trust/total/sum?sort=total&order=desc&limit=none&where=results.token=0`
    );
    return res.data.result;
  };

  return {
    network: { name: appContext.network.name, url },
    getIndex,
    getInfo,
    getTrust,
    getBlocks,
    getToken,
    getTokens,
    getMarkets,
    getAssets,
    getOwner,
    getDaily,
    getRichChains,
    findUser,
    getTokenHolders,
    getMining,
    getAccount,
    getInvoice,
    getMetrics,
    getRichlist,
    getTotalNXS,
    getInvoices,
    getTrustlist,
    getNamespace,
    getNamespaces,
    getScanResults,
    getGlobalName,
    getGlobalNames,
    getRecentBlocks,
    getTransactions,
    getLedgerMetrics,
    getNetworkListNodes,
    getNetworkCountNodes,
    getTrustTransactions,
    getAccountTransactions,
    getTokenTransactions,
  };
}
