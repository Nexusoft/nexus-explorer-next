import styles from './Loader.module.scss';

/** Small spinner with a label, fills the space the content will take */
export default function Loader({ label = 'Loading' }) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
