import Link from 'next/link';
import { useQuery } from 'react-query';
import {
  Card,
  DetailHeader,
  DetailPage,
  FlowList,
  Hash,
  SectionTitle,
  Stat,
  Stats,
  TechDetails,
} from '.';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { formatAmount, formatDate, formatInt, timeAgo } from 'utils/format';
import { toTitleCase } from 'utils/converter';
import { transactionHeadline } from 'utils/contracts';

//mature after this many confirmations (coinbase/stake outputs)
const matureConfirmations = 120;

export default function TransactionDetail({ tx }) {
  const { network, getScanResults } = useNetwork();

  //transaction only carries the block hash, ask for the height
  const blockRQ = useQuery(
    ['blockOfTx', network.name, tx.blockhash],
    () =>
      getScanResults('ledger/get/block', {
        hash: tx.blockhash,
        verbose: 'summary',
      }),
    { enabled: !!tx.blockhash, staleTime: Infinity, retry: false }
  );
  const height = blockRQ.data?.result?.height;

  const conf = tx.confirmations;
  const status =
    conf == null
      ? null
      : conf === 0
      ? { text: 'Unconfirmed', tone: 'warn' }
      : conf < matureConfirmations
      ? { text: `${formatInt(conf)} confirmations`, tone: 'warn' }
      : { text: `Confirmed (${formatInt(conf)})`, tone: 'good' };

  return (
    <DetailPage>
      <DetailHeader
        kind="Transaction"
        title={transactionHeadline(tx, formatAmount)}
        subtitle={<Hash value={tx.txid} full />}
        badges={[
          status,
          tx.type && { text: toTitleCase(tx.type), tone: 'accent' },
        ]}
      />

      <Card>
        <Stats>
          <Stat
            label="Time"
            value={formatDate(tx.timestamp)}
            note={timeAgo(tx.timestamp)}
          />
          <Stat
            label="Block"
            value={
              height != null ? (
                <Link href={`/scan/${height}`}>
                  <a>#{formatInt(height)}</a>
                </Link>
              ) : (
                <Hash value={tx.blockhash} href={`/scan/${tx.blockhash}`} />
              )
            }
          />
          <Stat
            label="Confirmations"
            value={conf != null ? formatInt(conf) : '-'}
          />
          <Stat
            label="Contracts"
            value={formatInt(tx.contracts?.length || 0)}
          />
        </Stats>
      </Card>

      <Card>
        <SectionTitle>What happened</SectionTitle>
        <FlowList contracts={tx.contracts} />
      </Card>

      <TechDetails
        rows={[
          ['Transaction id', <Hash key="t" value={tx.txid} full />],
          [
            'Block hash',
            <Hash
              key="b"
              value={tx.blockhash}
              href={`/scan/${tx.blockhash}`}
              full
            />,
          ],
          ['Signature chain', <Hash key="g" value={tx.genesis} full />],
          ['Sequence', tx.sequence],
          [
            'Previous tx',
            tx.prevhash && (
              <Hash
                key="p"
                value={tx.prevhash}
                href={
                  /^[0-9a-f]{128}$/i.test(tx.prevhash)
                    ? `/scan/${tx.prevhash}`
                    : undefined
                }
                full
              />
            ),
          ],
          ['Next hash', tx.nexthash],
          ['Recovery hash', tx.recovery],
          ['Public key', tx.pubkey],
          ['Signature', tx.signature],
          ['Version', tx.version],
          ['Unix time', tx.timestamp],
        ]}
      />
    </DetailPage>
  );
}
