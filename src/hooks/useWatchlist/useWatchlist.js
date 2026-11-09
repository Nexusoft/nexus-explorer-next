import { useAppContext } from 'contexts/AppContext';

/** Kinds a watchlist entry can be, with how the page lists them */
export const WATCH_KINDS = {
  account: 'Account',
  trust: 'Trust account',
  token: 'Token',
  asset: 'Asset',
  name: 'Name',
  namespace: 'Namespace',
  register: 'Register',
  chain: 'Signature chain',
  legacy: 'Legacy address',
};

/**
 * Addresses and signature chains the viewer follows, kept in this browser per network
 * entries: [{ id, kind, label, added }], id = address or genesis
 */
export function useWatchlist() {
  const { appContext, setAppContext } = useAppContext();
  const net = appContext.network?.name || 'mainnet';
  const all = appContext.watchlist || {};
  const items = all[net] || [];

  const save = (next) => setAppContext('watchlist', { ...all, [net]: next });
  const has = (id) => items.some((i) => i.id === id);
  const add = (entry) =>
    !has(entry.id) &&
    save([...items, { ...entry, added: Math.floor(Date.now() / 1000) }]);
  const remove = (id) => save(items.filter((i) => i.id !== id));
  const relabel = (id, label) =>
    save(items.map((i) => (i.id === id ? { ...i, label } : i)));
  const labelOf = (id) => items.find((i) => i.id === id)?.label;

  return { items, has, add, remove, relabel, labelOf };
}
