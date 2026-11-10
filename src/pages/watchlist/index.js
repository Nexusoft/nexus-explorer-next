import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import Watchlist from 'components/Views/Watchlist';

export default function WatchlistPage() {
  return (
    <Layout>
      <PageHeader page="watchlist" />
      <PageTitle title="Watchlist">
        Accounts, signature chains and addresses you follow, with their current
        balance.
      </PageTitle>
      <Watchlist />
    </Layout>
  );
}
