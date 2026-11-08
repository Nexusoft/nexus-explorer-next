import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks';
import { Card, Hash, Party, SectionTitle, styles } from 'components/Detail';
import ListPager from 'components/Detail/ListPager';
import { formatAmount, formatDate, formatInt, timeAgo } from 'utils/format';
import {
  describeContract,
  isRewardTx,
  transactionHeadline,
} from 'utils/contracts';

//indexer move row back into the contract shape describeContract reads
function moveToContract(m) {
  const to = { address: m.to_addr, name: m.to_name };
  return {
    OP: m.op,
    amount: m.amount,
    ticker: m.ticker,
    from: m.from_addr ? { address: m.from_addr, name: m.from_name } : null,
    to: m.to_addr ? to : null,
    genesis: m.op === 'COINBASE' ? m.to_addr : undefined,
    address: m.to_addr,
    name: m.to_name,
  };
}

const indexPageSize = 25;

export default function Transactions() {
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
  }, [network.name, transfersOnly, indexed]);

  const txRQ = useQuery(
    ['transactions', page, blocksPerPage, network.name],
    getTransactions,
    {
      keepPreviousData: true,
      refetchInterval: page === 0 ? 30000 : false,
      enabled: statusRQ.isError,
    }
  );

  const idxRQ = useQuery(
    ['indexedTransactions', network.name, transfersOnly, cursors[page]],
    () =>
      getIndex('transactions', {
        limit: indexPageSize,
        transfers: transfersOnly ? 1 : 0,
        before: cursors[page],
      }),
    {
      enabled: indexed,
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
        contracts: t.moves.map(moveToContract),
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

  return (
    <Card>
      <SectionTitle>
        {first != null
          ? `In blocks ${formatInt(last)} to ${formatInt(first)}`
          : 'Transactions'}
      </SectionTitle>
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
            : `No ${transfersOnly ? 'transfers' : 'transactions'} in these ${
                blocks.length
              } blocks. Try Older.`}
        </p>
      )}

      {rows.length > 0 && (
        <div
          className={styles.tableWrap}
          style={{
            opacity: activeRQ.isFetching && activeRQ.isPreviousData ? 0.5 : 1,
          }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>What happened</th>
                <th className={styles.hideMobile}>From</th>
                <th className={styles.hideMobile}>To</th>
                <th className={styles.hideMobile}>Block</th>
                <th>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const d = describeContract(tx.contracts?.[0]);
                const more = (tx.contracts?.length || 0) > 1;
                return (
                  <tr key={tx.txid}>
                    <td
                      title={formatDate(tx.timestamp)}
                      style={{ whiteSpace: 'nowrap' }}>
                      {timeAgo(tx.timestamp)}
                    </td>
                    <td>{transactionHeadline(tx, formatAmount)}</td>
                    <td className={styles.hideMobile}>
                      <Party party={d.from} />
                    </td>
                    <td className={styles.hideMobile}>
                      <Party party={d.to} />
                      {more && <div className={styles.muted}>and more</div>}
                    </td>
                    <td className={styles.hideMobile}>
                      <Link href={`/scan/${tx.height}`}>
                        <a>{formatInt(tx.height)}</a>
                      </Link>
                    </td>
                    <td>
                      <Hash
                        value={tx.txid}
                        href={`/scan/${tx.txid}`}
                        keep={5}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
    </Card>
  );
}
