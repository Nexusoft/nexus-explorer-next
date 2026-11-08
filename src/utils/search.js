/**
 * Classifies what a user typed into the search box
 * Returns the kind of lookup, or null when the input matches no known format
 */
export const SEARCH_KINDS = {
  BLOCK_HEIGHT: 'blockHeight',
  BLOCK_HASH: 'blockHash',
  TRANSACTION: 'transaction',
  ADDRESS: 'address',
  NAME: 'name',
  TRUST_NAME: 'trustName',
  INVOICE: 'invoice',
  GENESIS: 'genesis',
};

const base58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
const hex = /^[0-9a-fA-F]+$/;
//names like user:account or user:trust, letters digits . _ - only
const name = /^[^\s:/?#]+:[^\s:/?#]+$/;

export function classifySearch(input) {
  const q = (input ?? '').toString().trim();
  if (!q) return null;

  if (/^\d+$/.test(q)) {
    //heights fit in 32 bits
    return Number(q) <= 4294967295 ? SEARCH_KINDS.BLOCK_HEIGHT : null;
  }
  if (q.startsWith('invoice-') && base58.test(q.substring(8))) {
    return SEARCH_KINDS.INVOICE;
  }
  if (hex.test(q) && q.length === 64) return SEARCH_KINDS.GENESIS;
  if (hex.test(q) && q.length === 128) return SEARCH_KINDS.TRANSACTION;
  if (hex.test(q) && q.length === 256) return SEARCH_KINDS.BLOCK_HASH;
  if (base58.test(q) && q.length === 51) return SEARCH_KINDS.ADDRESS;
  if (name.test(q)) {
    return q.endsWith(':trust') ? SEARCH_KINDS.TRUST_NAME : SEARCH_KINDS.NAME;
  }
  return null;
}

/** Link to a signature chain page, or undefined when the value is not a genesis */
export const genesisHref = (value) =>
  classifySearch(value) === SEARCH_KINDS.GENESIS ? `/scan/${value}` : undefined;

/** Accepted search formats, shown when nothing matched */
export const SEARCH_HELP = [
  ['Block height', '6930058'],
  ['Block hash', '256 hex characters'],
  ['Transaction id', '128 hex characters'],
  ['Signature chain (owner)', '64 hex characters'],
  ['Address', '51 characters, e.g. 8BZcAo489savefJH...'],
  ['Account or trust name', 'username:default, username:trust'],
  ['Token, global name, namespace or asset', 'its name or the start of it'],
];
