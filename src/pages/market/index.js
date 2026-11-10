import { DetailPage, PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import MarketView from 'components/Views/Market';

export default function Market() {
  return (
    <Layout>
      <PageHeader page="MARKET" />
      <DetailPage>
        <PageTitle title="Market">
          Open orders and filled orders on the Nexus on-chain market, where
          tokens are traded against NXS without a middleman.
        </PageTitle>
        <MarketView />
      </DetailPage>
    </Layout>
  );
}
