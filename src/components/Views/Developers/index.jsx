import { useEffect, useState } from 'react';
import { Card, SectionTitle, styles } from 'components/Detail';
import { useNetwork } from 'hooks/useNetwork/useNetwork';

//example values that exist on mainnet
const GENESIS =
  'a196d602105b1d3835f0b5e2a1c10f5f33dda85099b8cbfa2d280042dcbb53e2';
const ACCOUNT = '8CCJqtKbGZGHwy2mRZVY4JAygdcP9eqoxM3qjfRgUUoGV8Z52Hn';
const ASSET = '88WG3u4xAXVk47LSRfPFxs9KQ6a85pYt6iq8V4rwBdUjQDyscxp';
const LEGACY = '2QzqXqL1oAmXidmuYL9Ekakh4YTabSMdAHuhA6TVEo8Qg3keBYL';

/** [path, example, what it answers] */
const ENDPOINTS = [
  [
    '/explorer/status',
    '/explorer/status',
    'Indexed height range and when each cached list was last built.',
  ],
  [
    '/explorer/transactions?limit&transfers&before',
    '/explorer/transactions?limit=5&transfers=1',
    'Newest transactions with their value moves; transfers=1 leaves out mining and staking rewards; next = cursor for before.',
  ],
  [
    '/explorer/address/<address>/transactions?limit&registers&before',
    `/explorer/address/${ASSET}/transactions?registers=1`,
    'Transactions of an account, token, asset or legacy address; registers=1 = only the register’s own history (created, changed, transferred, claimed).',
  ],
  [
    '/explorer/address/<trust address>/rewards',
    '/explorer/address/8FAURTggnTGxudP48EEB8yn87Vafd2VCWSaZyRmEWcnFYavmN9W/rewards',
    'Staking rewards of a trust account per UTC month, and the last 30 days.',
  ],
  [
    '/explorer/legacy/<legacy address>',
    `/explorer/legacy/${LEGACY}`,
    'Received, spent and balance of a pre Tritium address; complete = all legacy inputs are indexed.',
  ],
  [
    '/explorer/owner/<genesis>',
    `/explorer/owner/${GENESIS}`,
    'Everything one signature chain owns: accounts, trust accounts, tokens, assets, names, namespaces, crypto register.',
  ],
  [
    '/explorer/owner/<genesis>/transactions?limit&transfers&before',
    `/explorer/owner/${GENESIS}/transactions?limit=5`,
    'Value moves of all accounts, trust accounts and tokens of one signature chain.',
  ],
  [
    '/explorer/user/<username>',
    '/explorer/user/nirachill',
    'The signature chain of a username, or null.',
  ],
  [
    '/explorer/search?q=<text>',
    '/explorer/search?q=dist',
    'Tokens, global names, namespaces and assets whose name starts with the text.',
  ],
  [
    '/explorer/register/<64 hex>',
    '/explorer/register/d78d7278364f48db5c5aec99df134460bb1839bd2d4876ecb82e65e977797904',
    'Base58 address of a register given in hex, the form the node uses for the owner of a tokenized asset.',
  ],
  [
    '/explorer/cache/<name>',
    '/explorer/cache/richchains',
    'Prepared lists: richlist, trustlist, globalnames, namespaces, tokens, assets, markets, tokenholders, richchains, legacyrich, ledgermetrics, daily.',
  ],
];

/** The explorer's own API: answers built from its index, next to the node API */
export default function Developers() {
  const { network } = useNetwork();
  //examples point at the API this page itself uses, made absolute in the browser
  const [base, setBase] = useState(network.url);
  useEffect(() => {
    setBase(
      network.url.startsWith('http')
        ? network.url
        : `${window.location.origin}${network.url}`
    );
  }, [network.url]);

  return (
    <>
      <Card>
        <SectionTitle>Explorer API</SectionTitle>
        <p>
          Besides the Nexus node API, the explorer answers from its own index:
          questions the node cannot answer quickly or at all, such as who owns
          what, the history of a register or the balance of a legacy address.
          All endpoints are read only, take GET requests and answer JSON as{' '}
          <code>{'{ "result": ... }'}</code>. Example account:{' '}
          <code>{ACCOUNT}</code>.
        </p>
        <p className={styles.muted}>
          Base address on {network.name}: <code>{base}</code>. Without the index
          (e.g. a node without the indexer) these routes answer 503.
        </p>
      </Card>
      <Card>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Answers</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map(([path, example, what]) => (
                <tr key={path}>
                  <td style={{ overflowWrap: 'anywhere', minWidth: '14rem' }}>
                    <code>{path}</code>
                    <div>
                      <a
                        href={`${base}${example}`}
                        target="_blank"
                        rel="noopener noreferrer">
                        example
                      </a>
                    </div>
                  </td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
