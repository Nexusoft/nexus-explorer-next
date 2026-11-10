import Link from 'next/link';
import { VscGithub } from 'react-icons/vsc';
import { Card, DetailPage, PageTitle, SectionTitle } from 'components/Detail';
import styles from './about.module.scss';

const REPO_URL = 'https://github.com/rayanfer32/nexus-explorer-next';

const sections = [
  ['/blocks', 'Blocks', 'every block with its channel, size and transactions'],
  ['/transactions', 'Transactions', 'the newest transactions and contracts'],
  [
    '/richlist',
    'Rich list',
    'the largest NXS accounts and how supply is spread',
  ],
  [
    '/trustlist',
    'Top stakers',
    'trust accounts by stake, rate and trust score',
  ],
  ['/globalnames', 'Global names', 'names registered on the chain'],
  ['/namespaces', 'Namespaces', 'namespaces and who owns them'],
  ['/tokens', 'Tokens', 'tokens created on Nexus with their supply'],
  ['/metrics', 'Network metrics', 'supply, staking and ledger figures'],
  ['/dao', 'DAO', 'DAO accounts, balances and invoices'],
];

const About = ({ data }) => {
  const contributors = Array.isArray(data)
    ? data
        .map((item) => item.author)
        .filter(
          (a) =>
            a &&
            a.type !== 'Bot' &&
            !['web-flow', 'actions-user'].includes(a.login)
        )
    : [];

  return (
    <DetailPage>
      <PageTitle title="About">
        A block explorer for the Nexus blockchain.
      </PageTitle>

      <Card>
        <div className={styles.text}>
          <p>
            The explorer reads the chain from a Nexus node and shows blocks,
            transactions, accounts and registers. Search by block height, block
            hash, transaction id, address or name from the bar at the top of
            every page.
          </p>
          <p>
            Figures come straight from the node API. Times are shown in UTC.
            Amounts are in NXS unless a token ticker is given.
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle>What you can look up</SectionTitle>
        <ul className={styles.sections}>
          {sections.map(([href, label, text]) => (
            <li key={href}>
              <Link href={href}>
                <a>{label}</a>
              </Link>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>Source and contributors</SectionTitle>
        <div className={styles.text}>
          <p>
            Built with Next.js and a Python backend. The code is open source;
            suggestions and contributions are welcome on{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            .
          </p>
          {contributors.length > 0 && <p>Originally built in India by</p>}
        </div>
        {contributors.length > 0 && (
          <ul className={styles.contributors}>
            {contributors.map((a) => (
              <li key={a.login}>
                <a href={a.html_url} target="_blank" rel="noreferrer">
                  <VscGithub aria-hidden="true" />
                  {a.login}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DetailPage>
  );
};

export default About;
