import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Card,
  DetailPage,
  Hash,
  OwnerHash,
  SectionTitle,
  styles,
} from 'components/Detail';
import SearchHelp from 'components/common/NE_SearchHelp';
import Loader from 'components/common/NE_Loader';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { ASSET_FORMATS } from 'utils/assets';
import { timeAgo } from 'utils/format';
import { NAME_KIND_LABEL, userHref } from 'utils/search';

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

/** Text that is no known format: a username, or a name in the explorer index */
export default function NameSearch({ query }) {
  const router = useRouter();
  const { network, getIndex, findUser } = useNetwork();
  const searchRQ = useQuery(
    ['nameSearch', network.name, query],
    () => getIndex('search', { q: query }),
    { retry: false, staleTime: 60000 }
  );
  const userRQ = useQuery(
    ['findUser', network.name, query],
    () => findUser(query),
    { retry: false, staleTime: 60000 }
  );
  const rows = searchRQ.data?.result || [];
  const user = userRQ.data;

  //one clear answer: open it
  const exact =
    rows.length === 1 && rows[0].name?.toLowerCase() === query.toLowerCase()
      ? `/scan/${rows[0].address}`
      : null;
  const target = user && !rows.length ? userHref(user) : !user ? exact : null;
  useEffect(() => {
    if (target) router.replace(target);
  }, [target]);

  if (searchRQ.isLoading || userRQ.isLoading || target) return <Loader />;
  if (!rows.length) {
    //without an index the text simply matches no search format
    return searchRQ.isError ? (
      <SearchHelp query={query} />
    ) : (
      <SearchHelp
        query={query}
        notFound
        message="No user with this name, and no token, global name, namespace or asset starts with it."
      />
    );
  }

  return (
    <DetailPage>
      <Card>
        <SectionTitle note={rows.length + (user ? 1 : 0)}>
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
              {user && (
                <tr>
                  <td style={{ overflowWrap: 'anywhere' }}>
                    <Link href={userHref(user)}>
                      <a>{user.username}</a>
                    </Link>
                  </td>
                  <td>User</td>
                  <td className={styles.hideMobile}>
                    signature chain with its accounts and transactions
                  </td>
                  <td className={styles.hideMobile}>
                    <OwnerHash owner={user.genesis} />
                  </td>
                  <td className={styles.hideMobile} />
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.address}>
                  <td style={{ overflowWrap: 'anywhere' }}>
                    <Link href={`/scan/${r.address}`}>
                      <a>{r.name}</a>
                    </Link>
                  </td>
                  <td>{NAME_KIND_LABEL[r.kind] || r.kind}</td>
                  <td className={styles.hideMobile}>{detail(r)}</td>
                  <td className={styles.hideMobile}>
                    <OwnerHash owner={r.owner} />
                  </td>
                  <td className={styles.hideMobile}>{timeAgo(r.modified)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.muted}>
          Users by their exact username, tokens, global names, namespaces and
          assets by the start of the name. One account of a user is
          username:account, e.g. {query}:default.
        </p>
      </Card>
    </DetailPage>
  );
}
