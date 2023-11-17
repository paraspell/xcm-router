import { describe, expect, it } from 'vitest';
import AcalaExchangeNode from './AcalaDex';
import { type TTransferOptionsModified } from '../../types';
import { MOCK_ADDRESS, MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';

describe('AcalaDex', () => {
  it('should build a transfer extrinsic without error on Acala', async () => {
    const dex = new AcalaExchangeNode('Acala');
    const transferOptions: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'DOT',
      currencyTo: 'ACA',
      amount: '5000000000',
      destinationNode: 'Astar',
      exchangeNode: 'Acala',
      originNode: 'Polkadot',
      recipientAddress: MOCK_ADDRESS,
    };
    const tx = await performSwap(transferOptions, dex);
    expect(tx).toBeDefined();
  });

  it('should build a transfer extrinsic without error on Karura', async () => {
    const dex = new AcalaExchangeNode('Karura');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'KSM',
      currencyTo: 'KAR',
      amount: '22000000000000',
      destinationNode: 'Robonomics',
      exchangeNode: 'Karura',
      originNode: 'Kusama',
      recipientAddress: MOCK_ADDRESS,
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });
});
