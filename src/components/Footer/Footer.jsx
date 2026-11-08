import styles from './Footer.module.scss';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import TYPES from 'types';
import { getVersion } from 'utils/getVersion';

const columns = [
  {
    title: 'Nexus',
    links: [
      ['nexus.io', 'https://nexus.io'],
      ['Wiki', 'https://wiki.nexus.io'],
      ['API documentation', 'https://wiki.nexus.io/en/tritium++'],
    ],
  },
  {
    title: 'Wallets',
    links: [
      ['Desktop wallet', 'https://nexus.io/wallets'],
      [
        'Android',
        'https://play.google.com/store/apps/details?id=io.nexus.wallet',
      ],
      ['iOS (TestFlight)', 'https://testflight.apple.com/join/dJLBiKzt'],
    ],
  },
  {
    title: 'Community',
    links: [
      ['Telegram', 'https://t.me/NexusOfficial'],
      ['X (Twitter)', 'https://twitter.com/NexusOfficial'],
      ['Reddit', 'https://www.reddit.com/r/nexus_community/'],
      ['YouTube', 'https://www.youtube.com/channel/UCDi2stU5yj71_iPgxMZF79w'],
      ['Blog', 'https://medium.com/@NexusOfficial'],
    ],
  },
  {
    title: 'Explorer',
    links: [
      ['About', '/about'],
      ['Source code', 'https://github.com/Nexusoft/nexus-explorer-next'],
      ['Privacy policy', 'https://nexus.io/privacy'],
      ['Terms of use', 'https://nexus.io/terms'],
    ],
  },
];

function FooterLink({ label, href }) {
  if (href.startsWith('/')) {
    return (
      <Link href={href}>
        <a>{label}</a>
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

/**
 * Site footer: link columns, versions and copyright
 * @returns {JSX.Element}
 */
export default function Footer() {
  const { network, getInfo } = useNetwork();
  const { data } = useQuery(['info', network.name], getInfo, {
    refetchInterval: TYPES.REFETCH_INTERVALS.METRICS,
  });
  const nodeVersion = data?.data?.result?.version;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <FooterLink label={label} href={href} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className={styles.bottom}>
          <span>Copyright 2014-{new Date().getFullYear()} Nexus</span>
          <span className={styles.versions}>
            Explorer v{getVersion()}
            {nodeVersion && <> &nbsp;|&nbsp; Node v{nodeVersion}</>}
          </span>
        </div>
      </div>
    </footer>
  );
}
