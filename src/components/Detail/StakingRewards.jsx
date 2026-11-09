import dynamic from 'next/dynamic';
import { useQuery } from 'react-query';
import { Card, SectionTitle, Stat, Stats, styles } from '.';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useThemeColors } from 'hooks/useThemeColors/useThemeColors';
import { formatAmount, formatInt } from 'utils/format';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const colorTokens = {
  bar: '--ch-stake',
  text: '--c-ink-3',
  grid: '--c-line-soft',
};

const monthTime = (m) => {
  const [y, mo] = m.split('-').map(Number);
  return Date.UTC(y, mo - 1, 1);
};

/** Staking rewards of a trust account per month, from the explorer index */
export default function StakingRewards({ address }) {
  const { network, getIndex } = useNetwork();
  const [colors, isDarkMode] = useThemeColors(colorTokens);
  const rewardsRQ = useQuery(
    ['stakingRewards', network.name, address],
    () => getIndex(`address/${address}/rewards`),
    { retry: false, staleTime: 10 * 60 * 1000 }
  );

  const months = rewardsRQ.data?.result || [];
  //no index, or a trust account that never staked
  if (!months.length) return null;

  const total = months.reduce((s, m) => s + m[2], 0);
  const count = months.reduce((s, m) => s + m[1], 0);
  const last30 = rewardsRQ.data.last30 || {};

  const options = colors && {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
      fontFamily: 'inherit',
      background: 'transparent',
    },
    colors: [colors.bar],
    plotOptions: { bar: { columnWidth: '80%', borderRadius: 2 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: colors.grid,
      xaxis: { lines: { show: false } },
      padding: { left: 4, right: 8 },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: true,
        datetimeFormatter: { year: 'yyyy', month: "MMM 'yy" },
        style: { colors: colors.text },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { colors: colors.text },
        formatter: (v) => formatInt(Math.round(v)),
      },
      forceNiceScale: true,
      min: 0,
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      x: { format: 'MMMM yyyy' },
      y: { formatter: (v) => `${formatAmount(v, 2)} NXS` },
    },
  };

  return (
    <Card>
      <SectionTitle note="per month, UTC">Staking rewards</SectionTitle>
      <Stats>
        <Stat
          label="Earned in total"
          value={`${formatAmount(total, 2)} NXS`}
          note={`${formatInt(count)} rewards since ${months[0][0]}`}
          big
        />
        <Stat
          label="Last 30 days"
          value={`${formatAmount(last30.amount || 0, 2)} NXS`}
          note={`${formatInt(last30.count || 0)} rewards`}
        />
      </Stats>
      {options && (
        <div style={{ margin: '0.5rem -0.5rem 0' }}>
          <Chart
            key={isDarkMode ? 'dark' : 'light'}
            options={options}
            series={[
              {
                name: 'Rewards',
                data: months.map((m) => [monthTime(m[0]), m[2]]),
              },
            ]}
            type="bar"
            height={220}
            width="100%"
          />
        </div>
      )}
      <p className={styles.muted}>
        Rewards this trust account received for staking, from the explorer
        index.
      </p>
    </Card>
  );
}
