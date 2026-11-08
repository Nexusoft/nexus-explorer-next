import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { Card, Hash, SectionTitle, styles } from 'components/Detail';
import ListPager from 'components/Detail/ListPager';
import Loader from 'components/common/NE_Loader';
import ErrorMessage from 'components/common/NE_ErrorMessage';
import { formatDateShort, formatInt, timeAgo } from 'utils/format';
import { cls } from 'utils';
import { ASSET_FORMATS } from 'utils/assets';
import ms from './Assets.module.scss';

const allKinds = '';
const noKind = '-';

function matches(a, text) {
  if (!text) return true;
  return [a.label, a.name, a.address, a.owner, a.kind].some((v) =>
    v?.toLowerCase().includes(text)
  );
}

export default function Assets() {
  const { network, getAssets } = useNetwork();
  const { isLoading, data, error } = useQuery(
    ['assets', network.name],
    getAssets,
    { staleTime: 60 * 1000 }
  );
  const [text, setText] = useState('');
  const [kind, setKind] = useState(allKinds);
  const [format, setFormat] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  //kinds with their counts, most used first
  const kinds = useMemo(() => {
    const counts = {};
    for (const a of data || []) {
      const k = a.kind || noKind;
      counts[k] = (counts[k] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return (data || []).filter(
      (a) =>
        (kind === allKinds || (a.kind || noKind) === kind) &&
        (!format || a.type === format) &&
        matches(a, needle)
    );
  }, [data, text, kind, format]);

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) {
    return (
      <Card>
        <p className={styles.muted}>
          The asset list comes from the explorer index, which is not available
          on this network. A single asset can still be opened by its address
          with the search.
        </p>
      </Card>
    );
  }

  const shown = rows.slice(page * pageSize, (page + 1) * pageSize);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const filter = (set) => (e) => {
    set(e.target.value);
    setPage(0);
  };

  return (
    <Card>
      <SectionTitle
        note={
          rows.length === data.length
            ? formatInt(data.length)
            : `${formatInt(rows.length)} of ${formatInt(data.length)}`
        }>
        Assets
      </SectionTitle>
      <div className={ms.filters}>
        <input
          type="search"
          className={cls(styles.navButton, ms.search)}
          placeholder="Filter by name, address or owner"
          aria-label="Filter assets"
          value={text}
          onChange={filter(setText)}
        />
        <select
          className={styles.navButton}
          aria-label="Kind"
          value={kind}
          onChange={filter(setKind)}>
          <option value={allKinds}>All kinds</option>
          {kinds.map(([k, n]) => (
            <option key={k} value={k}>
              {k === noKind ? 'No kind given' : k} ({n})
            </option>
          ))}
        </select>
        <select
          className={styles.navButton}
          aria-label="Format"
          value={format}
          onChange={filter(setFormat)}>
          <option value="">All formats</option>
          {Object.entries(ASSET_FORMATS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className={styles.muted}>No asset matches the filter.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Kind</th>
                <th className={styles.hideMobile}>Format</th>
                <th className={styles.hideMobile}>Owner</th>
                <th>Last change</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.address}>
                  <td className={ms.name}>
                    {a.label ? (
                      <Link href={`/scan/${a.address}`}>
                        <a>{a.label}</a>
                      </Link>
                    ) : (
                      <Hash
                        value={a.address}
                        href={`/scan/${a.address}`}
                        keep={8}
                      />
                    )}
                    {a.name && a.name !== a.label && (
                      <div className={styles.muted}>{a.name}</div>
                    )}
                  </td>
                  <td>
                    {a.kind ? (
                      <span className={ms.kind}>{a.kind}</span>
                    ) : (
                      <span className={styles.muted}>-</span>
                    )}
                  </td>
                  <td className={styles.hideMobile}>
                    {ASSET_FORMATS[a.type] || a.type}
                  </td>
                  <td className={styles.hideMobile}>
                    <Hash value={a.owner} keep={6} />
                  </td>
                  <td
                    title={`Created ${formatDateShort(a.created)}`}
                    style={{ whiteSpace: 'nowrap' }}>
                    {formatDateShort(a.modified)}
                    <div className={styles.muted}>{timeAgo(a.modified)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <ListPager
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          hasOlder={page + 1 < pages}
        />
      )}
      <p className={styles.muted}>
        Assets are registers that hold any data their owner puts on chain: art,
        achievements, posts, product records, settings. Kind is the type the
        creating app wrote into the asset, when it wrote one. The index
        refreshes the list every 10 minutes.
      </p>
    </Card>
  );
}
