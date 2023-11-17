import { NODE_NAMES } from '@paraspell/sdk';

export const EXCHANGE_NODES = [
  'HydraDxDex',
  'BasiliskDex',
  'KaruraDex',
  'AcalaDex',
  'MangataDex',
  // 'KintsugiDex',
  // 'InterlayDex',
  // 'BifrostKusamaDex',
  // 'BifrostPolkadotDex',
] as const;

export const NODES_WITH_RELAY_CHAIN = [...NODE_NAMES, 'Polkadot', 'Kusama'] as const;

export const POLKADOT_WS = 'wss://rpc.polkadot.io';
export const KUSAMA_WS = 'wss://kusama-rpc.polkadot.io';
