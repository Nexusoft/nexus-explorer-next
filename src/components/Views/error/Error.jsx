import Link from 'next/link';
import Router from 'next/router';
import styles from './error.module.scss';

const CustomError = ({ statusCode }) => {
  const notFound = statusCode == 404;
  return (
    <article className={styles.container}>
      {!!statusCode && <p className={styles.code}>Error {statusCode}</p>}
      <h1>{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p className={styles.detail}>
        {notFound
          ? 'This page does not exist. To look up a block, transaction or address, use the search at the top.'
          : 'The explorer could not load this page. Try again in a moment.'}
      </p>
      <div className={styles.cta}>
        <Link href="/">
          <a className={styles.primary}>Go to the home page</a>
        </Link>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => Router.back()}>
          Go back
        </button>
      </div>
    </article>
  );
};

export default CustomError;
