import styles from './SearchHelp.module.scss';
import { SEARCH_HELP } from 'utils/search';

/**
 * Search formats, with the query when it is not a known format or the node found nothing
 */
export default function SearchHelp({ query, notFound = false, message = '' }) {
  return (
    <section className={styles.container}>
      {query && (
        <>
          <h2 className={styles.title}>
            {notFound ? 'Nothing found for' : 'Not a valid search'}
          </h2>
          <p className={styles.query} title={query}>
            {query}
          </p>
        </>
      )}
      {notFound && message && <p className={styles.message}>{message}</p>}
      <p className={styles.lead}>You can search for:</p>
      <dl className={styles.list}>
        {SEARCH_HELP.map(([label, example]) => (
          <div key={label} className={styles.row}>
            <dt>{label}</dt>
            <dd>{example}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
