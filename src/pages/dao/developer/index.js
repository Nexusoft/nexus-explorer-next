import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import { DaoInfo } from 'components/Views/Dao';
import React from 'react';
import TYPES from 'types';
import daoObject from '../../../../public/developers.json';

function DevloperDAOPage() {
  return (
    <Layout>
      <PageHeader
        title={TYPES.PAGEMETA.DAO.DEVELOPER.TITLE}
        description={TYPES.PAGEMETA.DAO.DEVELOPER.DESCRIPTION}
      />
      <DaoInfo
        title={'Developer DAO'}
        description={TYPES.PAGEMETA.DAO.DEVELOPER.DESCRIPTION}
        daoObject={daoObject}
      />
    </Layout>
  );
}

export default DevloperDAOPage;
