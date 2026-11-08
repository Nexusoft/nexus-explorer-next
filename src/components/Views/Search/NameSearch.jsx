import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Card,
  DetailPage,
  Hash,
  SectionTitle,
  styles,
} from 'components/Detail';
import SearchHelp from 'components/common/NE_SearchHelp';
import Loader from 'components/common/NE_Loader';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { ASSET_FORMATS } from 'utils/assets';
import { timeAgo } from 'utils/format';

const KIND_LABEL = {
  token: 'Token',
  name: 'Global name',
  namespace: 'Namespace',
  asset: 'Asset',
};

function detail(r) {
  if (r.kind === 'asset') {
    return [r.info?.kind, ASSET_FORMATS[r.info?.format]]
      .filter(Boolean)
      .join(', ');
  }
  if (r.kind === 'name' && r.info?.register) {
    return (
      <>
        points to{' '}
        <Hash
          value={r.info.register}
          href={`/scan/${r.info.register}`}
          keep={6}
        />
      </>
    );
  }
  return null;
}

/** Text that is no known format: look it up by name in the explorer index */
export default function NameSearch({ query }) {
  const router = useRouter();
  const { network, getIndex } = useNetwork();
  const searchRQ = useQuery(
    ['nameSearch', network.name, query],
    () => getIndex('search', { q: query }),
    { retry: false, staleTime: 60000 }
  );
  const rows = searchRQ.data?.result || [];

  //one result with exactly this name: open it
  const only =
    rows.length === 1 && rows[0].name?.toLowerCase() === query.toLowerCase()
      ? rows[0]
      : null;
  useEffect(() => {
    if (only) router.replace(`/scan/${only.address}`);
  }, [only?.address]);

  if (searchRQ.isLoading || only) return <Loader />;
  if (!rows.length) {
    //without an index the text simply matches no search format
    return searchRQ.isError ? (
      <SearchHelp query={query} />
    ) : (
      <SearchHelp
        query={query}
        notFound
        message="No token, global name, namespace or asset starts with this."
      />
    );
  }

  return (
    <DetailPage>
      <Card>
        <SectionTitle note={rows.length}>
          Names starting with “{query}”
        </SectionTitle>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>What</th>
                <th className={styles.hideMobile}>Details</th>
                <th className={styles.hideMobile}>Owner</th>
                <th className={styles.hideMobile}>Last change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.address}>
                  <td style={{ overflowWrap: 'anywhere' }}>
                    <Link href={`/scan/${r.address}`}>
                      <a>{r.name}</a>
                    </Link>
                  </td>
                  <td>{KIND_LABEL[r.kind] || r.kind}</td>
                  <td className={styles.hideMobile}>{detail(r)}</td>
                  <td className={styles.hideMobile}>
                    <Hash value={r.owner} href={`/scan/${r.owner}`} keep={6} />
                  </td>
                  <td className={styles.hideMobile}>{timeAgo(r.modified)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.muted}>
          Tokens, global names, namespaces and assets from the explorer index.
          Account names are searched as username:account.
        </p>
      </Card>
    </DetailPage>
  );
}
