# @paraspell/xcm-router

XCM Router is latest ParaSpell innovation, that allows for seameless XCM Exchanges. Send one token type and receive different one you choose on destination chain cross-chain. All within one call and three signatures. This seamless operation allows for a better user experience limiting possiblities of user error. Router currently implements **9 largest Parachain DEXes** and is easy to extend as the amount of DEXes with public SDKs increases. Together there are **579** asset pools to choose from making XCM Router **largest liquidity bridging tool in the ecosystem**.


### Check out our brand new Wiki documentation! [Wiki docs](https://paraspell.github.io/docs/router/getting-strtd)


# Getting started with SpellRouter☄️
##### Step 1. Install peer dependencies
```sh
# npm
npm install @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
```
```sh
# yarn
yarn install @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
```
```sh
# pnpm currently unsupported (Support will be added soon (pnpm has build bug that their team needs to resolve))
#pnpm install @polkadot/api @polkadot/types @polkadot/api-base @polkadot/apps-config @polkadot/util
```

##### Step 2. Install XCM Router package (depending on your package manager of choice):
```sh
# npm
npm install @paraspell/xcm-router
```
```sh
# yarn
yarn install @paraspell/xcm-router
```
```sh
# pnpm currently unsupported (Support will be added soon (pnpm has build bug that their team needs to resolve))
#pnpm install @paraspell/xcm-router
```

## Importing package
After installing the XCM-Router package there are two ways of importing it:

### Option 1: Builder pattern 

This way allows you to enhance builder patterns and construct your calls in a simple way.

```js
import { RouterBuilder } from '@paraspell/xcm-router'
```

### Option 2: Classic pattern

```js
// ESM
import * as xcmRouter from '@paraspell/xcm-router'

//Multiple import options
import { transfer, 
         TransactionType, 
         TTransferOptions, 
         TTxProgressInfo } from '@paraspell/xcm-router'

//As Polkadot moves to ESM only, our Router also moves to ESM only. CJS is not supported anymore.
```

# XCM Router Implementation Guide

XCM Router is able to perform cross-chain transactions between Polkadot/Kusama Parachains and Relay chains as well. 
It works across 9 open source Parachain DEXes.

These are:
- Acala / 36 Pools available
- Basilisk / 15 Pools available
- BifrostKusama / 66 Pools available / Requires native token for swaps
- BifrostPolkadot / 45 Pools available / Requires native token for swaps
- HydraDX / 210 Pools available
- Interlay / 10 Pools available / Requires native token for swaps
- Karura / 136 Pools available
- Kintsugi / 6 Pools available / Requires native token for swaps
- Mangata / 55 Pools available / Requires native token for swaps

Totaling to 579 pools available for cross-chain swap transactions.

**NOTE: Some exchanges require native tokens in order to proceed with swaps.**

## XCM Router allows you to construct your calls in two ways:
- Via Builder pattern (recommended, easy to use)
- Classic function-like way

Both of these ways will be explained.

## Builder pattern XCM Router example
```js
await RouterBuilder
        .from('Polkadot')   //Origin Parachain/Relay chain
        .exchange('HydraDX')    //Exchange Parachain
        .to('Astar')    //Destination Parachain/Relay chain
        .currencyFrom('DOT')    // Currency to send
        .currencyTo('ASTR')    // Currency to receive
        .amount('1000000')  // Amount to send
        .slippagePct('1')   // Max slipppage percentage
        .injectorAddress(selectedAccount.address)   //Injector address
        .recipientAddress(recipientAddress) //Recipient address
        .signer(injector.signer)    //Signer
        .onStatusChange((status: TTxProgressInfo) => {  //This is how we subscribe to calls that need signing
          console.log(status.hashes);   //Transaction hashes
          console.log(status.status);   //Transaction statuses
          console.log(status.type);    //Transaction types
        })
        .buildAndSend()
```

AccountId32 and AccountKey20 addresses can be directly copied from PolkadotJS as our SDK has a handler to convert it into the desired hex string automatically. 

Eg. use standard public key `141NGS2jjZca5Ss2Nysth2stJ6rimcnufCNHnh5ExSsftn7U`
Instead of `0x84fc49ce30071ea611731838cc7736113c1ec68fbc47119be8a0805066df9b2b`

## Function pattern XCM Router example
This XCM constructor uses a native Relay chain XCM pallet. It is very straightforward to implement.

