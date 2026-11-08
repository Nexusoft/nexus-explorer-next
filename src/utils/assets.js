/** Asset register formats as the node names them, with a readable label */
export const ASSET_FORMATS = {
  OBJECT: 'Object',
  RAW: 'Raw data',
  READONLY: 'Read-only',
};

/** True for an asset register from register/get/any */
export const isAsset = (data) =>
  data?.form === 'ASSET' || Object.keys(ASSET_FORMATS).includes(data?.type);
