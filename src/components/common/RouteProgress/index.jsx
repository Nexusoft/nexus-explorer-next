import { useEffect, useState } from 'react';
import Router from 'next/router';
import styles from './RouteProgress.module.scss';

//quick page changes should not flash the bar
const showDelayMs = 150;

/** Thin bar at the top of the window while the next page loads */
export default function RouteProgress() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timer;
    const start = (url, { shallow } = {}) => {
      if (shallow) return;
      clearTimeout(timer);
      timer = setTimeout(() => setActive(true), showDelayMs);
    };
    const done = () => {
      clearTimeout(timer);
      setActive(false);
    };
    Router.events.on('routeChangeStart', start);
    Router.events.on('routeChangeComplete', done);
    Router.events.on('routeChangeError', done);
    return () => {
      clearTimeout(timer);
      Router.events.off('routeChangeStart', start);
      Router.events.off('routeChangeComplete', done);
      Router.events.off('routeChangeError', done);
    };
  }, []);

  if (!active) return null;
  return (
    <div className={styles.bar} role="progressbar" aria-label="Loading page" />
  );
}
