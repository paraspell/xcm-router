import ExchangeNode from '../DexNode';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { type ApiPromise } from '@polkadot/api';

class BifrostExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    { currencyFrom, currencyTo, amount, injectorAddress }: TSwapOptions,
  ): Promise<TSwapResult> {
    console.log('Swapping currency on Bifrost');

    // const provider = new WsProvider(getNodeProvider('BifrostPolkadot'));
    // await provider.isReady;

    // const dexApi = new ModuleBApi(provider, BifrostConfig);
    // await dexApi.initApi();

    // const response = await axios.get(
    //   'https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/bifrost-polkadot.json',
    // );
    // const tokensMeta = response.data.tokens;

    // const tokens: Token[] = tokensMeta.map((item: any) => {
    //   return new Token(item);
    // });

    // const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(tokens));
    // const standardPools = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
    // console.log('standardPools', standardPools);
    // console.log('standardPairs', standardPairs);

    // const stablePairs: StablePair[] = await firstValueFrom(dexApi.stablePairOf());
    // console.log('stablePairs', stablePairs);

    // const stablePools: StableSwap[] = await firstValueFrom(dexApi.stablePoolOfPairs());

    // const tokensMap: Record<string, Token> = {};
    // tokens.reduce((total: Record<string, Token>, cur: Token) => {
    //   total[cur.assetId] = cur;
    //   return total;
    // }, tokensMap);

    // const bncToken = tokensMap['200-2001-0-0'];
    // const vsKSMToken = tokensMap['200-2001-2-1028'];
    // const bncAmount = new TokenAmount(bncToken, (10_000_000_000_000).toString());

    // const fromToken = bncAmount;
    // const fromTokenAmount = new TokenAmount(fromToken as any, (1_000_000_000_000_000).toString());
    // const toToken = vsKSMToken;

    // const result = SmartRouterV2.swapExactTokensForTokens(
    //   fromTokenAmount,
    //   toToken,
    //   standardPools,
    //   stablePools,
    // );

    // const trade = result.trade;

    // if (dexApi.api === undefined) {
    //   throw new Error('api not initialized');
    // }

    // const blockNumber = await dexApi.api.query.system.number();
    // const deadline = Number(blockNumber.toString()) + 20; // deadline is block height

    // // set slippage of 5%
    // const slippageTolerance = new Percent(5, 100);

    // if (trade === undefined) {
    //   throw new Error('trade is undefined');
    // }

    // const extrinsics = dexApi.swapExactTokensForTokens(
    //   trade.route.routePath,
    //   trade.inputAmount,
    //   trade.minimumAmountOut(slippageTolerance),
    //   injectorAddress,
    //   deadline,
    // );

    return null as any;
  }
}

export default BifrostExchangeNode;
