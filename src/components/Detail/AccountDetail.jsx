import { useState } from 'react';
import { useQuery } from 'react-query';
import QRCode from 'react-qr-code';
import {
  Card,
  DetailHeader,
  DetailPage,
  Hash,
  SectionTitle,
  Stat,
  Stats,
  TechDetails,
  styles,
} from '.';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { fetchMarket } from 'utils/common/fetch';
import {
  formatAmount,
  formatDate,
  formatDateShort,
  formatInt,
  timeAgo,
} from 'utils/format';
import { describeContract, netForAddress } from 'utils/contracts';
import { isNum } from 'utils/converter';
import { CARD_TYPES } from 'types/ConstantsTypes';
import TYPES from 'types';

const pageSize = 20;

const KIND = {
  [CARD_TYPES.USER]: 'Account',
  [CARD_TYPES.TRUST]: 'Trust account (staking)',
  [CARD_TYPES.TOKEN]: 'Token',
  [CARD_TYPES.ASSET]: 'Register object',
};

//fields shown in the summary, the rest goes to "All fields"
const knownFields = [
  'owner',
  'version',
  'created',
  'modified',
  'type',
  'balance',
  'token',
  'ticker',
  'address',
  'total',
  'name',
  'stake',
  'trust',
  'age',
  'rate',
  'decimals',
  'currentsupply',
  'maxsupply',
];

function usd(value, price) {
  if (!isNum(value) || !isNum(price)) return null;
  return `${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value * price < 100 ? 2 : 0,
  }).format(value * price)}`;
}

function AccountTransactions({ type, address }) {
  const [page, setPage] = useState(0);
  const {
    network,
    getAccountTransactions,
    getTrustTransactions,
    getTokenTransactions,
  } = useNetwork();

  const load =
    type === CARD_TYPES.TRUST
      ? getTrustTransactions
      : type === CARD_TYPES.TOKEN
      ? getTokenTransactions
      : getAccountTransactions;

  const txRQ = useQuery(
    ['addressTransactions', network.name, type, address, page],
    () => load(address, page, pageSize),
    { keepPreviousData: true, retry: false, staleTime: 60000 }
  );

  const rows = txRQ.data?.result || [];
  const hasNext = rows.length === pageSize;

  return (
    <Card>
      <SectionTitle note={page > 0 ? `page ${page + 1}` : null}>
        Transactions
      </SectionTitle>
      {txRQ.isLoading && (
        <p className={styles.muted}>Loading transactions...</p>
      )}
      {txRQ.isError && (
        <p className={styles.muted}>Could not load the transactions.</p>
      )}
      {!txRQ.isLoading && !txRQ.isError && rows.length === 0 && (
        <p className={styles.muted}>No transactions.</p>
      )}
      {rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>What</th>
                <th className={styles.hideMobile}>Counterparty</th>
                <th className={styles.right}>Amount</th>
                <th className={styles.hideMobile}>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const { net, ticker, counterparties } = netForAddress(
                  tx,
                  address
                );
                const labels = [
                  ...new Set(
                    (tx.contracts || []).map((c) => describeContract(c).label)
                  ),
                ].join(', ');
                const sign = net > 0 ? '+' : net < 0 ? '-' : '';
                return (
                  <tr key={tx.txid}>
                    <td
                      title={formatDate(tx.timestamp)}
                      style={{ whiteSpace: 'nowrap' }}>
                      {formatDateShort(tx.timestamp)}
                      <div className={styles.muted}>
                        {timeAgo(tx.timestamp)}
                      </div>
                    </td>
                    <td>{labels}</td>
                    <td className={styles.hideMobile}>
                      {counterparties.length === 0 && (
                        <span className={styles.muted}>-</span>
                      )}
                      {counterparties.slice(0, 2).map((c) => (
                        <div key={c}>
                          <Hash value={c} href={`/scan/${c}`} keep={6} />
                        </div>
                      ))}
                      {counterparties.length > 2 && (
                        <span className={styles.muted}>
                          +{counterparties.length - 2} more
                        </span>
                      )}
                    </td>
                    <td className={styles.right}>
                      <span
                        className={styles.flowAmount}
                        data-sign={sign}
                        style={{ fontWeight: 600 }}>
                        {net !== 0
                          ? `${sign}${formatAmount(Math.abs(net))} ${ticker}`
                          : '-'}
                      </span>
                    </td>
                    <td className={styles.hideMobile}>
                      <Hash
                        value={tx.txid}
                        href={`/scan/${tx.txid}`}
                        keep={6}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {(page > 0 || hasNext) && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.navButton}
            aria-disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Newer
          </button>
          <span className={styles.muted}>Page {page + 1}</span>
          <button
            type="button"
            className={styles.navButton}
            aria-disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}>
            Older
          </button>
        </div>
      )}
    </Card>
  );
}

