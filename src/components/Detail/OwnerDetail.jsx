import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Card,
  DetailHeader,
  DetailPage,
  Hash,
  SectionTitle,
  Stat,
  Stats,
  styles,
} from '.';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { formatAmount, formatInt, shortHash, timeAgo } from 'utils/format';
import { ASSET_FORMATS } from 'utils/assets';
import { cls } from 'utils';
import OwnerTransactions from './OwnerTransactions';

const preview = 10;

const isNxs = (r) => r.token === '0';

/** Card with a table that shows the first rows and a toggle for the rest */
function RegisterCard({ title, rows, head, row }) {
  const [all, setAll] = useState(false);
  if (!rows.length) return null;
  const shown = all ? rows : rows.slice(0, preview);
  return (
    <Card>
      <SectionTitle note={formatInt(rows.length)}>{title}</SectionTitle>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>{head}</tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.address}>{row(r)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > preview && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setAll((v) => !v)}>
            {all ? 'Show fewer' : `Show all ${formatInt(rows.length)}`}
          </button>
        </div>
      )}
    </Card>
  );
}

const nameCell = (r) =>
  r.name ? (
    <Link href={`/scan/${r.address}`}>
      <a>{r.name}</a>
    </Link>
  ) : (
    <Hash value={r.address} href={`/scan/${r.address}`} keep={6} />
  );

const changed = (r) => (
  <td className={styles.hideMobile} style={{ whiteSpace: 'nowrap' }}>
    {timeAgo(r.modified)}
  </td>
);

export default function OwnerDetail({ status }) {
  const genesis = status.genesis;
  const { network, getOwner } = useNetwork();
  const ownerRQ = useQuery(
    ['owner', network.name, genesis],
    () => getOwner(genesis),
    { staleTime: 5 * 60 * 1000, retry: false }
  );
  const index = ownerRQ.data;
  const regs = index?.registers || [];
  const of = (kind) => regs.filter((r) => r.kind === kind);

  const accounts = of('account');
  const trust = of('trust');
  const tokens = of('token');
  const assets = of('asset');
  const names = of('name');
  const namespaces = of('namespace');

  const nxs = [...accounts, ...trust]
    .filter(isNxs)
    .reduce((s, r) => s + (r.balance || 0), 0);
  const staked = trust.reduce((s, r) => s + (r.info?.stake || 0), 0);
  const heldTokens = new Set(
    accounts.filter((r) => !isNxs(r) && r.balance > 0).map((r) => r.token)
  ).size;

  return (
    <DetailPage>
      <DetailHeader
        kind="Signature chain"
        title={shortHash(genesis, 8)}
        subtitle={<Hash value={genesis} full />}
        badges={[
          { text: `${formatInt(status.transactions)} transactions` },
          status.recovery && { text: 'recovery set' },
          status.crypto && { text: 'crypto keys' },
        ]}
      />

      <Card>
        <Stats>
          <Stat
            label="Transactions"
            value={formatInt(status.transactions)}
            note="on this signature chain"
          />
          {index && (
            <>
              <Stat
                label="NXS balance"
                value={`${formatAmount(nxs, 2)} NXS`}
                note="accounts and trust, not staked"
                big
              />
              {trust.length > 0 && (
                <Stat label="Staked" value={`${formatAmount(staked, 2)} NXS`} />
              )}
              <Stat
                label="Accounts"
                value={formatInt(accounts.length + trust.length)}
              />
              <Stat label="Tokens held" value={formatInt(heldTokens)} />
              <Stat label="Assets" value={formatInt(assets.length)} />
              <Stat label="Names" value={formatInt(names.length)} />
            </>
          )}
        </Stats>
        <p className={styles.muted}>
          {ownerRQ.isLoading
            ? 'Loading what this signature chain owns...'
            : index
            ? `What it owns comes from the explorer index, refreshed once an hour${
                index.updated ? ` (last ${timeAgo(index.updated)})` : ''
              }.${
                index.total > regs.length
                  ? ` Showing ${formatInt(regs.length)} of ${formatInt(
                      index.total
                    )} registers.`
                  : ''
              }`
            : 'The explorer index is not available on this network, so the registers this signature chain owns cannot be listed.'}
        </p>
      </Card>

      <RegisterCard
        title="Accounts"
        rows={[...trust, ...accounts]}
        head={
          <>
            <th>Account</th>
            <th>Token</th>
            <th className={styles.right}>Balance</th>
            <th className={styles.hideMobile}>Last change</th>
          </>
        }
        row={(r) => (
          <>
            <td>
              {nameCell(r)}
              {r.kind === 'trust' && (
                <div className={styles.muted}>
                  trust, staked {formatAmount(r.info?.stake || 0, 2)} NXS
                </div>
              )}
            </td>
            <td>
              {isNxs(r) ? (
                'NXS'
              ) : (
                <Link href={`/scan/${r.token}`}>
                  <a>{r.ticker || shortHash(r.token, 6)}</a>
                </Link>
              )}
            </td>
            <td className={styles.right}>{formatAmount(r.balance || 0)}</td>
            {changed(r)}
          </>
        )}
      />

      {index && <OwnerTransactions key={genesis} genesis={genesis} />}

      <RegisterCard
        title="Tokens created"
        rows={tokens}
        head={
          <>
            <th>Token</th>
            <th className={styles.right}>Current supply</th>
            <th className={cls(styles.right, styles.hideMobile)}>Max supply</th>
            <th className={styles.hideMobile}>Last change</th>
          </>
        }
        row={(r) => (
          <>
            <td>{nameCell(r)}</td>
            <td className={styles.right}>
              {formatAmount(r.info?.currentsupply || 0)}
            </td>
            <td className={cls(styles.right, styles.hideMobile)}>
              {formatAmount(r.info?.maxsupply || 0)}
            </td>
            {changed(r)}
          </>
        )}
      />

      <RegisterCard
        title="Assets"
        rows={assets}
        head={
          <>
            <th>Asset</th>
            <th>Kind</th>
            <th className={styles.hideMobile}>Format</th>
            <th className={styles.hideMobile}>Last change</th>
          </>
        }
        row={(r) => (
          <>
            <td style={{ overflowWrap: 'anywhere' }}>{nameCell(r)}</td>
            <td>{r.info?.kind || <span className={styles.muted}>-</span>}</td>
            <td className={styles.hideMobile}>
              {ASSET_FORMATS[r.info?.format] || r.info?.format}
            </td>
            {changed(r)}
          </>
        )}
      />

      <RegisterCard
        title="Names"
        rows={names}
        head={
          <>
            <th>Name</th>
            <th>Points to</th>
            <th className={styles.hideMobile}>Last change</th>
          </>
        }
        row={(r) => (
          <>
            <td style={{ overflowWrap: 'anywhere' }}>
              {nameCell(r)}
              {r.info?.global && <div className={styles.muted}>global</div>}
            </td>
            <td>
              {r.info?.register ? (
                <Hash
                  value={r.info.register}
                  href={`/scan/${r.info.register}`}
                  keep={6}
                />
              ) : (
                '-'
              )}
            </td>
            {changed(r)}
          </>
        )}
      />

      <RegisterCard
        title="Namespaces"
        rows={namespaces}
        head={
          <>
            <th>Namespace</th>
            <th className={styles.hideMobile}>Last change</th>
          </>
        }
        row={(r) => (
          <>
            <td>{nameCell(r)}</td>
            {changed(r)}
          </>
        )}
      />
    </DetailPage>
  );
}
