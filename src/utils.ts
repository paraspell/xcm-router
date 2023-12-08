import { type Extrinsic, getNodeProvider } from '@paraspell/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { type Signer } from '@polkadot/api/types';
import { type TNodeWithRelayChains } from './types';
import { KUSAMA_WS, POLKADOT_WS } from './consts/consts';
import BigNumber from 'bignumber.js';

export const submitTransaction = async (
  api: ApiPromise,
  tx: Extrinsic,
  signer: Signer,
  injectorAddress: string,
): Promise<string> => {
  await tx.signAsync(injectorAddress, { signer });
  return await new Promise((resolve, reject) => {
    void tx.send(({ status, dispatchError, txHash }) => {
      if (status.isFinalized) {
        // Check if there are any dispatch errors
        if (dispatchError !== undefined) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;

            reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else {
          // No dispatch error, transaction should be successful
          resolve(txHash.toString());
        }
      }
    });
  });
};

export const createApiInstance = async (wsUrl: string): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(wsUrl);
  return await ApiPromise.create({ provider: wsProvider });
};

export const createApiInstanceForNode = async (node: TNodeWithRelayChains): Promise<ApiPromise> => {
  const endpoint = getNodeProviderForAll(node);
  return await createApiInstance(endpoint);
};

export const getNodeProviderForAll = (node: TNodeWithRelayChains): string => {
  if (node === 'Polkadot') {
    return POLKADOT_WS;
  } else if (node === 'Kusama') {
    return KUSAMA_WS;
  } else {
    return getNodeProvider(node) ?? '';
  }
};

export const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const calculateTransactionFee = async (
  tx: Extrinsic,
  address: string,
): Promise<BigNumber> => {
  const { partialFee } = await tx.paymentInfo(address);
  return new BigNumber(partialFee.toString());
};
