import { describe, expect, it, vi } from 'vitest';
import * as index from './index';
import RouterBuilder from './RouterBuilder';

describe('Builder', () => {
  const transferParams: index.TTransferOptions = {
    originNode: 'Polkadot',
    exchangeNode: 'HydraDxDex',
    destinationNode: 'Astar',
    currencyFrom: 'DOT',
    currencyTo: 'ASTR',
    amount: '1000000000',
    injectorAddress: '',
    recipientAddress: 'YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg',
    signer: {} as any,
    slippagePct: '1',
    type: index.TransactionType.FULL_TRANSFER,
  };

  const {
    originNode,
    exchangeNode,
    destinationNode,
    currencyFrom,
    currencyTo,
    amount,
    injectorAddress,
    recipientAddress,
    signer,
    slippagePct,
  } = transferParams;

  it('should construct a transfer using RouterBuilder', async () => {
    const spy = vi.spyOn(index, 'transfer').mockImplementation(() => {
      return undefined as any;
    });

    await RouterBuilder()
      .originNode(originNode)
      .exchangeNode(exchangeNode)
      .destinationNode(destinationNode)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .build();

    expect(spy).toHaveBeenCalledWith(transferParams);
  });

  it('should fail to construct a transfer using RouterBuilder when missing some params', async () => {
    vi.spyOn(index, 'transfer').mockImplementation(() => {
      return undefined as any;
    });

    await expect(async () => {
      await RouterBuilder()
        .originNode(originNode)
        .exchangeNode(exchangeNode)
        .destinationNode(destinationNode)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .amount(amount)
        .injectorAddress(injectorAddress)
        .recipientAddress(recipientAddress)
        .signer(signer)
        .build();
    }).rejects.toThrowError();
  });
});
