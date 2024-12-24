import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import { DaoInfo } from 'components/Views/Dao';
import React from 'react';
import TYPES from 'types';
import daoObject from '../../../../public/ambassadors.json';

function AmbassadorDAOPage() {
  return (
    <Layout>
      <PageHeader title={TYPES.PAGEMETA.DAO.AMBASSADOR.TITLE} />
      <DaoInfo title={'Ambassador DAO'} daoObject={daoObject} />
    </Layout>
  );
}

export default AmbassadorDAOPage;
