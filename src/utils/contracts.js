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
 * Net change per ticker of a set of addresses in a transaction: + received, - sent
 * Moves between two addresses of the set cancel out; staking rewards count as received
 * An incoming DEBIT counts once its CREDIT is made, an outgoing one when it is sent
 */
export function netForAddresses(tx, addresses) {
  const nets = {};
  const counterparties = new Set();
  for (const c of tx?.contracts || []) {
    const d = describeContract(c);
    if (d.amount == null) continue;
    const toMine = addresses.has(d.to?.address);
    const fromMine = addresses.has(d.from?.address);
    if (toMine === fromMine) continue;
    const other = toMine ? d.from?.address : d.to?.address;
    if (other) counterparties.add(other);
    //a payment is a DEBIT by the sender, then a CREDIT by the receiver that names
    //the sender again: the sender loses on the DEBIT, the receiver gains on the CREDIT
    if ((d.op === 'DEBIT' && toMine) || (d.op === 'CREDIT' && fromMine)) {
      continue;
    }
    nets[d.ticker] = (nets[d.ticker] || 0) + (toMine ? d.amount : -d.amount);
  }
  return { nets, counterparties: [...counterparties] };
}

/** Net change of one address in a transaction, in the ticker that moved */
export function netForAddress(tx, address) {
  const { nets, counterparties } = netForAddresses(tx, new Set([address]));
  const moved = Object.entries(nets);
  const [ticker, net] = moved.find(([, n]) => n !== 0) || moved[0] || ['', 0];
  return { net, ticker, counterparties };
}

/** Indexer move row back into the contract shape describeContract reads */
export function moveToContract(m) {
  const to = { address: m.to_addr, name: m.to_name };
  return {
    OP: m.op,
    amount: m.amount,
    ticker: m.ticker,
    from: m.from_addr ? { address: m.from_addr, name: m.from_name } : null,
    to: m.to_addr ? to : null,
    genesis: m.op === 'COINBASE' ? m.to_addr : undefined,
    address: m.to_addr,
    name: m.to_name,
  };
}
