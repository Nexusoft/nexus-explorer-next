import Table from 'components/Table/Table';
import { Hash, styles as detailStyles } from 'components/Detail';
import { intlNum } from 'utils/converter';
import { formatInt } from 'utils/format';

/** Largest legacy (pre Tritium) addresses, from the explorer index */
export default function LegacyRich({ data, totalSupply }) {
  const columns = [
    {
      Header: '#',
      Cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    {
      Header: 'Legacy address',
      accessor: 'address',
      Cell: ({ value }) => <Hash value={value} href={`/scan/${value}`} />,
    },
    {
      Header: 'NXS',
      align: 'right',
      accessor: 'balance',
      Cell: ({ value }) =>
        intlNum(value, 'en-US', { maximumFractionDigits: 0 }) + ' NXS',
    },
    {
      Header: 'Share of supply',
      hideMobile: true,
      align: 'right',
      accessor: 'balance',
      id: 'share',
      Cell: ({ value }) =>
        totalSupply ? `${((value / totalSupply) * 100).toFixed(3)} %` : '-',
    },
  ];

  return (
    <div>
      <Table columns={columns} data={data.top} />
      <p className={detailStyles.muted}>
        NXS never moved to Tritium: {formatInt(data.addresses)} legacy addresses
        hold {intlNum(data.total, 'en-US', { maximumFractionDigits: 0 })} NXS
        {totalSupply
          ? ` (${((data.total / totalSupply) * 100).toFixed(
              1
            )} % of the supply)`
          : ''}
        . Worked out from every legacy output and input in the explorer index,
        once a day; the largest {formatInt(data.top.length)} are listed.
      </p>
    </div>
  );
}
