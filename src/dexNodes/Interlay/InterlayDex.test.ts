import { describe, expect, it } from 'vitest';
import { type TSwapOptions } from '../../types';
import InterlayExchangeNode from './InterlayDex';

describe('InterlayDex', () => {
  // it('should calculate transaction fee correctly', async () => {});

  it('should build a transfer extrinsic without error', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'DOT',
      currencyTo: 'USDT',
      amount: '1000000000',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new InterlayExchangeNode('Interlay');
    const api = await dex.createApiInstance();
    const tx = await dex.swapCurrency(api, options);
    expect(tx).toBeDefined();
  });
});
