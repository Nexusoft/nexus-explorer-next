import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BiCopy, BiCheck } from 'react-icons/bi';
import styles from './Detail.module.scss';
import { handleCopy } from 'utils/helper';
import { shortHash, formatAmount, formatDate, timeAgo } from 'utils/format';
import { describeContract } from 'utils/contracts';
import { cls } from 'utils';
import { StringsTypes } from 'types/StringsTypes';

export { styles };

export const channelName = (channel) =>
  StringsTypes.CHANNELS[channel] || `Channel ${channel}`;

/** Stake / Prime / Hash with its channel color */
export function ChannelTag({ channel }) {
  return (
    <span className={styles.channel} data-channel={channel}>
      {channelName(channel)}
    </span>
  );
}

/** "2 min ago", rendered in the browser only (static pages would show build time ages) and kept current */
export function Age({ ts }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now() / 1000);
    const id = setInterval(() => setNow(Date.now() / 1000), 15000);
    return () => clearInterval(id);
  }, []);
  return <span title={formatDate(ts)}>{now ? timeAgo(ts, now) : ''}</span>;
}

/** Page heading with a one line explanation */
export function PageTitle({ title, children }) {
  return (
    <header className={styles.pageTitle}>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}

export function DetailPage({ children }) {
  return <div className={styles.page}>{children}</div>;
}

export function Card({ children, className }) {
  return <section className={cls(styles.card, className)}>{children}</section>;
}

/** Page head: small kind label, big title, subtitle, badges, right side actions */
export function DetailHeader({ kind, title, subtitle, badges = [], actions }) {
  return (
    <Card>
      <div className={styles.header}>
        <div style={{ minWidth: 0 }}>
          <p className={styles.kind}>{kind}</p>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          {badges.filter(Boolean).length > 0 && (
            <div className={styles.badges}>
              {badges.filter(Boolean).map((b) => (
                <span
                  key={b.text}
                  className={styles.badge}
                  data-tone={b.tone}
                  data-channel={b.channel}>
                  {b.text}
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className={styles.nav}>{actions}</div>}
      </div>
    </Card>
  );
}

export function NavButton({ href, children, disabled, title }) {
  if (disabled || !href) {
    return (
      <span className={styles.navButton} aria-disabled="true" title={title}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href}>
      <a className={styles.navButton} title={title}>
        {children}
      </a>
    </Link>
  );
}

export function Stats({ children }) {
  return <dl className={styles.stats}>{children}</dl>;
}

export function Stat({ label, value, note, big }) {
  return (
    <div className={cls(styles.stat, big && styles.statBig)}>
      <dt>{label}</dt>
      <dd>
        {value}
        {note && <small>{note}</small>}
      </dd>
    </div>
  );
}

export function SectionTitle({ children, note }) {
  return (
    <h2 className={styles.sectionTitle}>
      {children}
      {note != null && <span>{note}</span>}
    </h2>
  );
}

export function CopyButton({ value, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={styles.copy}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        handleCopy(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}>
      {done ? <BiCheck color="#28a745" /> : <BiCopy />}
    </button>
  );
}

/** Hash / address: optional link, shortened unless full, always copyable */
export function Hash({ value, href, full = false, keep = 8 }) {
  if (!value) return <span className={styles.muted}>-</span>;
  const text = full ? value : shortHash(value, keep);
  return (
    <span
      className={cls(styles.hash, styles.mono, !full && styles.short)}
      title={value}>
      {href ? (
        <Link href={href}>
          <a>{text}</a>
        </Link>
      ) : (
        <span className="text">{text}</span>
      )}
      <CopyButton value={value} />
    </span>
  );
}

/** Account / trust / sig chain shown with its name when the node knows it */
export function Party({ party, self }) {
  if (!party) return <span className={styles.muted}>-</span>;
  if (party.genesis) {
    return (
      <span className={styles.party}>
        <span className={styles.partyName}>Signature chain</span>
        <Hash value={party.genesis} keep={6} />
      </span>
    );
  }
  if (!party.address) return <span className={styles.muted}>-</span>;
  const isSelf = self && party.address === self;
  return (
    <span className={styles.party}>
      {(party.name || isSelf) && (
        <span className={styles.partyName}>
          {isSelf ? 'This account' : party.name}
        </span>
      )}
      <Hash
        value={party.address}
        href={isSelf ? undefined : `/scan/${party.address}`}
        keep={6}
      />
    </span>
  );
}

/** One contract as "label: from to to, amount" */
export function ContractFlow({ contract, self }) {
  const d = describeContract(contract);
  let sign = '';
  if (self && d.amount != null) {
    if (d.to?.address === self) sign = '+';
    else if (d.from?.address === self) sign = '-';
  }
  return (
    <div className={styles.flow}>
      <div className={styles.flowLabel}>{d.label}</div>
      <div className={styles.flowParties}>
        {d.from && (
          <>
            <span className="word">from</span>
            <Party party={d.from} self={self} />
          </>
        )}
        {d.to && (
          <>
            <span className="word">to</span>
            <Party party={d.to} self={self} />
          </>
        )}
        {!d.from && !d.to && <span className={styles.muted}>-</span>}
      </div>
      <div className={styles.flowAmount} data-sign={sign}>
        {d.amount != null ? `${sign}${formatAmount(d.amount)} ${d.ticker}` : ''}
      </div>
    </div>
  );
}

export function FlowList({ contracts = [], self }) {
  if (!contracts.length) {
    return <p className={styles.muted}>No contracts in this transaction.</p>;
  }
  return (
    <div className={styles.flowList}>
      {contracts.map((c, i) => (
        <ContractFlow key={`${c.id ?? i}-${c.OP}`} contract={c} self={self} />
      ))}
    </div>
  );
}

/** Collapsed list of raw fields for people who want them */
export function TechDetails({ rows, title = 'Technical details' }) {
  return (
    <Card>
      <details className={styles.techDetails}>
        <summary>{title}</summary>
        <dl className={styles.kv}>
          {rows
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([label, value]) => (
              <div key={label} style={{ display: 'contents' }}>
                <dt>{label}</dt>
                <dd className={styles.mono}>{value}</dd>
              </div>
            ))}
        </dl>
      </details>
    </Card>
  );
}
