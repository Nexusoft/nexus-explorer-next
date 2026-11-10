import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import NamespacesView from 'components/Views/Namespaces';

export default function Namespaces() {
  return (
    <Layout>
      <PageHeader page={'namespaces'} />
      <PageTitle title="Namespaces">
        Namespaces and their owners. Names inside a namespace can only be
        created by its owner.
      </PageTitle>
      <NamespacesView />
    </Layout>
  );
}
