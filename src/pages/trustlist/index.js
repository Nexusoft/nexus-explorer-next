import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import Trustlist from 'components/Views/Trustlist';

export default function index() {
  return (
    <Layout>
      <PageHeader page="Trustlist" />
      <PageTitle title="Top stakers">
        Trust accounts ranked by trust score. The staking rate grows with
        uninterrupted staking time.
      </PageTitle>
      <Trustlist />
    </Layout>
  );
}
