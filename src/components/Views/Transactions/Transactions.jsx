import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks';
import { Card, SectionTitle, styles } from 'components/Detail';
import ListPager from 'components/Detail/ListPager';
import { useRouter } from 'next/router';
//same toggle buttons as the home page activity chart
import rangeStyles from '../Home/ActivityChart.module.scss';
import { formatInt } from 'utils/format';
import { isRewardTx, moveToContract } from 'utils/contracts';
import TxTable from './TxTable';
import LargestPayments from './LargestPayments';

const indexPageSize = 25;

//kinds the explorer index stores per transaction (indexer TX_KINDS)
const KINDS = [
  ['', 'All kinds'],
  ['payment', 'Payments'],
  ['token', 'Tokens'],
  ['register', 'Registers'],
  ['ownership', 'Ownership'],
  ['legacy', 'Legacy'],
  ['reward', 'Rewards'],
  //not a kind: largest NXS payments of a period
  ['largest', 'Largest'],
];

export default function Transactions() {
  const router = useRouter();
  const kind = KINDS.some(([k]) => k && k === router.query.kind)
    ? router.query.kind
    : '';
  const setKind = (k) =>
    router.replace(
      { pathname: router.pathname, query: k ? { kind: k } : {} },
      undefined,
      { shallow: true }
    );
  const [page, setPage] = useState(0);
  const [blocksPerPage] = useState(50);
  const [transfersChoice, setTransfersChoice] = useState(null);
  //cursor per page for the indexed list: list rows below this height
  const [cursors, setCursors] = useState([undefined]);
  const { network, getTransactions, getIndex } = useNetwork();

  const statusRQ = useQuery(
    ['indexStatus', network.name],
    () => getIndex('status'),
    { retry: false, refetchInterval: 60000 }
  );
  const indexed = statusRQ.isSuccess && !!statusRQ.data?.result?.high;
  //with an index, transfers only is a useful default; scanning blocks it mostly finds nothing
  const transfersOnly = transfersChoice ?? indexed;

  useEffect(() => {
    setPage(0);
    setCursors([undefined]);
  }, [network.name, transfersOnly, indexed, kind]);

  const txRQ = useQuery(
    ['transactions', page, blocksPerPage, network.name],
    getTransactions,
    {
      keepPreviousData: true,
      refetchInterval: page === 0 ? 30000 : false,
      enabled: statusRQ.isError || (statusRQ.isSuccess && !indexed),
    }
  );

  const idxRQ = useQuery(
    ['indexedTransactions', network.name, transfersOnly, kind, cursors[page]],
    () =>
      getIndex('transactions', {
        limit: indexPageSize,
        //a chosen kind replaces the rewards switch
        transfers: !kind && transfersOnly ? 1 : 0,
        kind: kind || undefined,
        before: cursors[page],
      }),
    {
      enabled: indexed && kind !== 'largest',
      keepPreviousData: true,
      refetchInterval: page === 0 ? 30000 : false,
    }
  );

  useEffect(() => {
    const next = idxRQ.data?.next;
    if (indexed && next != null && cursors.length === page + 1) {
      setCursors((c) => [...c, next]);
    }
  }, [idxRQ.data, page, indexed]);

  const blocks = indexed ? [] : txRQ.data?.data?.result || [];
  const activeRQ = indexed ? idxRQ : txRQ;

  const { rows, hidden } = useMemo(() => {
    if (indexed) {
      const list = (idxRQ.data?.result || []).map((t) => ({
        txid: t.txid,
        height: t.height,
        timestamp: t.time,
        type: t.type,
        contracts: t.moves.map((m) => moveToContract(m, t.type)),
      }));
      return { rows: list, hidden: 0 };
    }
    const all = [];
    for (const b of blocks) {
      for (const tx of b.tx || []) all.push({ ...tx, height: b.height });
    }
    const shown = transfersOnly ? all.filter((tx) => !isRewardTx(tx)) : all;
    return { rows: shown, hidden: all.length - shown.length };
  }, [blocks, transfersOnly, indexed, idxRQ.data]);

  const first = indexed ? rows[0]?.height : blocks[0]?.height;
  const last = indexed
    ? rows[rows.length - 1]?.height
    : blocks[blocks.length - 1]?.height;
  const indexLow = statusRQ.data?.result?.low;
  const largest = indexed && kind === 'largest';

  return (
    <Card>
      <SectionTitle>
        {largest
          ? 'Largest NXS payments'
          : first != null
          ? `In blocks ${formatInt(last)} to ${formatInt(first)}`
          : 'Transactions'}
      </SectionTitle>
      {indexed && (
        <div
          className={rangeStyles.periods}
          role="group"
          aria-label="Kind of transaction"
          style={{ flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {KINDS.map(([k, label]) => (
            <button
              key={k || 'all'}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}>
              {label}
            </button>
          ))}
        </div>
      )}
      {largest && <LargestPayments />}
      {!kind && (
        <label
          className={styles.muted}
          style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={transfersOnly}
            onChange={(e) => setTransfersChoice(e.target.checked)}
          />
          Hide mining and staking rewards
          {transfersOnly && hidden > 0 && ` (${formatInt(hidden)} hidden)`}
        </label>
      )}

      {!largest && (
        <>
          {activeRQ.isLoading && (
            <p className={styles.muted}>Loading transactions...</p>
          )}
          {activeRQ.isError && (
            <p className={styles.muted}>
              Could not load transactions from the node.
            </p>
          )}
          {!activeRQ.isLoading && !activeRQ.isError && rows.length === 0 && (
            <p className={styles.muted}>
              {indexed
                ? 'No transactions found.'
                : `No ${
                    transfersOnly ? 'transfers' : 'transactions'
                  } in these ${blocks.length} blocks. Try Older.`}
            </p>
          )}

          {rows.length > 0 && (
            <TxTable
              rows={rows}
              faded={activeRQ.isFetching && activeRQ.isPreviousData}
            />
          )}
          <ListPager
            page={page}
            setPage={setPage}
            pageSize={blocksPerPage}
            hasOlder={
              indexed
                ? idxRQ.data?.next != null && cursors.length > page + 1
                : last > 0
            }
          />
          <p className={styles.muted}>
            {indexed
              ? `From the explorer index (blocks ${formatInt(
                  indexLow
                )} to ${formatInt(statusRQ.data.result.high)}${
                  indexLow > 1 ? ', still indexing older blocks' : ''
                }).`
              : `The node has no global transaction index, so this list scans ${blocksPerPage} blocks per page.`}
          </p>
        </>
      )}
    </Card>
  );
}
