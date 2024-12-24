import PageHeader from 'components/Header/PageHeader';
import Layout from 'components/Layout';
import { DaoInfo } from 'components/Views/Dao';
import TYPES from 'types';
import daoObject from '../../../../public/embassy.json';

function EmbassyDAOPage() {
  return (
    <Layout>
      <PageHeader title={TYPES.PAGEMETA.DAO.EMBASSY.TITLE} />
      <DaoInfo title={'Embassy DAO'} daoObject={daoObject} />
    </Layout>
  );
}

export default EmbassyDAOPage;
