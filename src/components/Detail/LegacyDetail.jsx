import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import {
  Card,
  DetailHeader,
  DetailPage,
  Hash,
  SectionTitle,
  Stat,
  Stats,
  styles,
} from '.';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import {
  formatAmount,
  formatDate,
  formatDateShort,
  formatInt,
  shortHash,
  timeAgo,
} from 'utils/format';
import {
  describeContract,
  moveToContract,
  netForAddresses,
} from 'utils/contracts';
import ExportButton from './ExportButton';
import WatchButton from './WatchButton';

const pageSize = 25;

function LegacyTransactions({ address }) {
  const { network, getIndex } = useNetwork();
  const [page, setPage] = useState(0);
  //cursor per page: list rows below this height
  const [cursors, setCursors] = useState([undefined]);
  const txRQ = useQuery(
    ['legacyTransactions', network.name, address, cursors[page]],
    () =>
      getIndex(`address/${address}/transactions`, {
        limit: pageSize,
        before: cursors[page],
      }),
    { keepPreviousData: true, retry: false, staleTime: 60000 }
  );
  useEffect(() => {
    const next = txRQ.data?.next;
    if (txRQ.isPreviousData) return;
    if (next != null && cursors.length === page + 1) {
      setCursors((c) => [...c, next]);
    }
  }, [txRQ.data, txRQ.isPreviousData, page]);

  const mine = new Set([address]);
  const rows = (txRQ.data?.result || []).map((t) => ({
    txid: t.txid,
    type: t.type,
    timestamp: t.time,
    contracts: t.moves.map((m) => moveToContract(m, t.type)),
  }));
  const hasOlder = cursors.length > page + 1;

  return (
    <Card>
      <SectionTitle note={page > 0 ? `page ${page + 1}` : null}>
        Transactions
      </SectionTitle>
      {txRQ.isLoading && (
        <p className={styles.muted}>Loading transactions...</p>
      )}
      {rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>What</th>
                <th className={styles.right}>Change</th>
                <th className={styles.hideMobile}>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const { nets } = netForAddresses(tx, mine);
                const net = nets.NXS || 0;
                const sign = net > 0 ? '+' : net < 0 ? '-' : '';
                const labels = [
                  ...new Set(
                    tx.contracts.map((c) => describeContract(c).label)
                  ),
                ].join(', ');
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
                    <td className={styles.right}>
                      <span
                        className={styles.flowAmount}
                        data-sign={sign}
                        style={{ fontWeight: 600 }}>
                        {net
                          ? `${sign}${formatAmount(Math.abs(net))} NXS`
                          : '-'}
                      </span>
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
      {txRQ.data && (
        <ExportButton
          filename={`nexus-${address.substring(0, 12)}-transactions.csv`}
          addresses={mine}
          fetchPage={(before, limit) =>
            getIndex(`address/${address}/transactions`, { limit, before })
          }
        />
      )}
    </Card>
  );
}

/** Pre Tritium address: everything from the explorer index, the node keeps no balance */
export default function LegacyDetail({ address }) {
  const { network, getIndex } = useNetwork();
  const legacyRQ = useQuery(
    ['legacy', network.name, address],
    () => getIndex(`legacy/${address}`),
    { retry: false, staleTime: 60000 }
  );
  const d = legacyRQ.data?.result;

  return (
    <DetailPage>
      <DetailHeader
        kind="Legacy address"
        title={shortHash(address, 8)}
        actions={
          <WatchButton
            id={address}
            kind="legacy"
            label={shortHash(address, 8)}
          />
        }
        subtitle={<Hash value={address} full />}
        badges={[
          { text: 'pre Tritium' },
          d?.last && { text: `last active ${timeAgo(d.last)}` },
        ]}
      />
      <Card>
        {legacyRQ.isLoading && <p className={styles.muted}>Loading...</p>}
        {legacyRQ.isError && (
          <p className={styles.muted}>
            Legacy addresses are read from the explorer index, which is not
            available on this network.
          </p>
        )}
        {d && (
          <>
            <Stats>
              <Stat
                label="Balance"
                value={`${formatAmount(d.balance, 2)} NXS`}
                big
              />
              <Stat
                label="Received"
                value={`${formatAmount(d.received, 2)} NXS`}
                note={`${formatInt(d.outputs)} outputs`}
              />
              <Stat
                label="Spent"
                value={`${formatAmount(d.spent, 2)} NXS`}
                note={`${formatInt(d.inputs)} inputs`}
              />
              <Stat
                label="First seen"
                value={d.first ? formatDateShort(d.first) : '-'}
                note={d.first ? `UTC, ${timeAgo(d.first)}` : null}
              />
            </Stats>
            <p className={styles.muted}>
              {d.complete
                ? 'A legacy address has no register: its balance is everything sent to it minus everything it spent.'
                : 'The explorer is still indexing what legacy addresses spent, so the spent amount and the balance may not be final yet.'}{' '}
              Tritium wallets move legacy NXS into an account with a legacy
              payment.
            </p>
          </>
        )}
      </Card>
      {d && <LegacyTransactions address={address} />}
    </DetailPage>
  );
}
