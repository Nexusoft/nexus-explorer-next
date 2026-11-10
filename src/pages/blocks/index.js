import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import BlocksView from 'components/Views/Blocks';

export default function Blocks() {
  return (
    <Layout>
      <PageHeader page="blocks" />
      <PageTitle title="Blocks">
        Every block on the chain, newest first.
      </PageTitle>
      <BlocksView />
    </Layout>
  );
}
