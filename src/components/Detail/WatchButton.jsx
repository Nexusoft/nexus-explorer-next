import { useEffect, useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { styles } from '.';
import { useWatchlist } from 'hooks/useWatchlist/useWatchlist';

/** Star that adds this page to the watchlist (kept in this browser) */
export default function WatchButton({ id, kind, label }) {
  const { has, add, remove, relabel, labelOf } = useWatchlist();
  //browser storage is only there after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const watched = mounted && !!id && has(id);
  //the page may learn a name later (a verified username): it replaces a shortened hash
  useEffect(() => {
    const stored = labelOf(id) || '';
    if (watched && label && stored.includes('...') && !label.includes('...')) {
      relabel(id, label);
    }
  }, [watched, label]);
  if (!mounted || !id) return null;

  return (
    <button
      type="button"
      className={styles.watchButton}
      aria-pressed={watched}
      title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      onClick={() => (watched ? remove(id) : add({ id, kind, label }))}>
      {watched ? (
        <BsStarFill aria-hidden="true" />
      ) : (
        <BsStar aria-hidden="true" />
      )}
      <span>{watched ? 'Watching' : 'Watch'}</span>
    </button>
  );
}
