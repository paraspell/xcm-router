import { describe, expect, it } from 'vitest';
import { type TSwapOptions } from '../../types';
import InterlayExchangeNode from './InterlayDex';

describe.skip('InterlayDex', () => {
  // it('should calculate transaction fee correctly', async () => {});

  it('should build a transfer extrinsic without error', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'DOT',
      currencyTo: 'IBTC',
      amount: '13492595211036653790',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new InterlayExchangeNode('Interlay');
    const api = await dex.createApiInstance();
    const tx = await dex.swapCurrency(api, options);
    expect(tx).toBeDefined();
  });
});
