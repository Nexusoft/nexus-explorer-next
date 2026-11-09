import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from 'react-query';
import { Card, SectionTitle, styles as detailStyles } from 'components/Detail';
import Loader from 'components/common/NE_Loader';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useThemeColors } from 'hooks/useThemeColors/useThemeColors';
import { formatAmount, formatInt } from 'utils/format';
import { StringsTypes } from 'types/StringsTypes';
//same range buttons and caption as the home page activity chart
import rangeStyles from '../Home/ActivityChart.module.scss';
import styles from './Charts.module.scss';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const DAY = 86400;
//longer ranges are summed per week so the lines stay readable
const ranges = [
  { key: '1y', label: '1 year', days: 365, bucket: 1 },
  { key: '3y', label: '3 years', days: 3 * 365, bucket: 7 },
  { key: 'all', label: 'All', days: null, bucket: 7 },
];
const channels = [0, 1, 2];
const channelVar = ['--ch-stake', '--ch-prime', '--ch-hash'];

const colorTokens = {
  single: '--c-link',
  channels: channelVar,
  text: '--c-ink-3',
  grid: '--c-line-soft',
};

/**
 * Daily rows into buckets of `size` days: {t, days, blocks[3], mint[3], txs, transfers,
 * created = all NXS minted up to the bucket's end, starting from `minted` before the rows}
 */
function bucketize(rows, size, minted = 0) {
  const out = [];
  let created = minted;
  for (const [day, bs, bp, bh, ms, mp, mh, txs, transfers] of rows) {
    const start = Math.floor(day / size) * size;
    let b = out[out.length - 1];
    if (!b || b.start !== start) {
      b = {
        start,
        t: start * DAY * 1000,
        days: 0,
        blocks: [0, 0, 0],
        mint: [0, 0, 0],
        txs: 0,
        transfers: 0,
      };
      out.push(b);
    }
    b.days += 1;
    [bs, bp, bh].forEach((n, i) => (b.blocks[i] += n));
    [ms, mp, mh].forEach((n, i) => (b.mint[i] += n));
    b.txs += txs;
    b.transfers += transfers;
    created += ms + mp + mh;
    b.created = created;
  }
  //a week cut by the range start or by today counts too few days
  return out.filter((b) => b.days === size);
}

function baseOptions(colors, isDarkMode, unit) {
  return {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
      fontFamily: 'inherit',
      background: 'transparent',
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 2, curve: 'straight' },
    grid: {
      borderColor: colors.grid,
      xaxis: { lines: { show: false } },
      padding: { left: 4, right: 8 },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: true,
        datetimeFormatter: { year: 'yyyy', month: "MMM 'yy", day: 'dd MMM' },
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
      shared: true,
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (v) => `${formatAmount(v, 2)} ${unit}` },
    },
    markers: { size: 0, hover: { size: 5 } },
  };
}

function ChannelLegend() {
  return (
    <div className={styles.legend}>
      {channels.map((c) => (
        <span key={c} style={{ '--swatch': `var(${channelVar[c]})` }}>
          {StringsTypes.CHANNELS[c]}
        </span>
      ))}
    </div>
  );
}

function ChartCard({ title, note, legend, children }) {
  return (
    <Card>
      <SectionTitle note={note}>{title}</SectionTitle>
      {legend}
      <div className={styles.chart}>{children}</div>
    </Card>
  );
}

