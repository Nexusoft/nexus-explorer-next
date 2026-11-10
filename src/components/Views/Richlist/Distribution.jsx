import { formatAmount } from 'utils/format';
import styles from './richlist.module.scss';

/** Share of the total supply per rank group, as one stacked bar */
export default function Distribution({ values, labels }) {
  const total = values.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const share = (v) => (v / total) * 100;

  return (
    <section className={styles.distribution}>
      <h2>Share of total supply</h2>
      <div
        className={styles.bar}
        role="img"
        aria-label="Share of total supply by rank">
        {values.map((v, i) => (
          <span
            key={labels[i]}
            data-group={i}
            style={{ width: `${share(v)}%` }}
            title={`${labels[i]}: ${share(v).toFixed(1)} %`}
          />
        ))}
      </div>
      <dl className={styles.groups}>
        {values.map((v, i) => (
          <div key={labels[i]}>
            <dt data-group={i}>{labels[i]}</dt>
            <dd>
              {share(v).toFixed(1)} %<small>{formatAmount(v, 0)} NXS</small>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
