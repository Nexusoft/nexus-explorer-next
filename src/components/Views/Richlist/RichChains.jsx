import Table from 'components/Table/Table';
import { OwnerHash, styles as detailStyles } from 'components/Detail';
import { intlNum } from 'utils/converter';
import { formatInt } from 'utils/format';

const nxs = (v) =>
  v ? intlNum(v, 'en-US', { maximumFractionDigits: 0 }) + ' NXS' : '-';

/** Largest NXS holders counted per signature chain, all its accounts together */
export default function RichChains({ data, totalSupply }) {
  const columns = [
    {
      Header: '#',
      Cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    {
      Header: 'Signature chain',
      accessor: 'owner',
      Cell: ({ value }) => <OwnerHash owner={value} />,
    },
    {
      Header: 'NXS',
      align: 'right',
      accessor: 'total',
      Cell: ({ value }) => nxs(value),
    },
    {
      Header: 'Share of supply',
      hideMobile: true,
      align: 'right',
      accessor: 'total',
      id: 'share',
      Cell: ({ value }) =>
        value && totalSupply
          ? `${((value / totalSupply) * 100).toFixed(3)} %`
          : '-',
    },
    {
      Header: 'Staked',
      hideMobile: true,
      align: 'right',
      accessor: 'stake',
      Cell: ({ value }) => nxs(value),
    },
    {
      Header: 'Accounts',
      hideMobile: true,
      align: 'right',
      accessor: 'accounts',
      Cell: ({ value }) => formatInt(value),
    },
  ];

  return (
    <div>
      <Table columns={columns} data={data.top} />
      <p className={detailStyles.muted}>
        All NXS accounts and trust accounts of one signature chain added up,
        stake included, from the hourly owner index. {formatInt(data.chains)}{' '}
        signature chains hold NXS; the largest {formatInt(data.top.length)} are
        listed. NXS still in legacy (pre Tritium) addresses belongs to no
        signature chain and is not counted.
      </p>
    </div>
  );
}