```js
await transfer({
        originNode: 'Polkadot', //Origin Parachain/Relay chain
        exchangeNode: 'AcalaDex', //Exchange Parachain
        destinationNode: 'Interlay', //Destination Parachain/Relay chain
        currencyFrom: 'DOT', // Currency to send
        currencyTo: 'INTR', // Currency to receive
        amount: '100000', // Amount to send
        slippagePct: '1', // Max slipppage percentage
        injectorAddress: selectedAccount.address, //Injector address
        address: recipientAddress, //Recipient address
        signer: injector.signer,  //Signer
        onStatusChange: (status: TTxProgressInfo) => {  //This is how we subscribe to calls that need signing
          console.log(status.hashes);   //Transaction hashes
          console.log(status.status);   //Transaction statuses
          console.log(status.type);     //Transaction types
        },
      });

```
AccountId32 and AccountKey20 addresses can be directly copied from PolkadotJS as our SDK has a handler to convert it into the desired hex string automatically. 

Eg. use standard public key `141NGS2jjZca5Ss2Nysth2stJ6rimcnufCNHnh5ExSsftn7U`
Instead of `0x84fc49ce30071ea611731838cc7736113c1ec68fbc47119be8a0805066df9b2b`

## List of DEX chains, assets and Parachains supported by XCM Router

| DEX | Can send to/receive from | Supported assets | Notes |
| ------------- | ------------- | ------------- |------------- |
| Acala DEX |Polkadot Relay, Astar, HydraDX, Interlay, Moonbeam, Parallel, AssetHubPolkadot, Unique network|ACA, DOT, aSEED, USDCet, UNQ, IBTC, INTR, lcDOT, LDOT| Fees are paid by either ACA or DOT|
|Karura DEX| Kusama Relay, Altair, Basilisk, BifrostKusama, Calamari, Crab, Parallel Heiko, Kintsugi, Moonriver, Quartz, Crust Shadow, Shiden, AssetHubKusama| BNC, USDCet, RMRK, ARIS, AIR, QTZ, CSM, USDT, KAR, KBTC, KINT, KSM, aSEED, LKSM, PHA, tKSM, TAI | Fees are paid by either KAR or KSM|
|HydraDX DEX| Polkadot Relay, Acala, Interlay, AssetHubPolkadot, Zeitgeist, Astar, Centrifuge, BifrostPolkadot| USDT, HDX, WETH, GLMR, IBTC, BNC, WBTC, vDOT, DAI, CFG, DOT, DAI, ZTG, WBTC, INTR, ASTR, LRNA, USDC| Chain automatically gives you native asset to pay for fees.|
| Basilisk DEX | Kusama Relay, Karura, AssetHubKusama, Tinkernet, Robonomics| BSX, USDT, aSEED, XRT, KSM, TNKR| Chain automatically gives you native asset to pay for fees.|
|Mangata DEX| Kusama Relay, AssetHubKusama, BifrostPolkadot, Moonriver, Turing, Imbue| MGX, IMBU, TUR, ZLK, BNC, USDT, RMRK, MOVR, vsKSM, KSM, vKSM| Chain requires native MGX asset to pay for fees.|
|Bifrost Kusama DEX| Kusama Relay, AssetHubKusama, Karura, Moonriver, Kintsugi, Mangata| BNC, vBNC, vsKSM, vKSM, USDT, aSEED, KAR, ZLK, RMRK, KBTC, MOVR, vMOVR| Chain requires native BNC asset for fees.|
|Bifrost Polkadot DEX| Polkadot Relay, AssetHubPolkadot, Moonbeam, Astar, Interlay| BNC, vDOT, vsDOT, USDT, FIL, vFIL, ASTR, vASTR, GLMR, vGLMR, MANTA, vMANTA|Chain requires native BNC asset for fees.|
|Interlay DEX| Polkadot Relay, Acala, Astar, Parallel, PolkadotAssetHub, HydraDX, BifrostPolkadot |INTR, DOT, IBTC, USDT, VDOT| Chain requires native INTR asset for fees.|
|Kintsugi DEX| Kusama Relay, Karura, KusamaAssetHub, Parallel Heiko, BifrostKusama|KINT,KSM,KBTC,USDT|Chain requires native KINT asset for fees.|

## 💻 Development & Testing

- Clone this repository

- Install dependencies using `yarn`

- Run compilation test using `yarn compile`

- Run linting test using `yarn lint`

- Run unit tests using `yarn test`

### SpellRouter☄️ playground

Playground allows you to demo-test XCM-Router to perform test main-net transactions and to learn which features will be beneficial for your project.

#### Prerequisites
- Node.js
- yarn

#### Launching

```bash
# Clone API
$ git clone https://github.com/paraspell/xcm-router.git

# Navigate to the playground folder
$ cd playground

# Install playground packages
$ yarn

# Start playground
$ yarn dev

```

#### UI

Once launched, you should see the following UI and be able to perform transactions:

<img width="1667" alt="Screenshot 2023-12-15 at 14 37 39" src="https://github.com/paraspell/xcm-router/assets/55763425/9b07aa55-e462-440e-8c25-9110ddf52570">



## License

Made with 💛 by [ParaSpell✨](https://github.com/paraspell)

Published under [MIT License](https://github.com/paraspell/xcm-router/blob/main/LICENSE).

