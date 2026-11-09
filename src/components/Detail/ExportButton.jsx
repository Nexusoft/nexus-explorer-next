import { useState } from 'react';
import { styles } from '.';
import { formatInt } from 'utils/format';
import {
  collectTransactions,
  downloadText,
  EXPORT_MAX,
  transactionsCsv,
} from 'utils/exportTransactions';

/**
 * Downloads every index transaction of an account or signature chain as CSV
 * fetchPage(before, limit) = one index page; addresses = Set counted as own, or
 * null to take the addresses the index answers with
 */
export default function ExportButton({ fetchPage, addresses, filename }) {
  const [state, setState] = useState({ busy: false, count: 0, note: null });

  async function run() {
    setState({ busy: true, count: 0, note: null });
    try {
      const res = await collectTransactions(fetchPage, (count) =>
        setState((s) => ({ ...s, count }))
      );
      const own = addresses || new Set(res.addresses || []);
      downloadText(filename, transactionsCsv(res.txs, own));
      setState({
        busy: false,
        count: res.txs.length,
        note: res.complete
          ? `${formatInt(res.txs.length)} transactions saved`
          : `First ${formatInt(EXPORT_MAX)} transactions saved, the newest`,
      });
    } catch (e) {
      setState({
        busy: false,
        count: 0,
        note: 'Export needs the explorer index, which did not answer',
      });
    }
  }

  return (
    <div className={styles.exportRow}>
      <button
        type="button"
        className={styles.navButton}
        aria-disabled={state.busy}
        onClick={() => !state.busy && run()}>
        {state.busy
          ? `Collecting ${formatInt(state.count)}...`
          : 'Download CSV'}
      </button>
      <span className={styles.muted}>
        {state.note || 'every transaction, rewards included'}
      </span>
    </div>
  );
}
