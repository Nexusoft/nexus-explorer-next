import { Hash } from 'components/Detail';
import ErrorMessage from 'components/common/NE_ErrorMessage';
import Loader from 'components/common/NE_Loader';
import Table from 'components/Table';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useQuery } from 'react-query';
import { intlNum } from 'utils/converter';

export default function Tokens() {
  const { network, getTokens, getTokenHolders } = useNetwork();
  const { isLoading, data, error } = useQuery(
    ['tokens', network.name],
    getTokens
  );
  const holdersRQ = useQuery(['tokenholders', network.name], getTokenHolders, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const holders = holdersRQ.data;

  const holdersColumn = {
    Header: 'Holders',
    id: 'holders',
    align: 'right',
    accessor: (row) => holders?.[row.token]?.owners || 0,
    sortDescFirst: true,
    Cell: ({ value }) => intlNum(value),
  };

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
    ...(holders ? [holdersColumn] : []),
  ];

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div>
        <ErrorMessage error={error} />
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
