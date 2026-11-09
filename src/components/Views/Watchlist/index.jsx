import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { Card, SectionTitle, styles } from 'components/Detail';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useWatchlist, WATCH_KINDS } from 'hooks/useWatchlist/useWatchlist';
import { formatAmount, timeAgo } from 'utils/format';

const isNxs = (r) => r.token === '0' || r.ticker === 'NXS';

/** The current figure of one entry: {value, note, modified} */
function useWatchValue(item) {
  const { network, getScanResults, getOwner, getIndex } = useNetwork();
  return useQuery(
    ['watch', network.name, item.id],
    async () => {
      if (item.kind === 'chain') {
        const owner = await getOwner(item.id);
        if (!owner) return null;
        const nxs = owner.registers.filter(
          (r) => ['account', 'trust'].includes(r.kind) && isNxs(r)
        );
        const total = nxs.reduce(
          (s, r) => s + (r.balance || 0) + (r.info?.stake || 0),
          0
        );
        return {
          value: `${formatAmount(total, 2)} NXS`,
          note: `${nxs.length} accounts, stake included`,
        };
      }
      if (item.kind === 'legacy') {
        const res = (await getIndex(`legacy/${item.id}`)).result;
        return {
          value: `${formatAmount(res.balance, 2)} NXS`,
          note: res.complete ? null : 'still being indexed',
          modified: res.last,
        };
      }
      const r = (await getScanResults('register/get/any', { address: item.id }))
        .result;
      const ticker = r.ticker || (isNxs(r) ? 'NXS' : '');
      const amount =
        item.kind === 'token'
          ? r.currentsupply
          : r.balance != null
          ? r.balance + (r.stake || 0)
          : null;
      return {
        value:
          amount != null ? `${formatAmount(amount, 2)} ${ticker}`.trim() : '-',
        note:
          item.kind === 'token'
            ? 'current supply'
            : r.stake
            ? `${formatAmount(r.stake, 2)} staked`
            : null,
        modified: r.modified,
      };
    },
    { retry: false, staleTime: 60000 }
  );
}

function WatchRow({ item, onRemove }) {
  const valueRQ = useWatchValue(item);
  const v = valueRQ.data;
  return (
    <tr>
      <td style={{ overflowWrap: 'anywhere' }}>
        <Link href={`/scan/${item.id}`}>
          <a>{item.label || item.id}</a>
        </Link>
      </td>
      <td className={styles.hideMobile}>
        {WATCH_KINDS[item.kind] || item.kind}
      </td>
      <td className={styles.right}>
        {valueRQ.isLoading ? (
          <span className={styles.muted}>...</span>
        ) : valueRQ.isError || !v ? (
          <span className={styles.muted}>not available</span>
        ) : (
          <>
            {v.value}
            {v.note && <div className={styles.muted}>{v.note}</div>}
          </>
        )}
      </td>
      <td className={styles.hideMobile}>
        {v?.modified ? timeAgo(v.modified) : '-'}
      </td>
      <td className={styles.right}>
        <button
          type="button"
          className={styles.navButton}
          title="Remove from watchlist"
          onClick={() => onRemove(item.id)}>
          Remove
        </button>
      </td>
    </tr>
  );
}

/** Addresses and signature chains starred on their pages, kept in this browser */
export default function Watchlist() {
  const { items, remove } = useWatchlist();
  //browser storage is only there after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Card>
      <SectionTitle note={items.length || null}>Watching</SectionTitle>
      {items.length === 0 ? (
        <p className={styles.muted}>
          Nothing yet. Open an account, signature chain, token, asset or legacy
          address and press Watch to follow it here.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th className={styles.hideMobile}>What</th>
                <th className={styles.right}>Now</th>
                <th className={styles.hideMobile}>Last change</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <WatchRow key={item.id} item={item} onRemove={remove} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.muted}>
        The list stays in this browser only, separately for mainnet and testnet.
        Nothing is sent anywhere.
      </p>
    </Card>
  );
}
