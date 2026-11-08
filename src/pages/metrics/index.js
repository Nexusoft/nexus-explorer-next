import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import Metrics from 'components/Views/Metrics';

export default function index() {
  return (
    <Layout>
      <PageHeader page={'metrics'}></PageHeader>
      <PageTitle title="Network metrics">
        Supply, staking and activity figures for the whole network.
      </PageTitle>
      <Metrics />
    </Layout>
  );
}
