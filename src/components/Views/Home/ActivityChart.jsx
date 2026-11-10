import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useThemeColors } from 'hooks/useThemeColors/useThemeColors';
import { isRewardTx } from 'utils/contracts';
import styles from './ActivityChart.module.scss';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

//blocks come about every 50 s, so the block counts cover each period with some margin
const periods = [
  { key: '2h', label: '2 hours', seconds: 2 * 3600, blocks: 160 },
  { key: '6h', label: '6 hours', seconds: 6 * 3600, blocks: 480 },
  { key: '24h', label: '24 hours', seconds: 24 * 3600, blocks: 1800 },
];
const bucketCount = 24;

//chart colors follow the CSS tokens of the current theme
const colorTokens = {
  tx: '--c-link',
  reward: '--c-ink-3',
  text: '--c-ink-3',
  grid: '--c-line-soft',
};

export default function ActivityChart({ initialBlocks }) {
  const [periodKey, setPeriodKey] = useState('2h');
  const period = periods.find((p) => p.key === periodKey);
  const [colors, isDarkMode] = useThemeColors(colorTokens);
  const { network, getRecentBlocks } = useNetwork();

  const { data, isLoading, isError, isFetching } = useQuery(
    ['activity', network.name, period.blocks],
    () => getRecentBlocks(period.blocks),
    {
      initialData:
        periodKey === '2h' && initialBlocks?.length ? initialBlocks : undefined,
      refetchInterval: 60 * 1000,
      keepPreviousData: true,
    }
  );

  const series = useMemo(() => {
    const blocks = data || [];
    const end = blocks[0]?.timestamp;
    if (!end) return null;
    const size = period.seconds / bucketCount;
    const start = end - period.seconds;
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      x: (start + (i + 1) * size) * 1000,
      tx: 0,
      reward: 0,
    }));
    for (const b of blocks) {
      if (b.timestamp <= start) continue;
      const i = Math.min(
        bucketCount - 1,
        Math.floor((b.timestamp - start) / size)
      );
      for (const tx of b.tx || []) {
        if (isRewardTx(tx)) buckets[i].reward += 1;
        else buckets[i].tx += 1;
      }
    }
    return [
      { name: 'Other transactions', data: buckets.map((b) => [b.x, b.tx]) },
      { name: 'Rewards', data: buckets.map((b) => [b.x, b.reward]) },
    ];
  }, [data, period]);

  const totals = series
    ? series.map((s) => s.data.reduce((sum, [, v]) => sum + v, 0))
    : null;

  const options = colors && {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
      fontFamily: 'inherit',
      background: 'transparent',
    },
    colors: [colors.tx, colors.reward],
    fill: { opacity: [1, 0.35] },
    plotOptions: { bar: { columnWidth: '72%', borderRadius: 1 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: colors.grid,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      padding: { left: 4, right: 4 },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: true,
        datetimeFormatter: { day: 'dd MMM', hour: 'HH:mm', minute: 'HH:mm' },
        style: { colors: colors.text },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: colors.text },
        formatter: (v) => Math.round(v),
      },
      forceNiceScale: true,
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      x: { format: 'dd MMM HH:mm UTC' },
    },
    states: { hover: { filter: { type: 'darken', value: 0.9 } } },
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <p className={styles.caption}>
          {totals
            ? `${totals[0] + totals[1]} transactions in the last ${
                period.label
              }, ${totals[1]} of them mining or staking rewards`
            : 'Transactions per time slot'}
        </p>
        <div className={styles.periods} role="group" aria-label="Time range">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={p.key === periodKey}
              onClick={() => setPeriodKey(p.key)}>
              {p.key}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.legend}>
        <span className={styles.keyTx}>Other transactions</span>
        <span className={styles.keyReward}>Rewards</span>
      </div>
      <div
        className={styles.chart}
        style={{ opacity: isFetching && !isLoading ? 0.6 : 1 }}>
        {isError && !data && (
          <p className={styles.caption}>Could not load blocks from the node.</p>
        )}
        {series && options && (
          <Chart
            key={isDarkMode ? 'dark' : 'light'}
            options={options}
            series={series}
            type="bar"
            height={220}
            width="100%"
          />
        )}
      </div>
    </div>
  );
}
