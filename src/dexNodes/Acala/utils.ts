import { ApiPromise, WsProvider } from '@polkadot/api';
import { options } from '@acala-network/api';
import { getNodeProvider } from '@paraspell/sdk';

export const createAcalaApiInstance = async (): Promise<ApiPromise> => {
  const provider = new WsProvider(getNodeProvider('Acala'), 100);
  const api = new ApiPromise(
    options({
      provider,
    }),
  );
  await api.isReady;
  return api;
};
