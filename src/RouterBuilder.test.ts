/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { describe, expect, it, vi, beforeEach, type MockInstance } from 'vitest';
import * as index from './index';
import RouterBuilder from './RouterBuilder';
import { type Signer } from '@polkadot/api/types';

export const transferParams: index.TTransferOptions = {
  originNode: 'Polkadot',
  exchangeNode: 'HydraDxDex',
  destinationNode: 'Astar',
  currencyFrom: 'DOT',
  currencyTo: 'ASTR',
  amount: '1000000000',
  injectorAddress: '',
  recipientAddress: 'YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg',
  signer: {} as Signer,
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

describe('Builder', () => {
  let spy: MockInstance;

  beforeEach(() => {
    spy = vi.spyOn(index, 'transfer').mockImplementation(async () => undefined);
  });

  it('should construct a transfer using RouterBuilder', async () => {
    await RouterBuilder()
      .from(originNode)
      .exchange(exchangeNode)
      .to(destinationNode)
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

  it('should construct a transfer using RouterBuilder with onStatusChange', async () => {
    const onStatusChange = vi.fn();

    await RouterBuilder()
      .from(originNode)
      .exchange(exchangeNode)
      .to(destinationNode)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .build();

    expect(spy).toHaveBeenCalledWith({ ...transferParams, onStatusChange });
  });

  it('should fail to construct a transfer using RouterBuilder when missing some params', async () => {
    await expect(async () => {
      await RouterBuilder()
        .from(originNode)
        .exchange(exchangeNode)
        .to(destinationNode)
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
