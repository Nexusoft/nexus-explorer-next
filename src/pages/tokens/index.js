import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import TokensView from 'components/Views/Tokens';

export default function Tokens() {
  return (
    <Layout>
      <PageHeader page="Tokens" />
      <PageTitle title="Tokens">
        Tokens created on the Nexus blockchain, largest maximum supply first.
      </PageTitle>
      <TokensView />
    </Layout>
  );
}
