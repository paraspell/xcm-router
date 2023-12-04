import { type Extrinsic, type TNode } from '@paraspell/sdk';
import { type Signer } from '@polkadot/types/types';
import { type NODES_WITH_RELAY_CHAIN, type EXCHANGE_NODES } from './consts/consts';

export type TBigNumber = string | number | bigint;

export type TExchangeNode = (typeof EXCHANGE_NODES)[number];

export interface TSwapOptions {
  currencyFrom: string;
  currencyTo: string;
  amount: string;
  slippagePct: string;
  injectorAddress: string;
}

export interface TSwapResult {
  tx: Extrinsic;
  amountOut: string;
}

export type TNodeWithRelayChains = (typeof NODES_WITH_RELAY_CHAIN)[number];

export enum TransactionType {
  TO_EXCHANGE = 'TO_EXCHANGE',
  SWAP = 'SWAP',
  FROM_EXCHANGE = 'FROM_EXCHANGE',
  FULL_TRANSFER = 'FULL_TRANSFER',
}

export interface TTxProgressInfo {
  type: TransactionType;
  hashes?: {
    [TransactionType.TO_EXCHANGE]?: string;
    [TransactionType.SWAP]?: string;
    [TransactionType.FROM_EXCHANGE]?: string;
  };
  status: TransactionStatus;
}

export enum TransactionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
}

export interface TTransferOptions {
  originNode: TNodeWithRelayChains;
  exchangeNode: TExchangeNode;
  destinationNode: TNodeWithRelayChains;
  currencyFrom: string;
  currencyTo: string;
  amount: string;
  injectorAddress: string;
  address: string;
  slippagePct: string;
  signer: Signer;
  type: TransactionType;
  onStatusChange?: (info: TTxProgressInfo) => void;
}

export type TTransferOptionsModified = Omit<TTransferOptions, 'exchangeNode'> & {
  exchangeNode: TNode;
};
