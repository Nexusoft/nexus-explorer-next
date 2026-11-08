import Link from 'next/link';
import {
  Card,
  DetailHeader,
  DetailPage,
  Hash,
  NavButton,
  SectionTitle,
  Stat,
  Stats,
  TechDetails,
  styles,
} from '.';
import { StringsTypes } from 'types/StringsTypes';
import {
  formatAmount,
  formatBytes,
  formatDate,
  formatInt,
  timeAgo,
} from 'utils/format';
import { toTitleCase } from 'utils/converter';
import { transactionHeadline } from 'utils/contracts';

export const channelName = (channel) =>
  StringsTypes.CHANNELS[channel] || `Channel ${channel}`;

export default function BlockDetail({ block }) {
  const txs = block.tx || [];
  const confirmations = txs[0]?.confirmations;
  const height = block.height;

  return (
    <DetailPage>
      <DetailHeader
        kind="Block"
        title={`#${formatInt(height)}`}
        subtitle={`${formatDate(block.timestamp)} (${timeAgo(
          block.timestamp
        )})`}
        badges={[
          { text: `${channelName(block.channel)} block`, tone: 'accent' },
          confirmations != null && {
            text: `${formatInt(confirmations)} confirmations`,
            tone: 'good',
          },
        ]}
        actions={
          <>
            <NavButton
              href={height > 0 ? `/scan/${height - 1}` : null}
              title="Previous block">
              Previous
            </NavButton>
            <NavButton
              href={block.nextblockhash ? `/scan/${height + 1}` : null}
              title={block.nextblockhash ? 'Next block' : 'Latest block'}>
              Next
            </NavButton>
          </>
        }
      />

      <Card>
        <Stats>
          <Stat
            label="Reward"
            value={`${formatAmount(block.mint)} NXS`}
            note={`minted by ${channelName(block.channel).toLowerCase()}`}
            big
          />
          <Stat label="Transactions" value={formatInt(txs.length)} big />
          <Stat label="Difficulty" value={formatAmount(block.difficulty, 4)} />
          <Stat label="Size" value={formatBytes(block.size)} />
          <Stat label="Time" value={formatDate(block.timestamp)} />
        </Stats>
      </Card>

      <Card>
        <SectionTitle note={`${txs.length}`}>Transactions</SectionTitle>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>What happened</th>
                <th className={styles.hideMobile}>Type</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((tx) => (
                <tr key={tx.txid}>
                  <td>
                    <Hash value={tx.txid} href={`/scan/${tx.txid}`} keep={6} />
                  </td>
                  <td>{transactionHeadline(tx, formatAmount)}</td>
                  <td className={styles.hideMobile}>
                    {toTitleCase(tx.type || '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <TechDetails
        rows={[
          ['Block hash', <Hash key="h" value={block.hash} full />],
          [
            'Previous block',
            <Hash
              key="p"
              value={block.previousblockhash}
              href={height > 0 ? `/scan/${height - 1}` : undefined}
              full
            />,
          ],
          block.nextblockhash && [
            'Next block',
            <Hash
              key="n"
              value={block.nextblockhash}
              href={`/scan/${height + 1}`}
              full
            />,
          ],
          ['Merkle root', <Hash key="m" value={block.merkleroot} full />],
          ['Proof hash', <Hash key="ph" value={block.proofhash} full />],
          ['Channel', `${block.channel} (${channelName(block.channel)})`],
          ['Nonce', block.nonce],
          ['Bits', block.bits],
          ['Version', block.version],
          ['Unix time', block.timestamp],
        ].filter(Boolean)}
      />
      <p className={styles.muted}>
        <Link href="/blocks">
          <a>All blocks</a>
        </Link>
      </p>
    </DetailPage>
  );
}
