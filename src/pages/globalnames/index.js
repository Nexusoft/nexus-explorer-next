import { PageTitle } from 'components/Detail';
import GlobalNamesView from 'components/Views/GlobalNames';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';

export default function GlobalNames() {
  return (
    <Layout>
      <PageHeader page={'GLOBALNAMES'} />
      <PageTitle title="Global names">
        Names registered for the whole network, each pointing to a register such
        as an account or an asset.
      </PageTitle>
      <GlobalNamesView />
    </Layout>
  );
}
