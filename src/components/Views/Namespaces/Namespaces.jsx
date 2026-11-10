import { Hash } from 'components/Detail';
import { formatDateShort } from 'utils/format';
import ErrorMessage from 'components/common/NE_ErrorMessage';
import Loader from 'components/common/NE_Loader';
import Table from 'components/Table/Table';
import { useNetwork } from 'hooks';
import { useQuery } from 'react-query';

export default function Namespaces() {
  const { network, getNamespaces } = useNetwork();
  const { isLoading, data, error } = useQuery(
    ['namespaces', network.name],
    getNamespaces
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
      Header: 'Namespace',
      accessor: 'namespace',
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
        <Table columns={columns} data={data.data.result} />
      </div>
    );
  }
}
