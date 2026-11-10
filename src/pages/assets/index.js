import { DetailPage, PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import AssetsView from 'components/Views/Assets';

export default function Assets() {
  return (
    <Layout>
      <PageHeader page="ASSETS" />
      <DetailPage>
        <PageTitle title="Assets">
          Assets and supply items registered on the Nexus blockchain, newest
          change first.
        </PageTitle>
        <AssetsView />
      </DetailPage>
    </Layout>
  );
}
