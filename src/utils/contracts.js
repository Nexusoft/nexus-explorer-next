/**
 * Plain language view of Tritium contracts
 * describeContract turns one contract into { label, from, to, amount, ticker }
 */
import { toTitleCase } from './converter';

const LABELS = {
  COINBASE: 'Mining reward',
  TRUST: 'Staking reward',
  GENESIS: 'First staking reward',
  DEBIT: 'Sent',
  CREDIT: 'Received',
  FEE: 'Fee',
  STAKE: 'Moved to stake',
  UNSTAKE: 'Removed from stake',
  CREATE: 'Created register',
  WRITE: 'Updated register',
  APPEND: 'Updated register',
  TRANSFER: 'Started ownership transfer',
  CLAIM: 'Claimed ownership',
  MIGRATE: 'Migrated legacy balance',
  LEGACY: 'Sent to legacy address',
  AUTHORIZE: 'Authorized',
  CONDITION: 'Condition',
  VALIDATE: 'Validated condition',
};

//a party is { address, name, genesis, type } - whatever the node gave us
function party(p) {
  if (!p) return null;
  if (typeof p === 'string') return { address: p };
  return {
    address: p.address,
    name: p.name,
    type: p.type,
  };
}

export function describeContract(c = {}) {
  const op = c.OP || 'UNKNOWN';
  let label = LABELS[op] || toTitleCase(op.toLowerCase());
  let from = party(c.from);
  let to = party(c.to);

  switch (op) {
    case 'COINBASE':
      to = { genesis: c.genesis };
      break;
    case 'TRUST':
    case 'GENESIS':
    case 'STAKE':
    case 'UNSTAKE':
      to = { address: c.address, name: c.name };
      break;
    case 'CREDIT':
      if (c.for === 'COINBASE') label = 'Mining reward claimed';
      else if (c.for === 'LEGACY') label = 'Received from legacy';
      break;
    case 'FEE':
      from = from || party(c.address && { address: c.address });
      break;
    case 'CREATE':
    case 'WRITE':
    case 'APPEND':
    case 'TRANSFER':
    case 'CLAIM':
      to = party(c.address ? { address: c.address, name: c.name } : null);
      break;
    default:
      break;
  }

  return {
    op,
    label,
    from,
    to,
    amount: typeof c.amount === 'number' ? c.amount : null,
    ticker: c.ticker || (c.token === '0' ? 'NXS' : ''),
    reference: c.reference,
    txid: c.txid,
  };
}

const rewardOps = ['COINBASE', 'TRUST', 'GENESIS'];
const isRewardContract = (c) =>
  rewardOps.includes(c?.OP) || (c?.OP === 'CREDIT' && c?.for === 'COINBASE');

/** Only mining / staking rewards (a fee next to a reward claim still counts as a reward) */
export function isRewardTx(tx) {
  const contracts = tx?.contracts || [];
  return (
    contracts.some(isRewardContract) &&
    contracts.every((c) => isRewardContract(c) || c.OP === 'FEE')
  );
}

/** One line headline for a transaction, e.g. "Sent 9,277.99 NXS" */
export function transactionHeadline(tx, formatAmount) {
  const contracts = tx?.contracts || [];
  if (!contracts.length) return toTitleCase(tx?.type || 'transaction');
  const described = contracts.map(describeContract);
  const labels = [...new Set(described.map((d) => d.label))];
  const ticker = described.find((d) => d.ticker)?.ticker || '';
  const total = described.reduce((s, d) => s + (d.amount || 0), 0);
  const amount = total ? ` ${formatAmount(total)} ${ticker}` : '';
  if (labels.length === 1) {
    return contracts.length > 1
      ? `${labels[0]}${amount} (${contracts.length} contracts)`
      : `${labels[0]}${amount}`;
  }
  return `${contracts.length} contracts${amount}`;
}

/**
 * Net change of `address` in a transaction: + received, - sent
 * Staking rewards count as received
 */
export function netForAddress(tx, address) {
  let net = 0;
  let ticker = '';
  const counterparties = new Set();
  for (const c of tx?.contracts || []) {
    const d = describeContract(c);
    if (d.amount == null) continue;
    ticker = ticker || d.ticker;
    if (d.to?.address === address && d.from?.address !== address) {
      net += d.amount;
      if (d.from?.address) counterparties.add(d.from.address);
    } else if (d.from?.address === address && d.to?.address !== address) {
      net -= d.amount;
      if (d.to?.address) counterparties.add(d.to.address);
    }
  }
  return { net, ticker, counterparties: [...counterparties] };
}
