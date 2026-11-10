/** Asset register formats as the indexer names them, with a readable label */
export const ASSET_FORMATS = {
  OBJECT: 'Object',
  RAW: 'Raw data',
  READONLY: 'Read-only',
  SUPPLY: 'Supply item',
};

/** True for an asset or supply item from register/get/any */
export const isAsset = (data) =>
  data?.form === 'ASSET' ||
  data?.form === 'SUPPLY' ||
  ['OBJECT', 'RAW', 'READONLY'].includes(data?.type);

/** Format label of a register from register/get/any */
export function assetFormat(data) {
  if (data?.form === 'SUPPLY') return ASSET_FORMATS.SUPPLY;
  return ASSET_FORMATS[data?.type] || ASSET_FORMATS.OBJECT;
}
