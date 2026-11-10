import Table from 'components/Table/Table';
import { useQuery } from 'react-query';
import styles from './richlist.module.scss';
import { intlNum } from 'utils/converter';
import Distribution from './Distribution';
import RichChains from './RichChains';
import LegacyRich from './LegacyRich';
//same toggle buttons as the home page activity chart
import rangeStyles from '../Home/ActivityChart.module.scss';
import TYPES from 'types';
import { Hash } from 'components/Detail';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useEffect, useState } from 'react';
import Pagination from 'components/common/NE_Pagination';
import { NETWORKS } from 'types/ConstantsTypes';
import PromiseLayout from 'components/HOC/PromiseLayout';
import { pathOr } from 'utils';

export default function Richlist(props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [pageCount] = useState(Infinity);

  const [pieData, setPieData] = useState();

  // * api calls
  const { network, getRichlist, getMining, getRichChains, getLegacyRich } =
    useNetwork();
  //daily, only once the legacy inputs are indexed
  const legacyRQ = useQuery(['legacyrich', network.name], getLegacyRich, {
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const [view, setView] = useState('accounts');
  //one person often has several accounts, the index adds them up per chain
  const chainsRQ = useQuery(['richchains', network.name], getRichChains, {
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const isMainnet = network.name === NETWORKS.MAINNET.name;
  const { isLoading, data, error, isError } = useQuery(
    ['richlist', pageIndex, pageSize, network.name],
    () => getRichlist(pageIndex, pageSize),
    {
      //the build may have had no rich list (slow node), then it loads here
      placeholderData:
        pageIndex == 0 && isMainnet && props.data?.data
          ? { data: props.data.data.slice(0, pageSize) }
          : undefined, // * for testnet we don't have data in the props
      staleTime: 1000 * 60, // * 1 min
    }
  );

  // * data for pieChart
  const built = isMainnet && props.data?.data ? props.data : undefined;
  const richlist111 = useQuery(
    ['richlist', network.name],
    built ? () => built : () => getRichlist(0, 111),
    {
      initialData: built, // * for testnet we don't have data in the props
    }
  );

  //system/get/metrics has no supply, ledger/get/info does
  const miningRQ = useQuery(['mining', network.name], getMining);
  const totalSupply = miningRQ?.data?.data?.result?.supply?.total;
  const PIE_LABELS = [
    'Largest account',
    'Ranks 2 to 10',
    'Ranks 11 to 100',
    'All other accounts',
  ];

  const columns = [
    {
      Header: '#',
      Cell: (props) => (
        <div>{parseInt(props.cell.row.id) + 1 + pageIndex * pageSize}</div>
      ),
    },
    {
      Header: 'Address',
      accessor: 'address',
      Cell: ({ value }) =>
        value ? <Hash value={value} href={`/scan/${value}`} /> : '-',
    },
    {
      Header: 'Balance',
      align: 'right',
      accessor: 'total',
      Cell: ({ value }) =>
        value
          ? intlNum(value, 'en-US', { maximumFractionDigits: 0 }) + ' NXS'
          : '-',
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
      Header: 'Kind',
      hideMobile: true,
      accessor: 'type',
      Cell: ({ row }) =>
        row.original.type === 'TRUST'
          ? `Staking (${intlNum(row.original.rate?.toFixed(2))} %)`
          : 'Account',
    },
  ];

  const dynamicPageControls = {
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex < pageCount - 1,
    pageCount: pageCount,
    pageIndex: pageIndex,
    pageSize: pageSize,
    gotoPage: (pageIndex) => {
      setPageIndex(pageIndex);
    },
    setPageSize: (pageSize) => {
      setPageIndex(0);
      setPageSize(pageSize);
    },
  };

  // * effect to calculate and load piechart data when the richlist111 data is loaded
  useEffect(() => {
    if (richlist111.data) {
      const sortedData = richlist111.data.data;
      const sum = (from, to) =>
        sortedData.slice(from, to).reduce((acc, cur) => acc + cur.total, 0);
      const groups = [sum(0, 1), sum(1, 10), sum(10, 100)];
      const supply = totalSupply || TYPES.MAX_SUPPLY.VALUE;
      setPieData([...groups, supply - groups.reduce((x, y) => x + y, 0)]);
    }
  }, [richlist111.data, totalSupply]);

  const chains = chainsRQ.data;
  const legacy = legacyRQ.data;
  //views the explorer index can offer on this network
  const views = [
    ['accounts', 'Accounts', 'One line per account'],
    chains && [
      'chains',
      'Signature chains',
      'One line per signature chain, all its accounts together',
    ],
    legacy && [
      'legacy',
      'Legacy addresses',
      'One line per pre Tritium address',
    ],
  ].filter(Boolean);
  return (
    <>
      {views.length > 1 && (
        <div className={rangeStyles.head} style={{ marginBottom: '1rem' }}>
          <p className={rangeStyles.caption}>
            {views.find(([key]) => key === view)?.[2]}
          </p>
          <div
            className={rangeStyles.periods}
            role="group"
            aria-label="Count by">
            {views.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {chains && view === 'chains' ? (
        <RichChains data={chains} totalSupply={totalSupply} />
      ) : legacy && view === 'legacy' ? (
        <LegacyRich data={legacy} totalSupply={totalSupply} />
      ) : (
        <div className={styles.page} style={{ marginBottom: '1rem' }}>
          <PromiseLayout
            isLoading={isLoading}
            isError={isError}
            error={pathOr({}, ['response', 'data', 'error'], error)}>
            {pieData && <Distribution values={pieData} labels={PIE_LABELS} />}

            {/* // * Table with dual pagination */}
            <div>
              <div className={styles.top_pagination}>
                {pageSize > 10 && <Pagination controls={dynamicPageControls} />}
              </div>
              <Table
                columns={columns}
                data={data?.data || []}
                paginate={false}
              />
              <Pagination controls={dynamicPageControls} />
            </div>
          </PromiseLayout>
        </div>
      )}
    </>
  );
}
