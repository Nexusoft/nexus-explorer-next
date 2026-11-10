import styles from './ErrorMessage.module.scss';
import Logger from 'utils/customLog';

export default function ErrorMessage({ error = {} }) {
  const { code = '', message = '' } = error;
  Logger.error(error);
  return (
    <div className={styles.box} role="alert">
      <p className={styles.title}>Could not load this from the node</p>
      {message && <p className={styles.message}>{message}</p>}
      {code !== '' && <p className={styles.code}>Code {code}</p>}
    </div>
  );
}
