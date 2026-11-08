import { useQuery } from 'react-query';
import TYPES from 'types';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import {
  Card,
  DetailPage,
  SectionTitle,
  Stat,
  Stats,
  styles,
} from 'components/Detail';
import { formatAmount, formatInt } from 'utils/format';
import { isNum } from 'utils/converter';

const nxs = (v, digits = 0) =>
  isNum(v) ? `${formatAmount(v, digits)} NXS` : '-';
const pct = (v, digits = 2) => (isNum(v) ? `${v.toFixed(digits)} %` : '-');

function Loading({ rq, children }) {
  if (rq.isLoading) return <p className={styles.muted}>Loading...</p>;
  if (rq.isError) {
    return <p className={styles.muted}>Could not load this from the node.</p>;
  }
  return children;
}

//daily / weekly / monthly in one table instead of a tab per period
function PeriodTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table} style={{ minWidth: '34rem' }}>
        <thead>
          <tr>
            <th></th>
            <th className={styles.right}>Last 24 hours</th>
            <th className={styles.right}>Last 7 days</th>
            <th className={styles.right}>Last 30 days</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, values, fmt, note]) => (
            <tr key={label}>
              <td>
                {label}
                {note && <div className={styles.muted}>{note}</div>}
              </td>
              {['daily', 'weekly', 'monthly'].map((p) => (
                <td
                  key={p}
                  className={styles.right}
                  style={{ whiteSpace: 'nowrap' }}>
                  {values ? fmt(values[p]) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Metrics() {
  const { network, getMetrics, getMining, getTotalNXS, getLedgerMetrics } =
    useNetwork();

  const metricsRQ = useQuery(['metrics', network.name], getMetrics, {
    refetchInterval: TYPES.REFETCH_INTERVALS.METRICS,
  });
  const miningRQ = useQuery(['mining', network.name], getMining, {
    refetchInterval: TYPES.REFETCH_INTERVALS.MINING,
  });
  const totalNXSRQ = useQuery(['totalNXSRQ', network.name], getTotalNXS, {
    staleTime: 5 * 60 * 1000,
  });
  const ledgerRQ = useQuery(['ledgerMetrics', network.name], getLedgerMetrics, {
    staleTime: 5 * 60 * 1000,
  });

  const m = metricsRQ.data?.data?.result;
  const supply = miningRQ.data?.data?.result?.supply;
  const ledger = ledgerRQ.data?.data?.result;
  const tritiumTotal = totalNXSRQ.data?.total;
  const stakedShare =
    isNum(m?.trust?.stake) && isNum(supply?.total)
      ? (m.trust.stake / supply.total) * 100
      : null;

  return (
    <DetailPage>
      <Card>
        <SectionTitle>Supply</SectionTitle>
        <Loading rq={miningRQ}>
          <Stats>
            <Stat
              label="Total supply"
              value={nxs(supply?.total)}
              note="All NXS in existence, same figure as on the home page"
              big
            />
            <Stat
              label="Inflation"
              value={pct(supply?.inflation)}
              note="Yearly growth of the supply"
              big
            />
            <Stat
              label="Held in Tritium accounts"
              value={totalNXSRQ.isLoading ? 'Loading...' : nxs(tritiumTotal)}
              note="Sum of all account and trust balances; coins not yet moved to Tritium are not included"
            />
            <Stat
              label="Burned"
              value={nxs(supply?.burned)}
              note="Sent to burn accounts, out of circulation"
            />
            <Stat
              label="Scheduled supply"
              value={nxs(supply?.target)}
              note="What the emission schedule targets for today"
            />
          </Stats>
          <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>
            New NXS created
          </h3>
          <Stats>
            <Stat label="Per minute" value={nxs(supply?.minute, 2)} />
            <Stat label="Per hour" value={nxs(supply?.hour)} />
            <Stat label="Per day" value={nxs(supply?.day)} />
            <Stat label="Per week" value={nxs(supply?.week)} />
            <Stat label="Per month" value={nxs(supply?.month)} />
          </Stats>
        </Loading>
      </Card>

      <Card>
        <SectionTitle>Staking</SectionTitle>
        <Loading rq={metricsRQ}>
          <Stats>
            <Stat
              label="Staked"
              value={nxs(m?.trust?.stake)}
              note={
                stakedShare != null ? `${pct(stakedShare)} of the supply` : null
              }
              big
            />
            <Stat
              label="Stakers"
              value={formatInt(m?.trust?.total)}
              note="Trust accounts with stake"
              big
            />
            <Stat
              label="Total trust score"
              value={formatInt(m?.trust?.trust)}
              note="Grows the longer accounts stake without interruption"
            />
          </Stats>
        </Loading>
      </Card>

      <Card>
        <SectionTitle>Network activity</SectionTitle>
        <Loading rq={ledgerRQ}>
          <PeriodTable
            rows={[
              ['Transactions', ledger?.volumes?.transactions, formatInt],
              [
                'Contracts',
                ledger?.volumes?.contracts,
                formatInt,
                'One transaction can hold several contracts',
              ],
              ['Accounts', ledger?.volumes?.accounts, formatInt],
              [
                'Minted by mining',
                ledger?.network?.mint?.mining,
                (v) => nxs(v),
              ],
              [
                'Minted by staking',
                ledger?.network?.mint?.staking,
                (v) => nxs(v),
              ],
              ['Added to stake', ledger?.network?.stake, (v) => nxs(v)],
              [
                'Legacy deposits',
                ledger?.exchanges?.deposits,
                (v) => nxs(v),
                'Moved from legacy (UTXO) addresses into Tritium',
              ],
              [
                'Legacy withdrawals',
                ledger?.exchanges?.withdraws,
                (v) => nxs(v),
                'Sent from Tritium to legacy addresses',
              ],
            ]}
          />
        </Loading>
      </Card>

      <Card>
        <SectionTitle>Registers</SectionTitle>
        <Loading rq={metricsRQ}>
          <Stats>
            <Stat
              label="Signature chains"
              value={formatInt(m?.sigchains)}
              note="User profiles on the chain"
              big
            />
            <Stat
              label="Accounts"
              value={formatInt(m?.registers?.objects?.accounts)}
              note="NXS and token accounts"
              big
            />
            <Stat
              label="Tokens"
              value={formatInt(m?.registers?.objects?.tokens)}
            />
            <Stat
              label="Assets"
              value={formatInt(m?.registers?.objects?.assets)}
            />
            <Stat
              label="Tokenized assets"
              value={formatInt(m?.registers?.objects?.tokenized)}
            />
            <Stat
              label="Global names"
              value={formatInt(m?.registers?.names?.global)}
            />
            <Stat
              label="Namespaces"
              value={formatInt(m?.registers?.namespaces)}
            />
            <Stat
              label="Names in namespaces"
              value={formatInt(m?.registers?.names?.namespaced)}
            />
            <Stat
              label="Local names"
              value={formatInt(m?.registers?.names?.local)}
              note="Names private to one signature chain"
            />
            <Stat
              label="Crypto registers"
              value={formatInt(m?.registers?.objects?.crypto)}
              note="Key sets of signature chains"
            />
            <Stat
              label="Raw / read-only"
              value={`${formatInt(m?.registers?.state?.raw)} / ${formatInt(
                m?.registers?.state?.readonly
              )}`}
              note="Plain data registers"
            />
            <Stat
              label="All registers"
              value={formatInt(m?.registers?.total)}
            />
          </Stats>
        </Loading>
      </Card>

      <Card>
        <SectionTitle>Reserves</SectionTitle>
        <Loading rq={metricsRQ}>
          <Stats>
            <Stat
              label="Ambassador"
              value={nxs(m?.reserves?.ambassador, 2)}
              note="Funds the ambassador DAO"
            />
            <Stat
              label="Developer"
              value={nxs(m?.reserves?.developer, 2)}
              note="Funds the developer DAO"
            />
            <Stat
              label="Hash channel"
              value={nxs(m?.reserves?.hash, 2)}
              note="Waiting to be paid to hash miners"
            />
            <Stat
              label="Prime channel"
              value={nxs(m?.reserves?.prime, 2)}
              note="Waiting to be paid to prime miners"
            />
            <Stat label="Fees" value={nxs(m?.reserves?.fee, 2)} />
          </Stats>
        </Loading>
      </Card>
    </DetailPage>
  );
}
