import Image from 'next/image';
import Link from 'next/link';
import styles from './Brand.module.scss';
import TYPES from 'types';
import { NETWORKS } from 'types/ConstantsTypes';

/**
 * Brand logo, always the white logo on the header band
 * @param {string} network selected network name
 * @returns {JSX.Element}
 */
const Brand = ({ network }) => {
  const isTestnet = NETWORKS.TESTNET.name == network;

  return (
    <Link href="/">
      <a className={styles.brand} aria-label="Nexus Explorer home">
        <Image
          width={124}
          height={28}
          layout="fixed"
          src={TYPES.NAVBAR.BRAND.WHITE}
          alt="Nexus"
        />
        <span className={styles.explorer}>Explorer</span>
        {isTestnet && <span className={styles.testnet}>Testnet</span>}
      </a>
    </Link>
  );
};

export default Brand;
