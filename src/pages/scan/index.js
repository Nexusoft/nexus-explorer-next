import Layout from 'components/Layout';
import PageHeader from 'components/Header/PageHeader';
import { DetailPage, PageTitle } from 'components/Detail';
import SearchHelp from 'components/common/NE_SearchHelp';

//old query style links (/scan?token=ADDR) go to the address page
const addressParams = ['token', 'namespace', 'globalname'];
const base58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

export async function getServerSideProps({ query }) {
  const pick = (key) => {
    const v = query?.[key];
    return typeof v === 'string' && base58.test(v) ? v : null;
  };

  const invoice = pick('invoice');
  if (invoice) {
    return {
      redirect: { destination: `/scan/invoice-${invoice}`, permanent: false },
    };
  }
  for (const key of addressParams) {
    const addr = pick(key);
    if (addr) {
      return {
        redirect: { destination: `/scan/${addr}`, permanent: false },
      };
    }
  }
  return { props: {} };
}

export default function ScanIndex() {
  return (
    <Layout>
      <PageHeader page="SEARCH" />
      <DetailPage>
        <PageTitle title="Search">
          Look up a block, transaction, account or register with the search box
          above.
        </PageTitle>
        <SearchHelp />
      </DetailPage>
    </Layout>
  );
}
