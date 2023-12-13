import ExchangeNode from '../DexNode';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { type ApiPromise } from '@polkadot/api';
import { getParaId } from '@paraspell/sdk';
import { getBestTrade, getFilteredPairs, getTokenMap } from './bifrostUtils';
import { Amount, Token, getCurrencyCombinations, type TokenMap } from '@crypto-dex-sdk/currency';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import { Percent } from '@crypto-dex-sdk/math';
import BigNumber from 'bignumber.js';
import { convertAmount } from './utils';
import { FEE_BUFFER } from '../../consts/consts';

const findToken = (tokenMap: TokenMap, symbol: string): Token | undefined => {
  return Object.values(tokenMap).find((item) => item.wrapped.symbol === symbol)?.wrapped;
};

class BifrostExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    { currencyFrom, currencyTo, amount, injectorAddress, slippagePct }: TSwapOptions,
    toDestTransactionFee: BigNumber,
    toExchangeTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    console.log('Swapping currency on Bifrost');

    const chainId = getParaId(this.node);

    const tokenMap = getTokenMap(this.node, chainId);

    const tokenWrappedFrom = findToken(tokenMap, currencyFrom);

    if (tokenWrappedFrom === undefined) {
      throw new Error('Currency from not found');
    }

    const tokenWrappedTo = findToken(tokenMap, currencyTo);

    if (tokenWrappedTo === undefined) {
      throw new Error('Currency to not found');
    }

    const tokenFrom = new Token(tokenWrappedFrom.wrapped);
    const tokenTo = new Token(tokenWrappedTo.wrapped);

    const currencyCombinations = getCurrencyCombinations(chainId, tokenFrom, tokenTo);

    const pairs = await getFilteredPairs(api, chainId, currencyCombinations);

    const toDestFee = convertAmount(toDestTransactionFee, tokenFrom, chainId, pairs);

    console.log('Original amount', amount);

    const amountBN = new BigNumber(amount);

    const amountWithoutFee = amountBN
      .minus(toDestFee.multipliedBy(FEE_BUFFER))
      .minus(toDestFee.multipliedBy(FEE_BUFFER))
      .decimalPlaces(0);

    console.log('Amount modified', amountWithoutFee.toString());

    const amountIn = Amount.fromRawAmount(tokenFrom, amountWithoutFee.toString());

    const tradeForSwapFee = getBestTrade(chainId, pairs, amountIn, tokenTo);

    const swapFeePct = tradeForSwapFee.descriptions.reduce((sum, item) => sum + item.fee, 0);

    const swapFeePctWithBuffer = swapFeePct * FEE_BUFFER;

    const amountWithoutSwapFee = amountWithoutFee
      .multipliedBy(1 - swapFeePctWithBuffer / 100)
      .decimalPlaces(0);

    console.log('feePct', swapFeePct);
    console.log('amount without swap fee', amountWithoutSwapFee.toString());

    const amountInFinal = Amount.fromRawAmount(tokenFrom, amountWithoutSwapFee.toString());

    const trade = getBestTrade(chainId, pairs, amountInFinal, tokenTo);

    const allowedSlippage = new Percent(Number(slippagePct) * 100, 10_000);

    const blockNumber = await api.derive.chain.bestNumber();

    const deadline = blockNumber.toNumber() + 20;

    const { extrinsic } = SwapRouter.swapCallParameters(trade, {
      api,
      allowedSlippage,
      recipient: injectorAddress,
      deadline,
    });

    if (extrinsic === null) {
      throw new Error('Extrinsic is null');
    }

    const amountOutBN = new BigNumber(trade.outputAmount.toFixed())
      .shiftedBy(tokenTo.decimals)
      .decimalPlaces(0);

    console.log(amountOutBN.toString());

    return {
      tx: extrinsic[0],
      amountOut: amountOutBN.toString(),
    };
  }
}

export default BifrostExchangeNode;
