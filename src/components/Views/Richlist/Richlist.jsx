import Table from 'components/Table/Table';
import { useQuery } from 'react-query';
import styles from './richlist.module.scss';
import { intlNum } from 'utils/converter';
import Distribution from './Distribution';
import TYPES from 'types';
import CopyText from 'components/common/NE_CopyText';
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
  const { network, getRichlist, getMining } = useNetwork();
  const isMainnet = network.name === NETWORKS.MAINNET.name;
  const { isLoading, data, error, isError } = useQuery(
    ['richlist', pageIndex, pageSize, network.name],
    () => getRichlist(pageIndex, pageSize),
    {
      placeholderData:
        pageIndex == 0
          ? isMainnet && { data: props.data.data.slice(0, pageSize) }
          : undefined, // * for testnet we don't have data in the props
      staleTime: 1000 * 60, // * 1 min
    }
  );

  // * data for pieChart
  const richlist111 = useQuery(
    ['richlist', network.name],
    isMainnet ? () => props.data : () => getRichlist(0, 111),
    {
      initialData: isMainnet ? props.data : undefined, // * for testnet we don't have data in the props
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
      Header: '#ID',
      Cell: (props) => (
        <div>{parseInt(props.cell.row.id) + 1 + pageIndex * pageSize}</div>
      ),
    },
    {
      Header: 'Address',
      accessor: 'address',
      Cell: ({ value }) =>
        value ? <CopyText link={`/scan/${value}`} value={value} /> : '-',
    },
    {
      Header: 'Balance',
      accessor: 'total',
      Cell: ({ value }) =>
        value
          ? intlNum(value, 'en-US', { maximumFractionDigits: 0 }) + ' NXS'
          : '-',
    },
    {
      Header: 'Share of supply',
      accessor: 'total',
      id: 'share',
      Cell: ({ value }) =>
        value && totalSupply
          ? `${((value / totalSupply) * 100).toFixed(3)} %`
          : '-',
    },
    {
      Header: 'Kind',
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

  return (
    <>
      <div className={styles.page} style={{ marginBottom: '1rem' }}>
        <PromiseLayout
          isLoading={isLoading}
          isError={isError}
          error={pathOr({}, ['response', 'data', 'error'], error)}
          loaderType={TYPES.LOADER.CIRCLE}>
          {pieData && <Distribution values={pieData} labels={PIE_LABELS} />}

          {/* // * Table with dual pagination */}
          <div>
            <div className={styles.top_pagination}>
              {pageSize > 10 && <Pagination controls={dynamicPageControls} />}
            </div>
            <Table columns={columns} data={data?.data || []} paginate={false} />
            <Pagination controls={dynamicPageControls} />
          </div>
        </PromiseLayout>
      </div>
    </>
  );
}
