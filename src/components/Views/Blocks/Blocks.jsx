import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks';
import { Card, ChannelTag, SectionTitle, styles } from 'components/Detail';
import ListPager from 'components/Detail/ListPager';
import {
  formatAmount,
  formatBytes,
  formatDate,
  formatInt,
  timeAgo,
} from 'utils/format';

export default function Blocks() {
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(0);
  const [highlight, setHighlight] = useState(null);
  const { network, getBlocks, getInfo } = useNetwork();

  useEffect(() => {
    setPage(0);
    setHighlight(null);
  }, [network.name]);

  const blocksRQ = useQuery(
    ['blocks', pageSize, page, network.name],
    getBlocks,
    {
      keepPreviousData: true,
      refetchInterval: page === 0 ? 30000 : false,
    }
  );
  const infoRQ = useQuery(['info', network.name], getInfo);
  const tip = infoRQ.data?.data?.result?.blocks;

  const rows = blocksRQ.data || [];
  const first = rows[0]?.height;
  const last = rows[rows.length - 1]?.height;

  const jump = (height) => {
    if (!tip) return;
    const h = Math.min(height, tip);
    setHighlight(h);
    setPage(Math.floor((tip - h) / pageSize));
  };

  return (
    <Card>
      <SectionTitle note={tip ? `latest is ${formatInt(tip)}` : null}>
        {first != null
          ? `Blocks ${formatInt(last)} to ${formatInt(first)}`
          : 'Blocks'}
      </SectionTitle>
      {blocksRQ.isLoading && <p className={styles.muted}>Loading blocks...</p>}
      {blocksRQ.isError && (
        <p className={styles.muted}>Could not load blocks from the node.</p>
      )}
      {rows.length > 0 && (
        <div
          className={styles.tableWrap}
          style={{
            opacity: blocksRQ.isFetching && blocksRQ.isPreviousData ? 0.5 : 1,
          }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Height</th>
                <th>Time</th>
                <th className={styles.hideMobile}>Channel</th>
                <th className={styles.right}>Reward</th>
                <th className={styles.right} title="Transactions">
                  <span className={styles.hideMobile}>Transactions</span>
                  <span className={styles.showMobile}>Txs</span>
                </th>
                <th className={`${styles.right} ${styles.hideMobile}`}>Size</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.height}
                  style={
                    b.height === highlight
                      ? { outline: '2px solid var(--c-focus)' }
                      : undefined
                  }>
                  <td>
                    <Link href={`/scan/${b.height}`}>
                      <a>{formatInt(b.height)}</a>
                    </Link>
                  </td>
                  <td
                    title={formatDate(b.timestamp)}
                    style={{ whiteSpace: 'nowrap' }}>
                    {timeAgo(b.timestamp)}
                    <div className={styles.muted}>
                      {formatDate(b.timestamp).slice(0, 16)}
                    </div>
                  </td>
                  <td className={styles.hideMobile}>
                    <ChannelTag channel={b.channel} />
                  </td>
                  <td className={styles.right} style={{ whiteSpace: 'nowrap' }}>
                    {formatAmount(b.mint, 2)} NXS
                  </td>
                  <td className={styles.right}>{b.tx?.length ?? 0}</td>
                  <td className={`${styles.right} ${styles.hideMobile}`}>
                    {formatBytes(b.size)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ListPager
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        hasOlder={last > 0}
        onJump={tip ? jump : undefined}
      />
    </Card>
  );
}