/** Transactions, blocks per channel, minted NXS and block time over time */
export default function Charts() {
  const { network, getDaily, getMining } = useNetwork();
  //same query as the metrics page, cached 10 minutes by the proxy
  const miningRQ = useQuery(['mining', network.name], getMining, {
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const [rangeKey, setRangeKey] = useState('1y');
  const range = ranges.find((r) => r.key === rangeKey);
  const [colors, isDarkMode] = useThemeColors(colorTokens);

  const dailyRQ = useQuery(['daily', network.name], getDaily, {
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const buckets = useMemo(() => {
    const rows = dailyRQ.data || [];
    //today is not over yet
    const today = Math.floor(Date.now() / 1000 / DAY);
    const done = rows.filter((r) => r[0] < today);
    const from = range.days ? today - range.days : -Infinity;
    //NXS minted before the range, so the supply line starts at the right height
    const before = done
      .filter((r) => r[0] < from)
      .reduce((s, r) => s + r[4] + r[5] + r[6], 0);
    return bucketize(
      done.filter((r) => r[0] >= from),
      range.bucket,
      before
    );
  }, [dailyRQ.data, range]);

  //the node's supply = everything minted minus what was burned
  const supply = miningRQ.data?.data?.result?.supply;

  if (dailyRQ.isLoading) return <Loader />;
  if (!dailyRQ.data) {
    return (
      <Card>
        <p className={detailStyles.muted}>
          The charts come from the explorer index, which is not available on
          this network.
        </p>
      </Card>
    );
  }

  const per = range.bucket === 1 ? 'day' : 'week';
  const line = (name, values) => ({
    name,
    data: buckets.map((b, i) => [b.t, values[i]]),
  });

  const charts = colors && [
    {
      key: 'tx',
      title: `Transactions per ${per}`,
      note: 'without mining and staking rewards',
      series: [
        line(
          'Transactions',
          buckets.map((b) => b.transfers)
        ),
      ],
      options: {
        ...baseOptions(colors, isDarkMode, ''),
        colors: [colors.single],
      },
    },
    {
      key: 'blocks',
      title: `Blocks per ${per}`,
      note: 'by channel',
      legend: <ChannelLegend />,
      series: channels.map((c) =>
        line(
          StringsTypes.CHANNELS[c],
          buckets.map((b) => b.blocks[c])
        )
      ),
      options: {
        ...baseOptions(colors, isDarkMode, 'blocks'),
        colors: colors.channels,
      },
    },
    {
      key: 'mint',
      title: `NXS minted per ${per}`,
      note: 'block rewards by channel, stacked',
      legend: <ChannelLegend />,
      type: 'area',
      series: channels.map((c) =>
        line(
          StringsTypes.CHANNELS[c],
          buckets.map((b) => b.mint[c])
        )
      ),
      options: {
        ...baseOptions(colors, isDarkMode, 'NXS'),
        chart: {
          ...baseOptions(colors, isDarkMode, 'NXS').chart,
          stacked: true,
        },
        colors: colors.channels,
        fill: { type: 'solid', opacity: 0.85 },
        stroke: { width: 1, curve: 'straight', colors: ['transparent'] },
      },
    },
    {
      key: 'created',
      title: 'NXS created',
      note: supply?.total
        ? `all block rewards so far; the node's supply today is ${formatAmount(
            supply.total,
            0
          )} NXS after ${formatAmount(supply.burned || 0, 0)} NXS burned`
        : 'all block rewards so far',
      series: [
        line(
          'NXS created',
          buckets.map((b) => Math.round(b.created))
        ),
      ],
      options: {
        ...baseOptions(colors, isDarkMode, 'NXS'),
        colors: [colors.single],
        yaxis: {
          ...baseOptions(colors, isDarkMode, 'NXS').yaxis,
          //from zero the last year would be a flat line
          min: undefined,
          //millions keep the axis labels short
          labels: {
            style: { colors: colors.text },
            formatter: (v) => `${formatAmount(v / 1e6, 1)}M`,
          },
        },
      },
    },
    {
      key: 'blocktime',
      title: 'Average block time',
      note: 'seconds, all channels',
      series: [
        line(
          'Block time',
          buckets.map((b) => {
            const n = b.blocks[0] + b.blocks[1] + b.blocks[2];
            return n ? Math.round((b.days * DAY) / n) : null;
          })
        ),
      ],
      options: {
        ...baseOptions(colors, isDarkMode, 's'),
        colors: [colors.single],
      },
    },
  ];

  return (
    <div className={styles.page}>
      <div className={rangeStyles.head}>
        <p className={rangeStyles.caption}>
          {buckets.length
            ? `${formatInt(buckets.length)} ${per}s, UTC, up to yesterday`
            : 'No data for this range'}
        </p>
        <div
          className={rangeStyles.periods}
          role="group"
          aria-label="Time range">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={r.key === rangeKey}
              onClick={() => setRangeKey(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {charts &&
        charts.map((c) => (
          <ChartCard
            key={c.key}
            title={c.title}
            note={c.note}
            legend={c.legend}>
            <Chart
              key={`${c.key}-${isDarkMode ? 'dark' : 'light'}`}
              options={c.options}
              series={c.series}
              type={c.type || 'line'}
              height={240}
              width="100%"
            />
          </ChartCard>
        ))}

      <Card>
        <details>
          <summary className={styles.tableToggle}>Table</summary>
          <div className={detailStyles.tableWrap}>
            <table className={detailStyles.table}>
              <thead>
                <tr>
                  <th>{per === 'day' ? 'Day' : 'Week from'}</th>
                  <th className={detailStyles.right}>Transactions</th>
                  {channels.map((c) => (
                    <th key={c} className={detailStyles.right}>
                      {StringsTypes.CHANNELS[c]} blocks
                    </th>
                  ))}
                  <th className={detailStyles.right}>NXS minted</th>
                </tr>
              </thead>
              <tbody>
                {[...buckets].reverse().map((b) => (
                  <tr key={b.start}>
                    <td>{new Date(b.t).toISOString().substring(0, 10)}</td>
                    <td className={detailStyles.right}>
                      {formatInt(b.transfers)}
                    </td>
                    {channels.map((c) => (
                      <td key={c} className={detailStyles.right}>
                        {formatInt(b.blocks[c])}
                      </td>
                    ))}
                    <td className={detailStyles.right}>
                      {formatAmount(b.mint[0] + b.mint[1] + b.mint[2], 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>
    </div>
  );
}
