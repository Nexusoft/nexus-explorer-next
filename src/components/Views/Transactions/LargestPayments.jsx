import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks';
import { styles } from 'components/Detail';
import rangeStyles from '../Home/ActivityChart.module.scss';
import { moveToContract } from 'utils/contracts';
import { timeAgo } from 'utils/format';
import TxTable from './TxTable';

//indexer LARGEST_PERIODS, 0 = all time
const PERIODS = [
  ['7', '7 days'],
  ['30', '30 days'],
  ['365', 'Year'],
  ['0', 'All time'],
];

export default function LargestPayments() {
  const router = useRouter();
  const days = PERIODS.some(([d]) => d === router.query.days)
    ? router.query.days
    : '30';
  const setDays = (d) =>
    router.replace(
      { pathname: router.pathname, query: { ...router.query, days: d } },
      undefined,
      { shallow: true }
    );
  const { network, getIndex } = useNetwork();

  const rq = useQuery(
    ['largestPayments', network.name, days],
    () => getIndex('largest', { days, limit: 50 }),
    { keepPreviousData: true, refetchInterval: 600000 }
  );

  const rows = useMemo(
    () =>
      (rq.data?.result || []).map((t) => ({
        txid: t.txid,
        height: t.height,
        timestamp: t.time,
        type: t.type,
        moved: t.moved,
        contracts: t.moves.map((m) => moveToContract(m, t.type)),
      })),
    [rq.data]
  );

  return (
    <>
      <div
        className={rangeStyles.periods}
        role="group"
        aria-label="Period"
        style={{ marginBottom: '0.5rem' }}>
        {PERIODS.map(([d, label]) => (
          <button
            key={d}
            type="button"
            aria-pressed={days === d}
            onClick={() => setDays(d)}>
            {label}
          </button>
        ))}
      </div>
      {rq.isLoading && <p className={styles.muted}>Loading payments...</p>}
      {rq.isError && (
        <p className={styles.muted}>Could not load the largest payments.</p>
      )}
      {rq.isSuccess && rq.data?.result == null && (
        <p className={styles.muted}>
          The explorer index has not worked out the largest payments yet.
        </p>
      )}
      {rq.isSuccess && rq.data?.result?.length === 0 && (
        <p className={styles.muted}>No NXS payments in this period.</p>
      )}
      {rows.length > 0 && (
        <TxTable rows={rows} moved faded={rq.isFetching && rq.isPreviousData} />
      )}
      <p className={styles.muted}>
        NXS sent in one transaction: the debits, or for a legacy transaction its
        outputs without the change. Token payments are not counted.
        {rq.data?.updated &&
          ` Worked out ${timeAgo(rq.data.updated)} by the explorer index.`}
      </p>
    </>
  );
}
