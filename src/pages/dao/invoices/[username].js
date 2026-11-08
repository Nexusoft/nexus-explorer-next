import Layout from 'components/Layout';
import PageHeader from 'components/Header/PageHeader';
import TYPES from 'types';
import InvoicesView from 'components/Views/Dao/InvoiceTable';
import { useRouter } from 'next/router';
import React from 'react';

export default function Invoices() {
  const router = useRouter();
  const { username } = router.query;

  return (
    <Layout>
      <PageHeader
        title={
          username ? TYPES.PAGEMETA.DAO.INVOICES.TITLE(username) : undefined
        }
        description={TYPES.PAGEMETA.DAO.INVOICES.DESCRIPTION}
      />
      <InvoicesView username={username} />
    </Layout>
  );
}
