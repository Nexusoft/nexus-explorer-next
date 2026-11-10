import { useState } from 'react';
import { styles } from '.';

const pageSizes = [10, 20, 50];

/**
 * Newer / Older pager for block based lists, with an optional jump to height
 * page 0 = newest
 */
export default function ListPager({
  page,
  setPage,
  pageSize,
  setPageSize,
  hasOlder = true,
  onJump,
  jumpLabel = 'Go to block',
}) {
  const [jump, setJump] = useState('');
  return (
    <div className={styles.pager} style={{ flexWrap: 'wrap' }}>
      {onJump && (
        <form
          style={{ display: 'flex', gap: '0.4rem', marginRight: 'auto' }}
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(jump, 10);
            if (Number.isFinite(n) && n >= 0) onJump(n);
          }}>
          <input
            className={styles.navButton}
            style={{ width: '9rem', cursor: 'text' }}
            inputMode="numeric"
            placeholder="Block height"
            aria-label="Block height"
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" className={styles.navButton}>
            {jumpLabel}
          </button>
        </form>
      )}
      {setPageSize && (
        <label className={styles.muted}>
          Rows{' '}
          <select
            className={styles.navButton}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}>
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        className={styles.navButton}
        aria-disabled={page === 0}
        onClick={() => setPage(0)}>
        Latest
      </button>
      <button
        type="button"
        className={styles.navButton}
        aria-disabled={page === 0}
        onClick={() => setPage(Math.max(0, page - 1))}>
        Newer
      </button>
      <button
        type="button"
        className={styles.navButton}
        aria-disabled={!hasOlder}
        onClick={() => setPage(page + 1)}>
        Older
      </button>
    </div>
  );
}
