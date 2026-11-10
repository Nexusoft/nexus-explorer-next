import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Card, Hash, OwnerHash, SectionTitle, styles } from '.';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { formatDate, formatDateShort, timeAgo } from 'utils/format';

const pageSize = 10;

/** One operation on the register in plain words, with whom it went to */
function describe(c) {
  switch (c.OP) {
    case 'CREATE':
      return 'Created';
    case 'WRITE':
    case 'APPEND':
      return 'Changed';
    case 'CLAIM':
      return 'Ownership claimed';
    case 'TRANSFER': {
      if (c.tokenized) {
        const token = c.recipient?.address;
        return (
          <>
            Tokenized: now owned by token{' '}
            <Hash value={token} href={`/scan/${token}`} keep={6} />
          </>
        );
      }
      if (c.exchange) return 'Offered for transfer to anyone';
      return (
        <>
          Transfer to <OwnerHash owner={c.recipient} /> started
        </>
      );
    }
    default:
      return c.OP;
  }
}

/** Created, changed and transferred: the operations on one register, from the explorer index */
export default function RegisterHistory({ address }) {
  const { network, getIndex, getScanResults } = useNetwork();
  const [page, setPage] = useState(0);
  //cursor per page: list rows below this height
  const [cursors, setCursors] = useState([undefined]);

  const historyRQ = useQuery(
    ['registerHistory', network.name, address, cursors[page]],
    async () => {
      const res = await getIndex(`address/${address}/transactions`, {
        registers: 1,
        limit: pageSize,
        before: cursors[page],
      });
      //the index keeps no recipients or signers, the node has them
      const txs = await Promise.all(
        res.result.map((t) =>
          getScanResults('ledger/get/transaction', {
            txid: t.txid,
            verbose: 'detail',
          })
            .then((d) => d.result)
            .catch(() => ({ txid: t.txid, timestamp: t.time, contracts: [] }))
        )
      );
      return { txs, next: res.next };
    },
    { keepPreviousData: true, retry: false, staleTime: 60000 }
  );

  useEffect(() => {
    const next = historyRQ.data?.next;
    if (historyRQ.isPreviousData) return;
    if (next != null && cursors.length === page + 1) {
      setCursors((c) => [...c, next]);
    }
  }, [historyRQ.data, historyRQ.isPreviousData, page]);

  //no index on this network
  if (historyRQ.isError) return null;

  const rows = (historyRQ.data?.txs || []).flatMap((tx) =>
    (tx.contracts || [])
      .filter((c) => c.address === address && c.OP !== 'FEE')
      .map((c, i) => ({ tx, c, key: `${tx.txid}-${i}` }))
  );
  const hasOlder = cursors.length > page + 1;

  return (
    <Card>
      <SectionTitle note={page > 0 ? `page ${page + 1}` : null}>
        History
      </SectionTitle>
      {historyRQ.isLoading && (
        <p className={styles.muted}>Loading history...</p>
      )}
      {!historyRQ.isLoading && rows.length === 0 && (
        <p className={styles.muted}>No changes found in the explorer index.</p>
      )}
      {rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>What happened</th>
                <th className={styles.hideMobile}>Signed by</th>
                <th className={styles.hideMobile}>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ tx, c, key }) => (
                <tr key={key}>
                  <td
                    title={formatDate(tx.timestamp)}
                    style={{ whiteSpace: 'nowrap' }}>
                    {formatDateShort(tx.timestamp)}
                    <div className={styles.muted}>{timeAgo(tx.timestamp)}</div>
                  </td>
                  <td>{describe(c)}</td>
                  <td className={styles.hideMobile}>
                    <OwnerHash owner={tx.genesis} />
                  </td>
                  <td className={styles.hideMobile}>
                    <Hash value={tx.txid} href={`/scan/${tx.txid}`} keep={6} />
                  </td>
                </tr>
              ))}
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
        A transfer to a signature chain is complete once the new owner claims
        it, until then the register has no owner. Tokenizing hands it to the
        token at once.
      </p>
    </Card>
  );
}
