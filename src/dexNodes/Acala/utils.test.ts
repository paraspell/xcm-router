import { describe, expect, it } from 'vitest';
import AcalaExchangeNode from './AcalaDex';
import { type TSwapOptions } from '../../types';

describe('Acala utils', () => {
  // it('should calculate transaction fee correctly', async () => {});

  it('should build a transfer extrinsic without error on Acala', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'IBTC',
      currencyTo: 'ACA',
      amount: '220000000000',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new AcalaExchangeNode('Acala');
    const api = await dex.createApiInstance();
    const tx = await dex.swapCurrency(api, options);
    expect(tx).toBeDefined();
  });

  it.skip('should build a transfer extrinsic without error on Karura', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'KSM',
      currencyTo: 'KAR',
      amount: '22000000000000',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new AcalaExchangeNode('Karura');
    const api = await dex.createApiInstance();
    const tx = await dex.swapCurrency(api, options);
    expect(tx).toBeDefined();
  });
});