export default function AccountDetail({ type, data }) {
  const marketRQ = useQuery(['market'], fetchMarket, { retry: false });
  const price = marketRQ.data?.data?.market_data?.current_price?.usd;
  const isNxs = data.token === '0' || data.ticker === 'NXS';
  const ticker = data.ticker || (isNxs ? 'NXS' : '');

  //names and namespaces are registers too, but hold no balance or transfers
  const isName = data.type === 'NAME';
  const isNamespace = data.type === 'NAMESPACE';
  const hasBalance = isNum(Number(data.balance)) && data.balance !== undefined;
  const hasTransfers =
    !isName && !isNamespace && (type !== CARD_TYPES.ASSET || hasBalance);
  const kind = isName
    ? data.global
      ? 'Global name'
      : 'Name'
    : isNamespace
    ? 'Namespace'
    : KIND[type] || 'Address';

  const title = isNamespace
    ? data.namespace
    : type === CARD_TYPES.TOKEN
    ? data.ticker || 'Token'
    : data.name
    ? data.name
    : `${ticker} ${type === CARD_TYPES.TRUST ? 'trust account' : 'account'}`;

  const extra = Object.entries(data).filter(
    ([k, v]) => !knownFields.includes(k) && typeof v !== 'object'
  );

  const dailyReward =
    type === CARD_TYPES.TRUST && isNum(data.stake) && isNum(data.rate)
      ? (data.stake * data.rate) / 100 / 365
      : null;

  return (
    <DetailPage>
      <DetailHeader
        kind={kind}
        title={title}
        subtitle={<Hash value={data.address} full />}
        badges={[
          ticker && { text: ticker, tone: 'accent' },
          data.modified && {
            text: `last active ${timeAgo(data.modified)}`,
          },
        ]}
        actions={
          data.address && (
            <div className={styles.qr} title="Address QR code">
              <QRCode
                value={data.address}
                size={84}
                level="L"
                fgColor={TYPES.COLORS.NEXUS_BLUE}
              />
            </div>
          )
        }
      />

      <Card>
        <Stats>
          {type === CARD_TYPES.TOKEN ? (
            <>
              <Stat
                label="Current supply"
                value={`${formatAmount(data.currentsupply)} ${ticker}`}
                big
              />
              <Stat
                label="Max supply"
                value={`${formatAmount(data.maxsupply)} ${ticker}`}
              />
              <Stat label="Decimals" value={data.decimals} />
              <Stat
                label="Held by creator"
                value={`${formatAmount(data.balance, 2)} ${ticker}`}
              />
            </>
          ) : (
            <>
              {isName && (
                <Stat
                  label="Points to"
                  value={
                    <Hash
                      value={data.register}
                      href={`/scan/${data.register}`}
                    />
                  }
                  note="The register this name stands for"
                />
              )}
              {hasBalance && (
                <Stat
                  label={
                    type === CARD_TYPES.TRUST ? 'Available balance' : 'Balance'
                  }
                  value={`${formatAmount(data.balance, 2)} ${ticker}`}
                  note={isNxs ? usd(data.balance, price) : null}
                  big
                />
              )}
              {type === CARD_TYPES.TRUST && (
                <>
                  <Stat
                    label="Staked"
                    value={`${formatAmount(data.stake, 2)} ${ticker}`}
                    note={usd(data.stake, price)}
                    big
                  />
                  <Stat
                    label="Stake rate"
                    value={`${formatAmount(data.rate, 2)} %`}
                  />
                  <Stat
                    label="Estimated reward"
                    value={
                      dailyReward != null
                        ? `${formatAmount(dailyReward, 2)} ${ticker} / day`
                        : '-'
                    }
                  />
                  <Stat label="Trust score" value={formatInt(data.trust)} />
                  <Stat label="Staking for" value={data.age || '-'} />
                </>
              )}
              {isNum(data.total) &&
                data.total !== data.balance &&
                type !== CARD_TYPES.TRUST && (
                  <Stat
                    label="Total"
                    value={`${formatAmount(data.total)} ${ticker}`}
                  />
                )}
              {!isNxs && data.token && (
                <Stat
                  label="Token"
                  value={
                    <Hash value={data.token} href={`/scan/${data.token}`} />
                  }
                />
              )}
            </>
          )}
          <Stat
            label="Created"
            value={formatDateShort(data.created)}
            note={`UTC, ${timeAgo(data.created)}`}
          />
          <Stat
            label="Last change"
            value={formatDateShort(data.modified)}
            note={`UTC, ${timeAgo(data.modified)}`}
          />
          <Stat label="Owner" value={<Hash value={data.owner} keep={6} />} />
        </Stats>
      </Card>

      {hasTransfers && (
        <AccountTransactions type={type} address={data.address} />
      )}

      <TechDetails
        title="All fields"
        rows={[
          ['Address', data.address],
          ['Owner (signature chain)', data.owner],
          ['Type', data.type],
          ['Version', data.version],
          ['Created (unix)', data.created],
          ['Modified (unix)', data.modified],
          ...extra.map(([k, v]) => [k, String(v)]),
        ]}
      />
    </DetailPage>
  );
}
