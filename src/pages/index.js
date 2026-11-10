import TYPES from 'types';
import {
  fetchInfo,
  fetchMarket,
  fetchMetrics,
  fetchMining,
  fetchRecentBlocks,
  forBuild,
} from 'utils/common/fetch';

import PageHeader from 'components/Header/PageHeader';
import HomeView, { homeBlockCount } from 'components/Views/Home';
import Layout from 'components/Layout';

// * SSG with initial data
// * https://react-query.tanstack.com/guides/ssr

export async function getStaticProps() {
  //one failing or slow source must not take the whole page down, the client refetches anything missing
  const [metrics, info, mining, market, blocks] = await Promise.all(
    [
      fetchMetrics(),
      fetchInfo(),
      fetchMining(),
      fetchMarket(),
      fetchRecentBlocks(homeBlockCount),
    ].map(forBuild)
  );

  //react-query initialData: undefined (not null) so the query fetches on mount
  const initial = (res) => (res?.data ? { data: res.data } : null);

  return {
    props: {
      metrics: initial(metrics),
      info: initial(info),
      mining: initial(mining),
      market: initial(market),
      blocks: blocks || null,
    },

    revalidate: TYPES.REFETCH_INTERVALS.REGENERATE_SSG_INTERVAL,
  };
}

export default function Home(props) {
  return (
    <Layout>
      <PageHeader title={TYPES.PAGEMETA.TITLE} />
      <HomeView {...props} />
    </Layout>
  );
}
