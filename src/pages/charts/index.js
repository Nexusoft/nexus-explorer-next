import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import Charts from 'components/Views/Charts';

export default function ChartsPage() {
  return (
    <Layout>
      <PageHeader page="charts" />
      <PageTitle title="Charts">
        The chain over time, per UTC day, from the explorer index.
      </PageTitle>
      <Charts />
    </Layout>
  );
}
