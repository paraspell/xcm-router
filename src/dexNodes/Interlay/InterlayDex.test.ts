import { describe, expect, it } from 'vitest';
import { type TTransferOptionsModified } from '../../types';
import InterlayExchangeNode from './InterlayDex';
import { MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';

describe('InterlayDex', () => {
  it('should build a transfer extrinsic without error', async () => {
    const dex = new InterlayExchangeNode('Interlay');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'DOT',
      currencyTo: 'INTR',
      amount: '5000000000',
      destinationNode: 'Acala',
      exchangeNode: 'Interlay',
      originNode: 'Polkadot',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should build a transfer extrinsic without error on kintsugi', async () => {
    const dex = new InterlayExchangeNode('Kintsugi');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'KSM',
      currencyTo: 'KINT',
      amount: '5000000000',
      destinationNode: 'Karura',
      exchangeNode: 'Kintsugi',
      originNode: 'Kusama',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });
});
