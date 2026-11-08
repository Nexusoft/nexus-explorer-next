import React, { useEffect, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import {
  Card,
  DetailHeader,
  DetailPage,
  Hash,
  SectionTitle,
  Stat,
  Stats,
  styles as detailStyles,
} from 'components/Detail';
import { formatAmount, formatDateShort, timeAgo } from 'utils/format';
import { InvoiceStatus } from '../InvoiceStatus/invoiceStatus';
import styles from './invoiceModal.module.scss';

export function InvoiceModal(props) {
  const { onClose } = props;
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <section className={styles.backdrop}>
      <div className={styles.backdrop__action} onClick={onClose}></div>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Invoice">
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={onClose}>
          <IoClose aria-hidden="true" />
        </button>
        <InvoiceWithData {...props} onClose={null} />
      </div>
    </section>
  );
}

export const InvoiceWithData = ({ data, onBack, isPage }) => {
  const { address, created, modified, owner, json = {} } = data;
  const {
    account = '',
    amount = 0,
    sender_detail = '',
    reference = '',
    description = '',
    status = '',
    recipient = '',
    due_date,
    items = [],
  } = json;

  return (
    <DetailPage>
      {isPage && onBack && (
        <div>
          <button
            type="button"
            className={detailStyles.navButton}
            onClick={onBack}>
            Back
          </button>
        </div>
      )}
      <DetailHeader
        kind="Invoice"
        title={`${formatAmount(amount)} NXS`}
        subtitle={description || reference || null}
        actions={<InvoiceStatus status={status} />}
      />

      <Card>
        <Stats>
          <Stat
            label="Created"
            value={formatDateShort(created)}
            note={`UTC, ${timeAgo(created)}`}
          />
          {due_date && (
            <Stat
              label="Due"
              value={formatDateShort(due_date)}
              note={`UTC, ${timeAgo(due_date)}`}
            />
          )}
          <Stat
            label="Last change"
            value={formatDateShort(modified)}
            note={`UTC, ${timeAgo(modified)}`}
          />
          {reference && <Stat label="Reference" value={reference} />}
        </Stats>
      </Card>

      <Card>
        <SectionTitle>Parties</SectionTitle>
        <dl className={detailStyles.kv}>
          <dt>From</dt>
          <dd>
            {sender_detail && <div>{sender_detail}</div>}
            <Hash value={owner} keep={10} />
          </dd>
          <dt>Recipient</dt>
          <dd>
            <Hash value={recipient} keep={10} />
          </dd>
          {account && (
            <>
              <dt>Pay to account</dt>
              <dd>
                <Hash value={account} href={`/scan/${account}`} />
              </dd>
            </>
          )}
          <dt>Invoice address</dt>
          <dd>
            <Hash
              value={address}
              href={isPage ? undefined : `/scan?invoice=${address}`}
            />
          </dd>
        </dl>
      </Card>

      <Card>
        <SectionTitle note={`${items.length}`}>Items</SectionTitle>
        <div className={detailStyles.tableWrap}>
          <table className={detailStyles.table}>
            <thead>
              <tr>
                <th>Description</th>
                <th className={detailStyles.right}>Units</th>
                <th className={detailStyles.right}>Unit price</th>
                <th className={detailStyles.right}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item?.description}</td>
                  <td className={detailStyles.right}>{item?.units}</td>
                  <td className={detailStyles.right}>
                    {formatAmount(item?.amount)} NXS
                  </td>
                  <td className={detailStyles.right}>
                    {formatAmount((item?.amount || 0) * (item?.units || 0))} NXS
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className={detailStyles.right}>
                  <strong>Invoice total</strong>
                </td>
                <td className={detailStyles.right}>
                  <strong>{formatAmount(amount)} NXS</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </DetailPage>
  );
};
