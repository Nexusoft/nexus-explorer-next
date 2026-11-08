import Link from 'next/link';
import React from 'react';
import { useQueries } from 'react-query';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import {
  Card,
  DetailPage,
  PageTitle,
  SectionTitle,
  styles,
} from 'components/Detail';
import { formatAmount } from 'utils/format';

function telegram(social) {
  return social?.startsWith('@') ? social.replace('@', 'https://t.me/') : null;
}

export const DaoInfo = ({ title, description, daoObject }) => {
  const { getAccount } = useNetwork();
  const entries = Object.entries(daoObject);

  const balances = useQueries(
    entries.map(([, v]) => ({
      queryKey: [v.auditBalance ?? v.audit, 'account'],
      queryFn: () => getAccount(v.auditBalance ?? v.audit),
      staleTime: 60 * 1000,
    }))
  );
  const total = balances.reduce(
    (sum, rq) => sum + (Number(rq.data?.balance) || 0),
    0
  );
  const loading = balances.some((rq) => rq.isLoading);

  return (
    <DetailPage>
      <PageTitle title={title}>{description}</PageTitle>
      <Card>
        <SectionTitle
          note={loading ? null : `${formatAmount(total, 2)} NXS in total`}>
          Accounts
        </SectionTitle>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Account</th>
                <th className={styles.hideMobile}>Funds</th>
                <th className={styles.right}>Balance</th>
                <th className={styles.hideMobile}>Chair</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, dao], i) => {
                const account = dao.auditBalance ?? dao.audit;
                const rq = balances[i];
                const link = telegram(dao.social);
                return (
                  <tr key={key}>
                    <td>
                      <Link href={`/scan/${encodeURIComponent(account)}`}>
                        <a>{account}</a>
                      </Link>
                    </td>
                    <td className={styles.hideMobile}>{dao.desc}</td>
                    <td
                      className={styles.right}
                      style={{ whiteSpace: 'nowrap' }}>
                      {rq.isLoading
                        ? '...'
                        : rq.isError
                        ? '-'
                        : `${formatAmount(rq.data?.balance, 2)} ${
                            rq.data?.ticker || 'NXS'
                          }`}
                    </td>
                    <td className={styles.hideMobile}>
                      {dao.chair || <span className={styles.muted}>-</span>}
                      {link && (
                        <div>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer">
                            {dao.social}
                          </a>
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link
                        href={`/dao/invoices/${encodeURIComponent(dao.audit)}`}>
                        <a>Invoices</a>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.muted}>
          Chairs and descriptions come from the explorer's own list and may be
          out of date; balances are live from the chain.
        </p>
      </Card>
    </DetailPage>
  );
};
