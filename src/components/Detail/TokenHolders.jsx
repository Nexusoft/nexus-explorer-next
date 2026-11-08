import Link from 'next/link';
import { useQuery } from 'react-query';
import { Card, Hash, SectionTitle, Stat, Stats, styles } from '.';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { formatAmount, formatInt, timeAgo } from 'utils/format';
import { marketView } from 'utils/market';
import { cls } from 'utils';

const shareDigits = 2;

/** Holders of a token and its NXS market, both from the explorer index */
export default function TokenHolders({ token }) {
  const { network, getTokenHolders, getMarkets } = useNetwork();
  const holdersRQ = useQuery(['tokenholders', network.name], getTokenHolders, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const marketsRQ = useQuery(['markets', network.name], getMarkets, {
    staleTime: 60 * 1000,
    retry: false,
  });

  //no index on this network: the token page stays as it was
  if (!holdersRQ.data && !marketsRQ.data) return null;

  const holders = holdersRQ.data?.[token.address] || {
    accounts: 0,
    owners: 0,
    top: [],
  };
  const market = (marketsRQ.data || [])
    .map(marketView)
    .find((m) => m.token === token.address);
  const supply = Number(token.currentsupply) || 0;
  const ticker = token.ticker || '';

  return (
    <Card>
      <SectionTitle>Holders and market</SectionTitle>
      <Stats>
        {holdersRQ.data && (
          <>
            <Stat
              label="Holders"
              value={formatInt(holders.owners)}
              note="signature chains with a balance"
            />
            <Stat
              label="Accounts"
              value={formatInt(holders.accounts)}
              note="one holder can have several"
            />
          </>
        )}
        <Stat
          label="Market"
          value={
            market ? (
              <Link
                href={{ pathname: '/market', query: { pair: market.ticker } }}>
                <a>{market.pair}</a>
              </Link>
            ) : (
              '-'
            )
          }
          note={
            market
              ? `${market.buys.length + market.sells.length} open, ${
                  market.filled.length
                } filled orders`
              : 'no orders against NXS'
          }
        />
      </Stats>

      {holders.top.length > 0 && (
        <div className={styles.tableWrap} style={{ marginTop: '1rem' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.hideMobile}>#</th>
                <th>Account</th>
                <th className={styles.hideMobile}>Owner</th>
                <th className={styles.right}>Balance</th>
                <th className={cls(styles.right, styles.hideMobile)}>Share</th>
                <th className={styles.hideMobile}>Last change</th>
              </tr>
            </thead>
            <tbody>
              {holders.top.map((a, i) => (
                <tr key={a.address}>
                  <td className={styles.hideMobile}>{i + 1}</td>
                  <td>
                    <Hash
                      value={a.address}
                      href={`/scan/${a.address}`}
                      keep={6}
                    />
                  </td>
                  <td className={styles.hideMobile}>
                    <Hash value={a.owner} href={`/scan/${a.owner}`} keep={6} />
                  </td>
                  <td className={styles.right}>
                    {formatAmount(a.balance)} {ticker}
                  </td>
                  <td className={cls(styles.right, styles.hideMobile)}>
                    {supply > 0
                      ? `${formatAmount(
                          (a.balance / supply) * 100,
                          shareDigits
                        )} %`
                      : '-'}
                  </td>
                  <td className={styles.hideMobile}>{timeAgo(a.modified)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {holdersRQ.data && (
        <p className={styles.muted}>
          {holders.top.length < holders.accounts
            ? `The ${holders.top.length} largest of ${formatInt(
                holders.accounts
              )} accounts. `
            : ''}
          Share is of the current supply. Holders come from the explorer index
          and are refreshed once an hour.
        </p>
      )}
    </Card>
  );
}
