import { PageTitle } from 'components/Detail';
import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import Richlist from 'components/Views/Richlist';
import React from 'react';
import TYPES from 'types';

import { fetchRichlistForBuild } from 'utils/common/fetch';
export async function getStaticProps() {
  const resp = await fetchRichlistForBuild();
  return {
    props: {
      richlistData: resp || null,
    },
    revalidate: TYPES.REFETCH_INTERVALS.REGENERATE_SSG_INTERVAL,
  };
}

function index(props) {
  return (
    <Layout>
      <PageHeader page="Richlist" />
      <PageTitle title="Rich list">
        The largest NXS balances held in Tritium accounts and trust accounts.
      </PageTitle>
      <Richlist data={props.richlistData} />
    </Layout>
  );
}

export default index;
