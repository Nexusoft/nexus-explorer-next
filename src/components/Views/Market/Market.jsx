import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import {
  Age,
  Card,
  Hash,
  SectionTitle,
  Stat,
  Stats,
  styles,
} from 'components/Detail';
import Loader from 'components/common/NE_Loader';
import ErrorMessage from 'components/common/NE_ErrorMessage';
import { marketView } from 'utils/market';
import { formatAmount } from 'utils/format';
import { cls } from 'utils';
import ms from './Market.module.scss';

const filledPreview = 25;

const price = (v) => (v == null ? '-' : formatAmount(v, v < 1 ? 8 : 4));

function OrderTable({ rows, ticker, empty, showSide = false }) {
  if (!rows.length) return <p className={styles.muted}>{empty}</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {showSide && <th>Side</th>}
            <th className={styles.right}>Price (NXS)</th>
            <th className={styles.right}>Amount ({ticker})</th>
            <th className={cls(styles.right, styles.hideMobile)}>
              Total (NXS)
            </th>
            <th className={styles.hideMobile}>Placed</th>
            <th>Transaction</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.txid}>
              {showSide && (
                <td className={o.side === 'buy' ? ms.buy : ms.sell}>
                  {o.side === 'buy' ? 'Buy' : 'Sell'}
                </td>
              )}
              <td className={styles.right}>{price(o.price)}</td>
              <td className={styles.right}>{formatAmount(o.amount)}</td>
              <td className={cls(styles.right, styles.hideMobile)}>
                {formatAmount(o.total)}
              </td>
              <td className={styles.hideMobile}>
                <Age ts={o.timestamp} />
              </td>
              <td>
                <Hash value={o.txid} href={`/scan/${o.txid}`} keep={6} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PairDetail({ m }) {
  const [allFilled, setAllFilled] = useState(false);
  const filled = allFilled ? m.filled : m.filled.slice(0, filledPreview);

  return (
    <>
      <Card>
        <SectionTitle
          note={
            m.token ? (
              <Link href={`/scan/${m.token}`}>
                <a>{m.ticker} token</a>
              </Link>
            ) : null
          }>
          {m.pair}
        </SectionTitle>
        <Stats>
          <Stat
            label="Highest buy order"
            value={m.bestBuy == null ? '-' : `${price(m.bestBuy)} NXS`}
            note={`per ${m.ticker}`}
          />
          <Stat
            label="Lowest sell order"
            value={m.bestSell == null ? '-' : `${price(m.bestSell)} NXS`}
            note={`per ${m.ticker}`}
          />
          <Stat
            label="Last filled order"
            value={m.last ? `${price(m.last.price)} NXS` : '-'}
            note={m.last ? <Age ts={m.last.timestamp} /> : 'none yet'}
          />
        </Stats>
      </Card>

      <div className={ms.book}>
        <Card>
          <SectionTitle note={m.sells.length}>
            Sell orders, lowest price first
          </SectionTitle>
          <OrderTable
            rows={m.sells}
            ticker={m.ticker}
            empty={`Nobody is selling ${m.ticker} right now.`}
          />
        </Card>
        <Card>
          <SectionTitle note={m.buys.length}>
            Buy orders, highest price first
          </SectionTitle>
          <OrderTable
            rows={m.buys}
            ticker={m.ticker}
            empty={`Nobody is buying ${m.ticker} right now.`}
          />
        </Card>
      </div>

      <Card>
        <SectionTitle note={m.filled.length}>Filled orders</SectionTitle>
        <OrderTable
          rows={filled}
          ticker={m.ticker}
          empty="No order has been filled on this market yet."
          showSide
        />
        {m.filled.length > filledPreview && (
          <button
            type="button"
            className={ms.more}
            onClick={() => setAllFilled((v) => !v)}>
            {allFilled ? 'Show fewer' : `Show all ${m.filled.length}`}
          </button>
        )}
        <p className={styles.muted}>
          Placed is when the order was created; the node does not report when it
          was filled.
        </p>
      </Card>
    </>
  );
}

export default function Market() {
  const router = useRouter();
  const { network, getMarkets } = useNetwork();
  const { isLoading, data, error } = useQuery(
    ['markets', network.name],
    getMarkets,
    { staleTime: 60 * 1000 }
  );

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) {
    return (
      <Card>
        <p className={styles.muted}>
          Market data comes from the explorer index, which is not available on
          this network.
        </p>
      </Card>
    );
  }

  const markets = data
    .map(marketView)
    .sort(
      (a, b) =>
        b.filled.length - a.filled.length ||
        b.buys.length + b.sells.length - (a.buys.length + a.sells.length)
    );
  if (!markets.length) {
    return (
      <Card>
        <p className={styles.muted}>No open or filled orders on any market.</p>
      </Card>
    );
  }
  const selected =
    markets.find((m) => m.ticker === router.query.pair) || markets[0];

  return (
    <>
      <Card>
        <SectionTitle note={markets.length}>Markets</SectionTitle>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pair</th>
                <th className={styles.right}>Highest buy</th>
                <th className={styles.right}>Lowest sell</th>
                <th className={cls(styles.right, styles.hideMobile)}>
                  Last filled
                </th>
                <th className={cls(styles.right, styles.hideMobile)}>
                  Open orders
                </th>
                <th className={cls(styles.right, styles.hideMobile)}>Filled</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => (
                <tr key={m.pair} className={cls(m === selected && ms.selected)}>
                  <td>
                    <Link
                      href={{ pathname: '/market', query: { pair: m.ticker } }}
                      shallow
                      scroll={false}>
                      <a aria-current={m === selected ? 'true' : undefined}>
                        {m.pair}
                      </a>
                    </Link>
                  </td>
                  <td className={styles.right}>{price(m.bestBuy)}</td>
                  <td className={styles.right}>{price(m.bestSell)}</td>
                  <td className={cls(styles.right, styles.hideMobile)}>
                    {m.last ? price(m.last.price) : '-'}
                  </td>
                  <td className={cls(styles.right, styles.hideMobile)}>
                    {m.buys.length + m.sells.length}
                  </td>
                  <td className={cls(styles.right, styles.hideMobile)}>
                    {m.filled.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.muted}>
          Prices in NXS per token. Only pairs against NXS are listed; the index
          refreshes them every 10 minutes.
        </p>
      </Card>
      <PairDetail key={selected.pair} m={selected} />
    </>
  );
}
