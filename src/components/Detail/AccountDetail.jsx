import { useState } from 'react';
import { useQuery } from 'react-query';
import QRCode from 'react-qr-code';
import {
  Card,
  DetailHeader,
  DetailPage,
  Hash,
  OwnerHash,
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
import { ASSET_FORMATS, assetFormat, isAsset } from 'utils/assets';
import TokenHolders from './TokenHolders';
import RegisterHistory from './RegisterHistory';
import Link from 'next/link';
import { ownerInfo, registerIdFromAddress } from 'utils/address';
import { userHref } from 'utils/search';
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

const assetJson = (data) =>
  data.json && typeof data.json === 'object' && !Array.isArray(data.json)
    ? data.json
    : {};

function assetTitle(data) {
  const t =
    data.title ||
    assetJson(data).title ||
    assetJson(data).name ||
    data.question;
  return typeof t === 'string' && t ? t : data.name || 'Asset';
}

//same rule as the indexer's asset list
function assetKind(data) {
  //an object's own "type" field hides the register type
  const ownType = ASSET_FORMATS[data.type] ? null : data.type;
  const k =
    data['distordia-type'] ||
    assetJson(data).type ||
    ownType ||
    (data.bounty_id ? 'bounty' : null);
  return typeof k === 'string' ? k : null;
}

const isUrl = (v) => typeof v === 'string' && /^https?:\/\/\S+$/i.test(v);

function FieldValue({ value }) {
  if (value !== null && typeof value === 'object') {
    return <pre className={styles.json}>{JSON.stringify(value, null, 2)}</pre>;
  }
  if (isUrl(value)) {
    return (
      <a href={value} target="_blank" rel="nofollow noopener noreferrer ugc">
        {value}
      </a>
    );
  }
  return String(value);
}

/** What the owner stored in an asset: its own fields, or the json of a raw / read-only one */
function AssetContent({ data, fields }) {
  const json = data.json;
  const rows = json === assetJson(data) ? Object.entries(json) : fields;
  return (
    <Card>
      <SectionTitle note={assetFormat(data)}>Content</SectionTitle>
      {json !== undefined && rows === fields ? (
        <FieldValue value={json} />
      ) : rows.length === 0 ? (
        <p className={styles.muted}>This asset holds no fields.</p>
      ) : (
        <dl className={styles.kv}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{k}</dt>
              <dd>
                <FieldValue value={v} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className={styles.muted}>
        Written by the owner; the explorer shows it as stored and does not check
        it.
      </p>
    </Card>
  );
}

/** Registers handed to this token by tokenizing, from the owner index */
function TokenizedAssets({ token }) {
  const { network, getOwner } = useNetwork();
  const id = registerIdFromAddress(token);
  const ownedRQ = useQuery(['owner', network.name, id], () => getOwner(id), {
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const regs = ownedRQ.data?.registers || [];
  if (!regs.length) return null;
  return (
    <Card>
      <SectionTitle note={formatInt(regs.length)}>
        Tokenized assets
      </SectionTitle>
      <p className={styles.muted}>
        Owned by this token, so its holders own them together.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Register</th>
              <th>Kind</th>
              <th className={styles.hideMobile}>Last change</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.address}>
                <td style={{ overflowWrap: 'anywhere' }}>
                  {r.name ? (
                    <Link href={`/scan/${r.address}`}>
                      <a>{r.name}</a>
                    </Link>
                  ) : (
                    <Hash
                      value={r.address}
                      href={`/scan/${r.address}`}
                      keep={6}
                    />
                  )}
                </td>
                <td>{r.info?.kind || r.kind}</td>
                <td className={styles.hideMobile}>{timeAgo(r.modified)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

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

export default function AccountDetail({ type, data, username }) {
  const marketRQ = useQuery(['market'], fetchMarket, { retry: false });
  const price = marketRQ.data?.data?.market_data?.current_price?.usd;
  const isNxs = data.token === '0' || data.ticker === 'NXS';
  const ticker = data.ticker || (isNxs ? 'NXS' : '');

  //names and namespaces are registers too, but hold no balance or transfers
  const isName = data.type === 'NAME';
  const isNamespace = data.type === 'NAMESPACE';
  const isCrypto = data.type === 'CRYPTO';
  const hasBalance = isNum(Number(data.balance)) && data.balance !== undefined;
  const hasTransfers =
    !isName && !isNamespace && (type !== CARD_TYPES.ASSET || hasBalance);
  const asset = type === CARD_TYPES.ASSET && isAsset(data);
  const kind = isName
    ? data.global
      ? 'Global name'
      : 'Name'
    : isNamespace
    ? 'Namespace'
    : isCrypto
    ? 'Crypto register'
    : asset
    ? data.form === 'SUPPLY'
      ? 'Supply item'
      : 'Asset'
    : KIND[type] || 'Address';

  //account names like "default" or "trust" are labels inside a profile, not titles
  const isAccount = type === CARD_TYPES.USER || type === CARD_TYPES.TRUST;
  const title = isNamespace
    ? data.namespace
    : type === CARD_TYPES.TOKEN
    ? data.ticker || 'Token'
    : isAccount
    ? `${ticker} ${type === CARD_TYPES.TRUST ? 'trust account' : 'account'}`
    : asset
    ? assetTitle(data)
    : isCrypto
    ? 'Key hashes'
    : data.name || 'Register';

  //an asset's own fields go to its Content card, objects included
  const extra = Object.entries(data).filter(
    ([k, v]) =>
      !knownFields.includes(k) &&
      k !== 'form' &&
      (asset || typeof v !== 'object')
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
          isAccount && data.name && { text: `name: ${data.name}` },
          asset &&
            data.name &&
            data.name !== title && { text: `name: ${data.name}` },
          asset && assetKind(data) && { text: assetKind(data), tone: 'accent' },
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
          <Stat
            label="Owner"
            value={
              username && ownerInfo(data.owner).kind === 'genesis' ? (
                <Link href={userHref({ username, genesis: data.owner })}>
                  <a>{username}</a>
                </Link>
              ) : (
                <OwnerHash owner={data.owner} />
              )
            }
            note={
              ownerInfo(data.owner).what === 'token'
                ? "Tokenized: the token's holders own it together"
                : null
            }
          />
        </Stats>
      </Card>

      {asset && (
        <AssetContent
          data={data}
          fields={extra.filter(([k]) => k !== 'json')}
        />
      )}

      {type === CARD_TYPES.TOKEN && <TokenHolders token={data} />}

      {type === CARD_TYPES.TOKEN && <TokenizedAssets token={data.address} />}

      {(type === CARD_TYPES.TOKEN || type === CARD_TYPES.ASSET) &&
        data.address && <RegisterHistory address={data.address} />}

      {hasTransfers && (
        <AccountTransactions type={type} address={data.address} />
      )}

      <TechDetails
        title="All fields"
        rows={[
          ['Address', data.address],
          ['Owner (signature chain)', data.owner],
          ['Form', data.form],
          ['Type', data.type],
          ['Version', data.version],
          ['Created (unix)', data.created],
          ['Modified (unix)', data.modified],
          ...(asset ? [] : extra.map(([k, v]) => [k, String(v)])),
        ]}
      />
    </DetailPage>
  );
}
