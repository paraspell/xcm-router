import { Builder, type Extrinsic, InvalidCurrencyError } from '@paraspell/sdk';
import {
  TransactionType,
  type TTransferOptionsModified,
  type TNodeWithRelayChains,
  type TTransferOptions,
  type TTxProgressInfo,
  TransactionStatus,
} from './types';
import createDexNodeInstance from './dexNodes/DexNodeFactory';
import { createApiInstanceForNode, delay, submitTransaction } from './utils';
import { type ApiPromise } from '@polkadot/api';
import type ExchangeNode from './dexNodes/DexNode';

const maybeUpdateStatus = (
  onStatusChange: ((info: TTxProgressInfo) => void) | undefined,
  info: TTxProgressInfo,
): void => {
  if (onStatusChange !== undefined) {
    onStatusChange(info);
  }
};

export const transfer = async (options: TTransferOptions): Promise<void> => {
  const exchangeNode = createDexNodeInstance(options.exchangeNode);
  const modifiedOptions: TTransferOptionsModified = { ...options, exchangeNode: exchangeNode.node };
  console.log('Executing transfer');

  const { onStatusChange, originNode } = modifiedOptions;

  if (options.type === TransactionType.TO_EXCHANGE) {
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const originApi = await createApiInstanceForNode(originNode);
    const txHash = await transferToExchange(originApi, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      hashes: { [TransactionType.TO_EXCHANGE]: txHash },
      status: TransactionStatus.SUCCESS,
    });
  } else if (options.type === TransactionType.SWAP) {
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.SWAP,
      status: TransactionStatus.IN_PROGRESS,
    });
    const swapApi = await exchangeNode.createApiInstance();
    const { txHash } = await swap(swapApi, exchangeNode, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.SWAP,
      hashes: { [TransactionType.SWAP]: txHash },
      status: TransactionStatus.SUCCESS,
    });
  } else if (options.type === TransactionType.FROM_EXCHANGE) {
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const swapApi = await exchangeNode.createApiInstance();
    const txHash = await transferToDestination(swapApi, modifiedOptions, modifiedOptions.amount);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      hashes: { [TransactionType.FROM_EXCHANGE]: txHash },
      status: TransactionStatus.SUCCESS,
    });
  } else {
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const originApi = await createApiInstanceForNode(originNode);
    const txHashToExchange = await transferToExchange(originApi, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      hashes: { [TransactionType.TO_EXCHANGE]: txHashToExchange },
      status: TransactionStatus.SUCCESS,
    });
    await delay(1000);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.SWAP,
      hashes: { [TransactionType.TO_EXCHANGE]: txHashToExchange },
      status: TransactionStatus.IN_PROGRESS,
    });
    const swapApi = await exchangeNode.createApiInstance();
    const { amountOut, txHash: txHashSwap } = await swap(swapApi, exchangeNode, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.SWAP,
      hashes: {
        [TransactionType.TO_EXCHANGE]: txHashToExchange,
        [TransactionType.SWAP]: txHashSwap,
      },
      status: TransactionStatus.SUCCESS,
    });
    await delay(1000);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      hashes: {
        [TransactionType.TO_EXCHANGE]: txHashToExchange,
        [TransactionType.SWAP]: txHashSwap,
      },
      status: TransactionStatus.IN_PROGRESS,
    });
    const txHashToDest = await transferToDestination(swapApi, modifiedOptions, amountOut);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      hashes: {
        [TransactionType.TO_EXCHANGE]: txHashToExchange,
        [TransactionType.SWAP]: txHashSwap,
        [TransactionType.FROM_EXCHANGE]: txHashToDest,
      },
      status: TransactionStatus.SUCCESS,
    });
  }
};

const validateCurrency = (originNode: TNodeWithRelayChains, currency: string): void => {
  if (
    (originNode === 'Polkadot' && currency !== 'DOT') ||
    (originNode === 'Kusama' && currency !== 'KSM')
  ) {
    throw new InvalidCurrencyError(`Invalid currency for ${originNode}`);
  }
};

const buildToExchangeExtrinsic = (
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

const buildFromExchangeExtrinsic = (
  api: ApiPromise,
  { destinationNode, exchangeNode, currencyTo, address }: TTransferOptionsModified,
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
): Promise<{ amountOut: string; txHash: string }> => {
  const { signer, injectorAddress } = options;
  const { tx, amountOut } = await exchangeNode.swapCurrency(api, options);
  const txHash = await submitTransaction(api, tx, signer, injectorAddress);
  return { amountOut, txHash };
};

export const transferToExchange = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
): Promise<string> => {
  console.log('Transfering to exchange chain');
  const { originNode, currencyFrom, signer, injectorAddress } = options;
  validateCurrency(originNode, currencyFrom);
  const tx = buildToExchangeExtrinsic(api, options);
  return await submitTransaction(api, tx, signer, injectorAddress);
};

export const transferToDestination = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
  amountOut: string,
): Promise<string> => {
  console.log('transfering to destination chain');
  const { destinationNode, currencyTo, signer, injectorAddress } = options;
  validateCurrency(destinationNode, currencyTo);
  const tx = buildFromExchangeExtrinsic(api, options, amountOut);
  return await submitTransaction(api, tx, signer, injectorAddress);
};

export * from './types';
export * from './consts/consts';
