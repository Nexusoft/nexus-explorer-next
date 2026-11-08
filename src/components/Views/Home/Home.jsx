import Link from 'next/link';
import { useQuery } from 'react-query';
import TYPES from 'types';
import { NETWORKS } from 'types/ConstantsTypes';
import { fetchMarket } from 'utils/common/fetch';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import WorldNodes from 'components/WorldNodes/WorldNodes';
import { Age, ChannelTag, Hash, styles as detail } from 'components/Detail';
import { abbreviateNumber, isNum } from 'utils/converter';
import { formatAmount, formatInt } from 'utils/format';
import { isRewardTx, transactionHeadline } from 'utils/contracts';
import ActivityChart from './ActivityChart';
import styles from './Home.module.scss';

const latestRows = 8;
//blocks the latest lists need, also what getStaticProps loads
export const homeBlockCount = latestRows * 2;
const BLOCK_POLLING_DELAY = 20 * 1000;

const nxs = (v, digits = 0) =>
  isNum(v) ? `${formatAmount(v, digits)} NXS` : '-';

function Panel({ title, action, children, className }) {
  return (
    <section className={`${styles.panel} ${className || ''}`}>
      {(title || action) && (
        <header className={styles.panelHead}>
          <h2>{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function ViewAll({ href, children }) {
  return (
    <Link href={href}>
      <a className={styles.viewAll}>{children}</a>
    </Link>
  );
}

function Figure({ label, value, note, href }) {
  const body = <span className={styles.figureValue}>{value ?? '-'}</span>;
  return (
    <div className={styles.figure}>
      <span className={styles.figureLabel}>{label}</span>
      {href ? (
        <Link href={href}>
          <a>{body}</a>
        </Link>
      ) : (
        body
      )}
      {note && <span className={styles.figureNote}>{note}</span>}
    </div>
  );
}

function Channel({ channel, rate, rateUnit, rows }) {
  return (
    <div className={styles.channel} data-channel={channel}>
      <ChannelTag channel={channel} />
      <div className={styles.channelRate}>
        {rate}
        {rateUnit && <span>{rateUnit}</span>}
      </div>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Home(props) {
  const { network, getMetrics, getInfo, getMining, getRecentBlocks } =
    useNetwork();
  const isMainnet = network.name === NETWORKS.MAINNET.name;

  const metricsRQ = useQuery(['metrics', network.name], getMetrics, {
    initialData: props.metrics || undefined,
    refetchInterval: TYPES.REFETCH_INTERVALS.METRICS,
  });
  const infoRQ = useQuery(['info', network.name], getInfo, {
    initialData: props.info || undefined,
    refetchInterval: TYPES.REFETCH_INTERVALS.INFO,
  });
  const marketRQ = useQuery('market', fetchMarket, {
    initialData: props.market || undefined,
    refetchInterval: TYPES.REFETCH_INTERVALS.MARKET,
    enabled: isMainnet,
  });
  const miningRQ = useQuery(['mining', network.name], getMining, {
    initialData: props.mining || undefined,
    refetchInterval: TYPES.REFETCH_INTERVALS.MINING,
  });
  const blocksRQ = useQuery(
    ['homeBlocks', network.name],
    () => getRecentBlocks(homeBlockCount),
    {
      initialData: isMainnet && props.blocks ? props.blocks : undefined,
      refetchInterval: BLOCK_POLLING_DELAY,
    }
  );

  const info = infoRQ.data?.data?.result;
  const mining = miningRQ.data?.data?.result;
  const metrics = metricsRQ.data?.data?.result;
  const market = marketRQ.data?.data?.market_data;
  const blocks = blocksRQ.data || [];

  const price = market?.current_price?.usd;
  const change = market?.price_change_percentage_24h;
  const supply = mining?.supply?.total;
  const marketCap = isNum(market?.market_cap?.usd)
    ? market.market_cap.usd
    : isNum(price) && isNum(supply)
    ? price * supply
    : null;
  const height = info?.blocks ?? blocks[0]?.height;

  const txs = [];
  for (const b of blocks) {
    for (const tx of b.tx || []) {
      txs.push({
        ...tx,
        height: b.height,
        timestamp: tx.timestamp ?? b.timestamp,
      });
    }
  }

  return (
    <div className={styles.home}>
      <section className={styles.summary} aria-label="Network summary">
        <Figure
          label="Block height"
          value={formatInt(height)}
          href={height ? `/scan/${height}` : undefined}
          note={
            blocks[0] ? (
              <>
                last block <Age ts={blocks[0].timestamp} />
              </>
            ) : null
          }
        />
        <Figure
          label="Total supply"
          value={nxs(supply)}
          note={
            isNum(mining?.supply?.inflation)
              ? `${mining.supply.inflation.toFixed(2)} % yearly inflation`
              : null
          }
        />
        {isMainnet && (
          <Figure
            label="NXS price"
            value={isNum(price) ? `$${price.toFixed(4)}` : '-'}
            note={
              isNum(change) ? (
                <span className={change >= 0 ? styles.up : styles.down}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)} % in 24h
                </span>
              ) : null
            }
          />
        )}
        {isMainnet && (
          <Figure
            label="Market cap"
            value={isNum(marketCap) ? `$${formatAmount(marketCap, 0)}` : '-'}
            note={
              isNum(market?.total_volume?.usd)
                ? `$${formatAmount(market.total_volume.usd, 0)} volume 24h`
                : null
            }
          />
        )}
        <Figure
          label="Signature chains"
          value={formatInt(metrics?.sigchains)}
          note="user profiles on chain"
        />
      </section>

      <Panel title="Block channels" className={styles.channelsPanel}>
        <p className={styles.panelIntro}>
          Nexus produces blocks on three channels: staking and two kinds of
          mining, each with its own difficulty.
        </p>
        <div className={styles.channels}>
          <Channel
            channel={0}
            rate={nxs(metrics?.trust?.stake)}
            rateUnit="staked"
            rows={[
              ['Stakers', formatInt(metrics?.trust?.total)],
              [
                'Difficulty',
                isNum(mining?.stake?.difficulty)
                  ? mining.stake.difficulty.toFixed(4)
                  : '-',
              ],
              ['Channel height', formatInt(mining?.stake?.height)],
            ]}
          />
          <Channel
            channel={1}
            rate={abbreviateNumber(mining?.prime?.primes)}
            rateUnit="primes / s"
            rows={[
              ['Reward per block', nxs(mining?.prime?.reward, 4)],
              [
                'Difficulty',
                isNum(mining?.prime?.difficulty)
                  ? mining.prime.difficulty.toFixed(2)
                  : '-',
              ],
              ['Reserve', nxs(mining?.prime?.reserve, 2)],
            ]}
          />
          <Channel
            channel={2}
            rate={abbreviateNumber(mining?.hash?.hashes)}
            rateUnit="hashes / s"
            rows={[
              ['Reward per block', nxs(mining?.hash?.reward, 4)],
              [
                'Difficulty',
                isNum(mining?.hash?.difficulty)
                  ? mining.hash.difficulty.toFixed(2)
                  : '-',
              ],
              ['Reserve', nxs(mining?.hash?.reserve, 2)],
            ]}
          />
        </div>
      </Panel>

      <div className={styles.latest}>
        <Panel
          title="Latest blocks"
          action={<ViewAll href="/blocks">All blocks</ViewAll>}>
          <div className={detail.tableWrap}>
            <table className={detail.table}>
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Channel</th>
                  <th>Age</th>
                  <th className={`${detail.right} ${styles.hideSmall}`}>Txs</th>
                  <th className={detail.right}>Reward</th>
                </tr>
              </thead>
              <tbody>
                {blocks.slice(0, latestRows).map((b) => (
                  <tr key={b.height}>
                    <td>
                      <Link href={`/scan/${b.height}`}>
                        <a>{formatInt(b.height)}</a>
                      </Link>
                    </td>
                    <td>
                      <ChannelTag channel={b.channel} />
                    </td>
                    <td className={styles.age}>
                      <Age ts={b.timestamp} />
                    </td>
                    <td className={`${detail.right} ${styles.hideSmall}`}>
                      {b.tx?.length ?? 0}
                    </td>
                    <td className={detail.right}>{nxs(b.mint, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {blocksRQ.isError && !blocks.length && (
            <p className={detail.muted}>Could not load blocks from the node.</p>
          )}
        </Panel>

        <Panel
          title="Latest transactions"
          action={<ViewAll href="/transactions">All transactions</ViewAll>}>
          <div className={detail.tableWrap}>
            <table className={detail.table}>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>What happened</th>
                  <th className={styles.hideSmall}>Age</th>
                </tr>
              </thead>
              <tbody>
                {txs.slice(0, latestRows).map((tx) => (
                  <tr key={tx.txid}>
                    <td>
                      <Hash
                        value={tx.txid}
                        href={`/scan/${tx.txid}`}
                        keep={6}
                      />
                    </td>
                    <td className={isRewardTx(tx) ? styles.reward : undefined}>
                      {transactionHeadline(tx, (v) => formatAmount(v, 2))}
                    </td>
                    <td className={`${styles.age} ${styles.hideSmall}`}>
                      <Age ts={tx.timestamp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Activity">
        <ActivityChart initialBlocks={isMainnet ? props.blocks : null} />
      </Panel>

      <Panel title="Network nodes">
        <WorldNodes />
      </Panel>
    </div>
  );
}
