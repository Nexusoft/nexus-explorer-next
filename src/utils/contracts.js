/**
 * Plain language view of Tritium contracts
 * describeContract turns one contract into { label, from, to, amount, ticker }
 */
import { toTitleCase } from './converter';

//pre Tritium reward transactions, by the node's transaction type
export const LEGACY_REWARDS = {
  'legacy base': 'Mining reward',
  'legacy trust': 'Staking reward',
  'legacy genesis': 'First staking reward',
};

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
  ...LEGACY_REWARDS,
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
    case 'DEBIT':
      //NXS or another token sent to a token pays every holder of it, each claims a share
      if (isBurn(c)) label = 'Burned';
      else if (c.to?.type === 'TOKEN') {
        label =
          c.token === c.to.address
            ? 'Sent back to the token'
            : 'Paid to token holders';
      } else if (c.exchange) label = 'Sent, anyone may claim';
      break;
    case 'CREDIT':
      if (c.for === 'COINBASE') label = 'Mining reward claimed';
      else if (c.for === 'LEGACY') label = 'Received from legacy';
      else if (c.proof) {
        //share of a payment to token holders, proven by holding the token
        label = 'Holder share claimed';
        from = party(c.proof.account);
      }
      //void, also a cancelled market order or invoice: credit back to the sender
      else if (from?.address && from.address === to?.address) {
        label = 'Returned to sender';
      }
      break;
    case 'FEE':
      from = from || party(c.address && { address: c.address });
      break;
    case 'CREATE':
    case 'WRITE':
    case 'APPEND':
    case 'TRANSFER':
    case 'CLAIM':
      //tokenizing = forced transfer to a token, done without a claim
      if (op === 'TRANSFER' && c.tokenized) label = 'Tokenized';
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
    claim: claimStatus(c),
    conditions: isBurn(c) ? null : c.conditions,
    conditionWords: conditionInWords(c.conditions),
    holderShare: c.proof?.ownership,
    holderTicker: c.proof?.ticker,
  };
}

function duration(seconds) {
  const units = [
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, name] of units) {
    if (seconds >= size && seconds % size === 0) {
      const n = seconds / size;
      return `${n} ${name}${n === 1 ? '' : 's'}`;
    }
  }
  return `${seconds} seconds`;
}

const shortGenesis = (g) => `${g.substring(0, 6)}...${g.slice(-4)}`;

/**
 * Plain words for the usual contract conditions (who may claim, time limits),
 * null when the condition uses anything else
 */
export function conditionInWords(code) {
  if (typeof code !== 'string' || !/caller\.|contract\./.test(code)) {
    return null;
  }
  const words = code
    .replace(
      /caller\.genesis (==|!=) 0x([0-9a-f]{64})/gi,
      (m, op, g) =>
        `the claimer is ${op === '!=' ? 'not ' : ''}${shortGenesis(g)}`
    )
    .replace(
      /contract\.timestamp \+ (\d+) (>|<) caller\.timestamp/g,
      (m, s, op) =>
        op === '>'
          ? `claimed within ${duration(Number(s))} of sending`
          : `claimed more than ${duration(Number(s))} after sending`
    )
    .replace(/ AND /g, ' and ')
    .replace(/ OR /g, ' or ');
  return /caller\.|contract\.|0x/.test(words) ? null : words;
}

//finance/burn: a debit whose condition can never be true
const isBurn = (c) => c.OP === 'DEBIT' && c.conditions?.trim() === '4 == 2';

/** How much of a debit the recipient took: {text, tone} or null */
export function claimStatus(c) {
  if (isBurn(c)) return { text: 'Can never be claimed', tone: 'warn' };
  if (c.OP !== 'DEBIT' || typeof c.claimed !== 'number') return null;
  const amount = typeof c.amount === 'number' ? c.amount : 0;
  if (amount > 0 && c.claimed >= amount) {
    return { text: 'Fully claimed', tone: 'good' };
  }
  if (c.claimed > 0) {
    return {
      text: `${Math.round((c.claimed / amount) * 100)}% claimed so far`,
      tone: 'warn',
    };
  }
  return { text: 'Not claimed yet', tone: 'warn' };
}

const rewardOps = ['COINBASE', 'TRUST', 'GENESIS'];
const isRewardContract = (c) =>
  rewardOps.includes(c?.OP) || (c?.OP === 'CREDIT' && c?.for === 'COINBASE');

/** Only mining / staking rewards (a fee next to a reward claim still counts as a reward) */
export function isRewardTx(tx) {
  if (LEGACY_REWARDS[tx?.type]) return true;
  const contracts = tx?.contracts || [];
  return (
    contracts.some(isRewardContract) &&
    contracts.every((c) => isRewardContract(c) || c.OP === 'FEE')
  );
}

/** One line headline for a transaction, e.g. "Sent 9,277.99 NXS" */
export function transactionHeadline(tx, formatAmount) {
  const contracts = tx?.contracts || [];
  if (!contracts.length) {
    return LEGACY_REWARDS[tx?.type] || toTitleCase(tx?.type || 'transaction');
  }
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
export function moveToContract(m, txType) {
  const to = { address: m.to_addr, name: m.to_name };
  return {
    //an output of a legacy reward transaction is the reward itself
    OP: m.op === 'LEGACY' && LEGACY_REWARDS[txType] ? txType : m.op,
    amount: m.amount,
    ticker: m.ticker,
    from: m.from_addr ? { address: m.from_addr, name: m.from_name } : null,
    to: m.to_addr ? to : null,
    genesis: m.op === 'COINBASE' ? m.to_addr : undefined,
    address: m.to_addr,
    name: m.to_name,
  };
}
