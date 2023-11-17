import { describe, expect, it } from 'vitest';
import { type TTransferOptionsModified } from '../../types';
import HydraDxExchangeNode from './HydraDxDex';
import { MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';

describe('HydraDxDex', () => {
  it('should build a transfer extrinsic without error on HydraDx', async () => {
    const dex = new HydraDxExchangeNode('HydraDX');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'ASTR',
      currencyTo: 'DOT',
      amount: '38821036538894063687',
      destinationNode: 'BifrostPolkadot',
      exchangeNode: 'HydraDX',
      originNode: 'Astar',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should build a transfer extrinsic without error on Basilisk', async () => {
    const dex = new HydraDxExchangeNode('Basilisk');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'KSM',
      currencyTo: 'USDT',
      amount: '1000000000000',
      destinationNode: 'Karura',
      exchangeNode: 'Basilisk',
      originNode: 'Kusama',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });
});
