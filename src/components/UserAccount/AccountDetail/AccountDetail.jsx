import styles from './AccountDetail.module.scss';
import QRCode from 'react-qr-code';
import CopyText from 'components/atoms/NE_CopyText';
import TYPES from 'types';

export const AccountDetail = ({ data }) => {
  return (
    <>
      <div className={styles.details}>
        <section className={styles.details__text}>
          <div>
            Address: <CopyText value={data.address} ellipsisAfter={99} />{' '}
          </div>
          <div>
            Owner: <CopyText value={data.owner} ellipsisAfter={99} />
          </div>
          <div>
            Created On: {new Date(data.created * 1000).toLocaleString()}
          </div>
          <div>
            Last Modified: {new Date(data.modified * 1000).toLocaleString()}
          </div>
          <div>Name: {data.name}</div>
          <div>Token Name: {data.token}</div>
          <div>Ticker: {data.ticker}</div>
        </section>
        <section className={styles.qrConatiner}>
          <div className={styles.qrCode}>
            <QRCode
              fgColor={TYPES.COLORS.NEXUS_BLUE}
              title={data.address}
              value={data.address || ''}
              level="L"
              size={200}
            />
          </div>
        </section>
      </div>
    </>
  );
};