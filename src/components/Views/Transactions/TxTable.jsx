import Link from 'next/link';
import { Hash, Party, styles } from 'components/Detail';
import { formatAmount, formatDate, formatInt, timeAgo } from 'utils/format';
import { describeContract, transactionHeadline } from 'utils/contracts';

/**
 * Transaction rows of the Transactions page
 * moved = optional NXS column (largest payments)
 */
export default function TxTable({ rows, faded, moved }) {
  return (
    <div className={styles.tableWrap} style={{ opacity: faded ? 0.5 : 1 }}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Time</th>
            <th>What happened</th>
            {moved && <th className={styles.right}>NXS moved</th>}
            <th className={styles.hideMobile}>From</th>
            <th className={styles.hideMobile}>To</th>
            <th className={styles.hideMobile}>Block</th>
            <th>Transaction</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => {
            const d = describeContract(tx.contracts?.[0]);
            const more = (tx.contracts?.length || 0) > 1;
            return (
              <tr key={tx.txid}>
                <td
                  title={formatDate(tx.timestamp)}
                  style={{ whiteSpace: 'nowrap' }}>
                  {timeAgo(tx.timestamp)}
                </td>
                <td>{transactionHeadline(tx, formatAmount)}</td>
                {moved && (
                  <td className={styles.right} style={{ whiteSpace: 'nowrap' }}>
                    {formatAmount(tx.moved)}
                  </td>
                )}
                <td className={styles.hideMobile}>
                  <Party party={d.from} />
                </td>
                <td className={styles.hideMobile}>
                  <Party party={d.to} />
                  {more && <div className={styles.muted}>and more</div>}
                </td>
                <td className={styles.hideMobile}>
                  <Link href={`/scan/${tx.height}`}>
                    <a>{formatInt(tx.height)}</a>
                  </Link>
                </td>
                <td>
                  <Hash value={tx.txid} href={`/scan/${tx.txid}`} keep={5} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
