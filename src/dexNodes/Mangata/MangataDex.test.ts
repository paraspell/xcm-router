import { describe, expect, it } from 'vitest';
import { type TSwapOptions } from '../../types';
import MangataExchangeNode from './MangataDex';

describe('Mangata DEX', () => {
  // it('should calculate transaction fee correctly', async () => {});

  it('should build a transfer extrinsic without error', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'KSM',
      currencyTo: 'MGX',
      amount: '13492595211036653790',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new MangataExchangeNode();
    const api = await dex.createApiInstance();
    const tx = await dex.swapCurrency(api, options);
    expect(tx).toBeDefined();
  });
});
