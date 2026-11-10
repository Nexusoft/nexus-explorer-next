import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import Developers from 'components/Views/Developers';

export default function DevelopersPage() {
  return (
    <Layout>
      <PageHeader page="developers" />
      <PageTitle title="Developers">
        The explorer&apos;s own API, built on its index of the whole chain.
      </PageTitle>
      <Developers />
    </Layout>
  );
}
