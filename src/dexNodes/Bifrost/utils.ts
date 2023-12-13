/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { type Token, type Currency, Amount, type Type } from '@crypto-dex-sdk/currency';
import {
  PAIR_ADDRESSES,
  addressToNodeCurrency,
  isNativeCurrency,
} from '@crypto-dex-sdk/parachains-bifrost/libs';
import { type ApiPromise } from '@polkadot/api';
import { type QueryableStorageEntry } from '@polkadot/api/types';
import { type OrmlTokensAccountData } from '@zenlink-types/bifrost/interfaces';
import type { FrameSystemAccountInfo } from '@polkadot/types/lookup';
import { Pair } from '@crypto-dex-sdk/amm';
import { ParachainId } from '@crypto-dex-sdk/chain';
import { type PairPrimitivesAssetId } from '@crypto-dex-sdk/parachains-bifrost';
import { addressToZenlinkAssetId } from '@crypto-dex-sdk/format';
import { fetchCallMulti } from './useCallMulti';

interface UsePairsReturn {
  data: Array<[PairState, Pair | null]>;
}

export function getPairs(
  chainId: number | undefined,
  currencies: Array<[Currency | undefined, Currency | undefined]>,
) {
  return currencies
    .filter((currencies): currencies is [Type, Type] => {
      const [currencyA, currencyB] = currencies;
      return Boolean(
        chainId &&
          (chainId === ParachainId.BIFROST_KUSAMA || chainId === ParachainId.BIFROST_POLKADOT) &&
          currencyA &&
          currencyB &&
          currencyA.chainId === currencyB.chainId &&
          chainId === currencyA.chainId &&
          !currencyA.wrapped.equals(currencyB.wrapped),
      );
    })
    .reduce<[Token[], Token[], PairPrimitivesAssetId[]]>(
      (acc, [currencyA, currencyB]) => {
        const [token0, token1] = currencyA.wrapped.sortsBefore(currencyB.wrapped)
          ? [currencyA.wrapped, currencyB.wrapped]
          : [currencyB.wrapped, currencyA.wrapped];

        acc[0].push(token0);
        acc[1].push(token1);
        acc[2].push([
          addressToZenlinkAssetId(token0.address),
          addressToZenlinkAssetId(token1.address),
        ]);
        return acc;
      },
      [[], [], []],
    );
}

export function uniqePairKey(tokenA: Token, tokenB: Token): string {
  return `${tokenA.address}-${tokenB.address}`;
}

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export async function fetchPairs(
  api: ApiPromise,
  chainId: number | undefined,
  currencies: Array<[Currency | undefined, Currency | undefined]>,
): Promise<UsePairsReturn> {
  const [tokensA, tokensB] = getPairs(chainId, currencies);

  const [validTokensA, validTokensB, reservesCalls] = tokensA.reduce<
    [Token[], Token[], Array<[QueryableStorageEntry<'promise'>, ...unknown[]]>]
  >(
    (acc, tokenA, i) => {
      const tokenB = tokensB[i];
      const pairKey = uniqePairKey(tokenA, tokenB);
      const pairAccount = PAIR_ADDRESSES[pairKey]?.account;
      if (pairAccount && api) {
        acc[0].push(tokenA);
        acc[1].push(tokenB);
        if (isNativeCurrency(tokenA)) acc[2].push([api.query.system.account, pairAccount]);
        else
          acc[2].push([
            api.query.tokens.accounts,
            [pairAccount, addressToNodeCurrency(tokenA.address)],
          ]);

        if (isNativeCurrency(tokenB)) acc[2].push([api.query.system.account, pairAccount]);
        else
          acc[2].push([
            api.query.tokens.accounts,
            [pairAccount, addressToNodeCurrency(tokenB.address)],
          ]);
      }
      return acc;
    },
    [[], [], []],
  );

  // const reserves = useCallMulti<Array<OrmlTokensAccountData | FrameSystemAccountInfo>>({
  //   chainId,
  //   calls: reservesCalls,
  //   options: { defaultValue: [], enabled },
  // });

  const reserves = await fetchCallMulti<Array<OrmlTokensAccountData | FrameSystemAccountInfo>>({
    api,
    calls: reservesCalls,
    options: { defaultValue: [] },
  });

  if (reservesCalls.length === 0) return { data: [[PairState.NOT_EXISTS, null]] };
  if (!reserves.length || reserves.length !== validTokensA.length * 2) {
    return {
      data: validTokensA.map(() => [PairState.LOADING, null]),
    };
  }

  return {
    data: validTokensA.map((tokenA, i) => {
      const tokenB = validTokensB[i];
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null];

      const pairKey = uniqePairKey(tokenA, tokenB);
      const reserve0 = reserves[i * 2];
      const reserve1 = reserves[i * 2 + 1];
      const pairAddress = PAIR_ADDRESSES[pairKey]?.address;
      if (!reserve0 || !reserve1 || reserve0.isEmpty || reserve1.isEmpty || !pairAddress)
        return [PairState.NOT_EXISTS, null];

      return [
        PairState.EXISTS,
        new Pair(
          Amount.fromRawAmount(
            tokenA,
            ((reserve0 as FrameSystemAccountInfo).data || reserve0).free.toString(),
          ),
          Amount.fromRawAmount(
            tokenB,
            ((reserve1 as FrameSystemAccountInfo).data || reserve1).free.toString(),
          ),
          pairAddress,
        ),
      ];
    }),
  };
}
