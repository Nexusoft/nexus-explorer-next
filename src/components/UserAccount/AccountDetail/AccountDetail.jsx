import styles from './AccountDetail.module.scss';
import QRCode from 'react-qr-code';
import CopyText from 'components/common/NE_CopyText';
import TYPES from 'types';
import { useRouter } from 'next/router';
import { CARD_TYPES } from 'types/ConstantsTypes';

export const AccountDetail = ({ type, data }) => {
  const router = useRouter();
  const {
    owner,
    version,
    created,
    modified,
    type: dataType,
    form,
    balance,
    token,
    ticker,
    address,
    total,
    name,
    rate,
    stake,
    ...customProperties
  } = data;
  return (
    <>
      <div className={styles.details}>
        <section className={styles.details__text}>
          <div>Account: {router.query.addr}</div>
          <div>
            Address: <CopyText value={address} />
          </div>
          <div>
            Owner: <CopyText value={owner} />
          </div>
          <div>Created On: {new Date(created * 1000).toLocaleString()}</div>
          <div>Last Modified: {new Date(modified * 1000).toLocaleString()}</div>
          <div>Name: {name}</div>
          <div>Stake Rate: {rate}</div>
          <div>Token Name: {token}</div>
          <div>Ticker: {ticker}</div>
          {type == CARD_TYPES.TRUST && (
            <div>
              Average Reward Rate: {((stake * rate) / 100 / 365).toFixed(2)}{' '}
              {ticker}
              /Day
            </div>
          )}
          {type == CARD_TYPES.ASSET && (
            <>
              {Object.entries(customProperties).map(([key, value]) => (
                <div key={key}>
                  {key}: {value}
                </div>
              ))}
            </>
          )}
        </section>
        <section className={styles.qrConatiner}>
          <div className={styles.qrCode}>
            <QRCode
              fgColor={TYPES.COLORS.NEXUS_BLUE}
              title={address}
              value={address || ''}
              level="L"
              size={200}
            />
          </div>
        </section>
      </div>
    </>
  );
};
