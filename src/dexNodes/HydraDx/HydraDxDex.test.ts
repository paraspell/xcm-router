import { describe, expect, it } from 'vitest';
import { type TSwapOptions } from '../../types';
import HydraDxExchangeNode from './HydraDxDex';
import { calculateTransactionFee } from '../../utils';
import { buildFromExchangeExtrinsic } from '../..';

describe.skip('HydraDx utils', () => {
  // it('should calculate transaction fee correctly', async () => {});

  it('should build a transfer extrinsic without error on HydraDx', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'ASTR',
      currencyTo: 'BNC',
      amount: '38821036538894063687',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new HydraDxExchangeNode('HydraDX');
    const api = await dex.createApiInstance();
    const toDestTx = buildFromExchangeExtrinsic(
      api,
      {
        ...options,
        destinationNode: 'BifrostPolkadot',
        exchangeNode: 'HydraDX',
        originNode: 'Astar',
        address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      } as any,
      '38821036538894063687',
    );
    const toDestTransactionFee = await calculateTransactionFee(toDestTx, options.injectorAddress);
    const tx = await dex.swapCurrency(api, options, toDestTransactionFee);
    expect(tx).toBeDefined();
  });

  it.skip('should build a transfer extrinsic without error on Basilisk', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'KSM',
      currencyTo: 'BSX',
      amount: '1000000000000',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new HydraDxExchangeNode('Basilisk');
    const api = await dex.createApiInstance();
    const toDestTx = buildFromExchangeExtrinsic(
      api,
      {
        ...options,
        destinationNode: 'Karura',
        exchangeNode: 'Basilisk',
        originNode: 'Kusama',
        address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      } as any,
      '220000000000',
    );
    const toDestTransactionFee = await calculateTransactionFee(toDestTx, options.injectorAddress);
    const tx = await dex.swapCurrency(api, options, toDestTransactionFee);
    expect(tx).toBeDefined();
  });
});
