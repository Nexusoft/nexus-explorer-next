import { Hash } from 'components/Detail';
import { formatDateShort } from 'utils/format';
import Loader from 'components/common/NE_Loader';
import Table from 'components/Table/Table';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import ErrorMessage from 'components/common/NE_ErrorMessage';

export default function GlobalNames() {
  const { network, getGlobalNames } = useNetwork();
  const { isLoading, data, error } = useQuery(
    ['global_namespaces', network.name],
    getGlobalNames
  );

  const columns = [
    {
      Header: '#',
      hideMobile: true,
      Cell: (props) => <div>{parseInt(props.cell.row.id) + 1}</div>,
    },
    {
      Header: 'Address',
      accessor: 'address',
      Cell: ({ value }) => <Hash value={value} href={`/scan/${value}`} />,
    },
    {
      Header: 'Name',
      accessor: 'name',
    },
    {
      Header: 'Created',
      hideMobile: true,
      accessor: 'created',
      Cell: ({ value }) => formatDateShort(value),
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
        <Table columns={columns} data={data.result} />
      </div>
    );
  }
}
