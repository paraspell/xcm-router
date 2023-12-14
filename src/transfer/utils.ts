import { type Extrinsic, Builder } from '@paraspell/sdk';
import { type ApiPromise } from '@polkadot/api';
import type BigNumber from 'bignumber.js';
import type ExchangeNode from '../dexNodes/DexNode';
import { type TTransferOptionsModified } from '../types';
import { validateRelayChainCurrency } from '../utils/utils';
import { submitTransaction } from '../utils/submitTransaction';

export const buildToExchangeExtrinsic = (
  api: ApiPromise,
  { originNode, exchangeNode, currencyFrom, amount, injectorAddress }: TTransferOptionsModified,
): Extrinsic => {
  const builder = Builder(api);
  if (originNode === 'Polkadot' || originNode === 'Kusama') {
    return builder.to(exchangeNode).amount(amount).address(injectorAddress).build();
  }
  return builder
    .from(originNode)
    .to(exchangeNode)
    .currency(currencyFrom)
    .amount(amount)
    .address(injectorAddress)
    .build();
};

export const buildFromExchangeExtrinsic = (
  api: ApiPromise,
  {
    destinationNode,
    exchangeNode,
    currencyTo,
    recipientAddress: address,
  }: TTransferOptionsModified,
  amountOut: string,
): Extrinsic => {
  const builder = Builder(api);
  if (destinationNode === 'Polkadot' || destinationNode === 'Kusama') {
    return builder.from(exchangeNode).amount(amountOut).address(address).build();
  }
  return builder
    .from(exchangeNode)
    .to(destinationNode)
    .currency(currencyTo)
    .amount(amountOut)
    .address(address)
    .build();
};

export const swap = async (
  api: ApiPromise,
  exchangeNode: ExchangeNode,
  options: TTransferOptionsModified,
  toDestTransactionFee: BigNumber,
  toExchangeTransactionFee: BigNumber,
): Promise<{ amountOut: string; txHash: string }> => {
  const { signer, injectorAddress } = options;
  const { tx, amountOut } = await exchangeNode.swapCurrency(
    api,
    options,
    toDestTransactionFee,
    toExchangeTransactionFee,
  );
  const txHash = await submitTransaction(api, tx, signer, injectorAddress);
  return { amountOut, txHash };
};

export const transferToExchange = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
): Promise<string> => {
  const { originNode, currencyFrom, signer, injectorAddress } = options;
  validateRelayChainCurrency(originNode, currencyFrom);
  const tx = buildToExchangeExtrinsic(api, options);
  return await submitTransaction(api, tx, signer, injectorAddress);
};

export const transferToDestination = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
  amountOut: string,
): Promise<string> => {
  const { destinationNode, currencyTo, signer, injectorAddress } = options;
  validateRelayChainCurrency(destinationNode, currencyTo);
  const tx = buildFromExchangeExtrinsic(api, options, amountOut);
  return await submitTransaction(api, tx, signer, injectorAddress);
};
