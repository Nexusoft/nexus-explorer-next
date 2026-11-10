import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Card, Hash, SectionTitle, styles } from '.';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import ExportButton from './ExportButton';
import {
  formatAmount,
  formatDate,
  formatDateShort,
  timeAgo,
} from 'utils/format';
import {
  describeContract,
  moveToContract,
  netForAddresses,
} from 'utils/contracts';

const pageSize = 25;

/** Value moves of all accounts, trust accounts and tokens of one signature chain */
export default function OwnerTransactions({ genesis }) {
  const { network, getIndex } = useNetwork();
  const [page, setPage] = useState(0);
  //cursor per page: list rows below this height
  const [cursors, setCursors] = useState([undefined]);
  //a staking chain is mostly rewards, so they start hidden
  const [transfersOnly, setTransfersOnly] = useState(true);

  const txRQ = useQuery(
    ['ownerTransactions', network.name, genesis, transfersOnly, cursors[page]],
    () =>
      getIndex(`owner/${genesis}/transactions`, {
        limit: pageSize,
        transfers: transfersOnly ? 1 : 0,
        before: cursors[page],
      }),
    { keepPreviousData: true, retry: false, staleTime: 60000 }
  );

  useEffect(() => {
    const next = txRQ.data?.next;
    //the previous filter's data stays shown while loading, its cursor is not ours
    if (txRQ.isPreviousData) return;
    if (next != null && cursors.length === page + 1) {
      setCursors((c) => [...c, next]);
    }
  }, [txRQ.data, txRQ.isPreviousData, page]);

  const toggleRewards = (e) => {
    setTransfersOnly(e.target.checked);
    setPage(0);
    setCursors([undefined]);
  };

  //no index: the page shows what the node tells about the chain only
  if (txRQ.isError) return null;

  const mine = new Set(txRQ.data?.addresses || []);
  const rows = (txRQ.data?.result || []).map((t) => ({
    txid: t.txid,
    timestamp: t.time,
    contracts: t.moves.map((m) => moveToContract(m, t.type)),
  }));
  const hasOlder = txRQ.data?.next != null;

  return (
    <Card>
      <SectionTitle note={page > 0 ? `page ${page + 1}` : null}>
        Transactions
      </SectionTitle>
      <label
        className={styles.muted}
        style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={transfersOnly}
          onChange={toggleRewards}
        />
        Hide mining and staking rewards
      </label>
      {txRQ.isLoading && (
        <p className={styles.muted}>Loading transactions...</p>
      )}
      {!txRQ.isLoading && rows.length === 0 && (
        <p className={styles.muted}>
          {transfersOnly
            ? 'No transfers on this chain; untick the box to see its rewards.'
            : 'No value moved on this chain yet.'}
        </p>
      )}
      {rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>What</th>
                <th className={styles.hideMobile}>Counterparty</th>
                <th className={styles.right}>Change</th>
                <th className={styles.hideMobile}>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const { nets, counterparties } = netForAddresses(tx, mine);
                const labels = [
                  ...new Set(
                    tx.contracts.map((c) => describeContract(c).label)
                  ),
                ].join(', ');
                const changes = Object.entries(nets).filter(([, n]) => n);
                return (
                  <tr key={tx.txid}>
                    <td
                      title={formatDate(tx.timestamp)}
                      style={{ whiteSpace: 'nowrap' }}>
                      {formatDateShort(tx.timestamp)}
                      <div className={styles.muted}>
                        {timeAgo(tx.timestamp)}
                      </div>
                    </td>
                    <td>{labels}</td>
                    <td className={styles.hideMobile}>
                      {counterparties.length === 0 && (
                        <span className={styles.muted}>
                          {changes.length ? '-' : 'own accounts'}
                        </span>
                      )}
                      {counterparties.slice(0, 2).map((c) => (
                        <div key={c}>
                          <Hash value={c} href={`/scan/${c}`} keep={6} />
                        </div>
                      ))}
                      {counterparties.length > 2 && (
                        <span className={styles.muted}>
                          +{counterparties.length - 2} more
                        </span>
                      )}
                    </td>
                    <td className={styles.right}>
                      {changes.length === 0 && '-'}
                      {changes.map(([ticker, n]) => {
                        const sign = n > 0 ? '+' : '-';
                        return (
                          <div
                            key={ticker}
                            className={styles.flowAmount}
                            data-sign={sign}
                            style={{ fontWeight: 600 }}>
                            {`${sign}${formatAmount(Math.abs(n))} ${ticker}`}
                          </div>
                        );
                      })}
                    </td>
                    <td className={styles.hideMobile}>
                      <Hash
                        value={tx.txid}
                        href={`/scan/${tx.txid}`}
                        keep={6}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {(page > 0 || hasOlder) && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.navButton}
            aria-disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Newer
          </button>
          <span className={styles.muted}>Page {page + 1}</span>
          <button
            type="button"
            className={styles.navButton}
            aria-disabled={!hasOlder}
            onClick={() => hasOlder && setPage((p) => p + 1)}>
            Older
          </button>
        </div>
      )}
      <p className={styles.muted}>
        Value moves of every account, trust account and token this chain owns,
        staking rewards included, from the explorer index. Moves between its own
        accounts net to zero.
      </p>
      {txRQ.data && (
        <ExportButton
          filename={`nexus-${genesis.substring(0, 12)}-transactions.csv`}
          addresses={null}
          fetchPage={(before, limit) =>
            getIndex(`owner/${genesis}/transactions`, { limit, before })
          }
        />
      )}
    </Card>
  );
}
