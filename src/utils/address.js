/**
 * Register owners as the node gives them: 64 hex characters whose first byte tells
 * a signature chain (a0-bf), a register that owns it (d1-da, a token after
 * tokenizing) or 00 = in transfer, not claimed yet
 */

const base58Chars =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const isHex64 = (v) => typeof v === 'string' && /^[0-9a-fA-F]{64}$/.test(v);

//register type bytes, TAO/Register/types/address.h
const REGISTER_TYPES = {
  0xd1: 'read-only register',
  0xd2: 'append register',
  0xd3: 'raw register',
  0xd4: 'asset',
  0xd5: 'crypto register',
  0xd6: 'account',
  0xd7: 'token',
  0xd8: 'trust account',
  0xd9: 'name',
  0xda: 'namespace',
};

const typeByte = (hex) => parseInt(hex.substring(0, 2), 16);

/** 64 hex of a register owned by another register (e.g. a token), see ownerInfo */
export const isRegisterId = (v) => isHex64(v) && !!REGISTER_TYPES[typeByte(v)];

/**
 * 64 hex form of a base58 register address, as the node prints the owner of a
 * tokenized register: the 32 address bytes with their 4 byte words reversed
 */
export function registerIdFromAddress(address) {
  if (typeof address !== 'string' || address.length !== 51) return null;
  let n = BigInt(0);
  const base = BigInt(58);
  for (const ch of address) {
    const i = base58Chars.indexOf(ch);
    if (i < 0) return null;
    n = n * base + BigInt(i);
  }
  //type byte + 32 bytes + 4 byte checksum
  const hex = n.toString(16).padStart(74, '0');
  const words = hex.substring(2, 66).match(/.{8}/g);
  return words.reverse().join('');
}

/** What owns a register: {kind: 'genesis'|'register'|'transfer'|'unknown', href, what} */
export function ownerInfo(owner) {
  if (!isHex64(owner)) return { kind: 'unknown' };
  const type = typeByte(owner);
  if (type >= 0xa0 && type <= 0xbf) {
    return { kind: 'genesis', href: `/scan/${owner.toLowerCase()}` };
  }
  if (type === 0) return { kind: 'transfer' };
  if (REGISTER_TYPES[type]) {
    //the scan page finds the register's address in the explorer index
    return {
      kind: 'register',
      href: `/scan/${owner.toLowerCase()}`,
      what: REGISTER_TYPES[type],
    };
  }
  return { kind: 'unknown' };
}
