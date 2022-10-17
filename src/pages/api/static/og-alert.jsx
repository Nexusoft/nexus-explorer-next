import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'experimental-edge',
};

async function fetchTransaction(txid) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_NEXUS_BASE_URL}/ledger/get/transaction?hash=${txid}`
  );
  const resp = await res.json();
  return resp.result;
}

const emojis = {
  blue_whale: '🐳',
  whale: '🐋',
  shark: '🦈',
  dolphin: '🐬',
  tuna: '🐟',
  blowfish: '🐡',
  sardine: '🐠',
  octopus1: '🦑',
  octopus2: '🐙',
  lobster: '🦞',
  crab: '🦀',
  shrimp: '🦐',
};

const fish_map = {
  blue_whale: 'Blue Whale',
  sperm_whale: 'Sperm Whale',
  humpack_whale: 'Humpback Whale',
  whale_shark: 'Whale Shark',
  tiger_shark: 'Tiger Shark',
  blue_white_shark: 'Blue White Shark',
  great_white_shark: 'Great White Shark',
  dolphin: 'Dolphin',
  tuna: 'Tuna',
  sardine: 'Sardine',
  shrimp: 'Shrimp',
};

function getFishnameAndEmoji(amount) {
  // 'get emoji based on amount';
  if (amount >= 500000) {
    return [emojis.blue_whale.repeat(6), fish_map.blue_whale];
  } else if (amount >= 250000) {
    return [emojis.blue_whale.repeat(6), fish_map.sperm_whale];
  } else if (amount >= 100000) {
    return [emojis.whale.repeat(3), fish_map.humpack_whale];
  } else if (amount >= 80000) {
    return [emojis.shark.repeat(6), fish_map.whale_shark];
  } else if (amount >= 60000) {
    return [emojis.shark.repeat(4), fish_map.tiger_shark];
  } else if (amount >= 30000) {
    return [emojis.shark.repeat(2), fish_map.great_white_shark];
  } else if (amount >= 10000) {
    return [emojis.dolphin.repeat(2), fish_map.dolphin];
  } else if (amount >= 5000) {
    return [emojis.tuna.repeat(2), fish_map.tuna];
  } else if (amount >= 1000) {
    return [emojis.sardine.repeat(2), fish_map.sardine];
  } else {
    return [emojis.shrimp.repeat(2), fish_map.shrimp];
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const txid = searchParams.get('txid') ?? '';
  const cid = searchParams.get('cid') ?? 0; // contract id

  // ledger/get/transaction
  const resp = await fetchTransaction(txid);
  const contract = resp.contracts[cid];

  const [fishEmoji, fishName] = getFishnameAndEmoji(contract.amount);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'hsla(202, 97%, 52%, 1)',
        }}>
        <div
          style={{
            display: 'flex',
            background: 'hsla(200, 10%, 12%, 1)',
          }}>
          <div
            style={{
              display: 'flex',
              padding: '2rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '3rem',
              paddingBottom: '3rem',
              flexDirection: 'column',
              color: '#fff',
              justifyContent: 'space-between',
              width: '100%',
            }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <p>{fishEmoji}</p>
              <p>{fishName}</p>
            </div>
            <pre>{JSON.stringify(contract, null, 2)}</pre>
          </div>
        </div>
      </div>
    )
  );
}
