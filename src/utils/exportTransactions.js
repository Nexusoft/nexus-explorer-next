/**
 * CSV export of the explorer index's transactions of an account or signature chain:
 * one line per transaction and ticker, with the net change for the exported addresses
 */
import {
  describeContract,
  isRewardTx,
  moveToContract,
  netForAddresses,
} from './contracts';

//enough for every chain on mainnet, bounds the time a busy one takes
export const EXPORT_MAX = 20000;
const pageSize = 100;

/**
 * All pages of an index transaction list, newest first
 * fetchPage(before, limit) answers {result, next, addresses?}
 */
export async function collectTransactions(fetchPage, onProgress) {
  const txs = [];
  let addresses = null;
  let before;
  for (;;) {
    const res = await fetchPage(before, pageSize);
    addresses = addresses || res.addresses;
    txs.push(...(res.result || []));
    onProgress?.(txs.length);
    if (res.next == null || txs.length >= EXPORT_MAX) {
      return { txs, addresses, complete: res.next == null };
    }
    before = res.next;
  }
}

const cell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function transactionsCsv(txs, addresses) {
  const lines = [
    [
      'date_utc',
      'transaction',
      'what',
      'change',
      'ticker',
      'reward',
      'counterparties',
    ],
  ];
  for (const t of txs) {
    const tx = {
      txid: t.txid,
      type: t.type,
      contracts: t.moves.map((m) => moveToContract(m, t.type)),
    };
    const { nets, counterparties } = netForAddresses(tx, addresses);
    const what = [
      ...new Set(tx.contracts.map((c) => describeContract(c).label)),
    ].join('; ');
    const date = new Date(t.time * 1000).toISOString().replace('.000Z', 'Z');
    const changes = Object.entries(nets);
    //a move between own accounts still gets its line, with no change
    for (const [ticker, net] of changes.length ? changes : [['', 0]]) {
      lines.push([
        date,
        t.txid,
        what,
        //sums of floats, amounts have at most 8 decimals
        Math.round(net * 1e8) / 1e8,
        ticker,
        isRewardTx(tx) ? 'yes' : 'no',
        counterparties.join(' '),
      ]);
    }
  }
  return lines.map((l) => l.map(cell).join(',')).join('\r\n') + '\r\n';
}

export function downloadText(filename, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
