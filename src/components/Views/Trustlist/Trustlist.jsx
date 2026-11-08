import Table from 'components/Table/Table';
import { useState } from 'react';
import { useQuery } from 'react-query';
import styles from './trustlist.module.scss';
import { Hash } from 'components/Detail';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import DynamicPagination from 'components/common/NE_Pagination';
import PromiseLayout from 'components/HOC/PromiseLayout';
import { intlNum, pathOr } from 'utils';

export default function Trustlist() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount] = useState(Infinity);

  const { network, getTrustlist } = useNetwork();
  const { isLoading, data, error, isError } = useQuery(
    ['trustlist', pageIndex, pageSize, network.name],
    getTrustlist
  );

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
      Cell: ({ value }) => <Hash value={value} href={`/scan/${value}`} />,
    },
    {
      Header: 'Balance',
      hideMobile: true,
      align: 'right',
      accessor: 'balance',
      Cell: (props) =>
        intlNum(props.value, 'en-US', { maximumFractionDigits: 2 }) + ' NXS',
    },
    {
      Header: 'Stake',
      align: 'right',
      accessor: 'stake',
      Cell: (props) =>
        intlNum(props.value, 'en-US', { maximumFractionDigits: 2 }) + ' NXS',
    },
    {
      Header: 'Rate',
      hideMobile: true,
      align: 'right',
      accessor: 'rate',
      Cell: ({ value }) => (value != null ? `${value} %` : '-'),
    },
    {
      Header: 'Reward per day (est.)',
      hideMobile: true,
      align: 'right',
      id: 'daily',
      accessor: (row) => (row.stake * row.rate) / 100 / 365,
      Cell: ({ value }) =>
        Number.isFinite(value) ? `${value.toFixed(2)} NXS` : '-',
    },
    {
      Header: 'Staking for',
      hideMobile: true,
      accessor: 'age',
      Cell: ({ value }) => (value ? value.split(',')[0] : '-'),
    },
    {
      Header: 'Trust score',
      hideMobile: true,
      align: 'right',
      accessor: 'trust',
      Cell: (props) => intlNum(props.value),
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
    handleStartOfPageClick: () => {
      setPageIndex(0);
    },
    handlePreviousPageClick: () => {
      setPageIndex(pageIndex - 1);
    },
    handleNextPageClick: () => {
      setPageIndex(pageIndex + 1);
    },
  };

  return (
    <>
      <div className={styles.page} style={{ marginBottom: '1rem' }}>
        <PromiseLayout
          isLoading={isLoading}
          isError={isError}
          error={pathOr({}, ['response', 'data', 'error'], error)}>
          {data && (
            <Table
              columns={columns}
              data={error?.response?.data ? [] : data.result}
              paginate={false}
            />
          )}
          <div style={{ marginBottom: '1rem' }}>
            <DynamicPagination
              controls={dynamicPageControls}
              isStaticPanination={false}
            />
          </div>
        </PromiseLayout>
      </div>
    </>
  );
}
