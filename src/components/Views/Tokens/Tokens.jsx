import { Hash } from 'components/Detail';
import ErrorCard from 'components/common/NE_ErrorCard';
import Loader from 'components/common/NE_Loader';
import Table from 'components/Table';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useQuery } from 'react-query';
import { intlNum } from 'utils/converter';

export default function Tokens() {
  const { network, getTokens } = useNetwork();
  const { isLoading, data, error } = useQuery(
    ['tokens', network.name],
    getTokens
  );

  const columns = [
    {
      Header: '#',
      hideMobile: true,
      Cell: (props) => <div>{parseInt(props.cell.row.id) + 1}</div>,
    },
    {
      Header: 'Address',
      accessor: 'token',
      Cell: ({ value }) => <Hash value={value} href={`/scan/${value}`} />,
    },
    {
      Header: 'Ticker',
      accessor: 'ticker',
      Cell: ({ value }) => value || '-',
    },
    {
      Header: 'Maximum supply',
      hideMobile: true,
      align: 'right',
      accessor: 'maxsupply',
      Cell: ({ value }) => intlNum(value),
    },
    {
      Header: 'Current supply',
      align: 'right',
      accessor: 'currentsupply',
      Cell: ({ value }) => intlNum(value),
    },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '200px',
          margin: 'auto',
        }}>
        <Loader type="circle" size="5rem" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorCard />
      </div>
    );
  }

  if (data) {
    return (
      <div>
        <Table columns={columns} data={data.data.result} />
      </div>
    );
  }
}
