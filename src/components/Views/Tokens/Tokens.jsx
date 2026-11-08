import { Hash } from 'components/Detail';
import ErrorMessage from 'components/common/NE_ErrorMessage';
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
