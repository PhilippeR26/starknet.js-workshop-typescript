// transfer tokens
// 
// launch with npx ts-node src/tmp/5c.transferToken.ts
// Coded with Starknet.js v10.0.0-B3


import { Provider, RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, Call, cairo, shortString, CairoCustomEnum, type BigNumberish, BlockTag, CairoBytes31, config, type EstimateFeeResponseOverhead, type StarknetPlugin, type TypedData, type Signature } from "starknet";
import devnetProvider, { DevnetProvider } from "starknet-devnet";
import { account0OZSepoliaAddress, account0OZSepoliaPrivateKey, account1BraavosSepoliaAddress, account1TestBraavosSepoliaAddress, account1TestBraavosSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey, chainStackTestnet } from "../../../A1priv/A1priv";
import { alchemyKey, infuraKey } from "../../../A-MainPriv/mainPriv";

import fs from "fs";
import { ethAddress, strkAddress } from "../../../scripts/utils/constants";
import { formatBalance } from "../../../scripts/utils/formatBalance";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey, account2IntegrationAXaddress, account2IntegrationAXprivateKey, account3IntegrationOZ17address, account3IntegrationOZ17privateKey, account4IntegrationOZ20address, account4IntegrationOZ20privateKey, account5IntegrationOZ20address, account5IntegrationOZ20privateKey, equilibriumPathfinderIntegrationUrl } from "../../../A2priv/A2priv";
import * as dotenv from "dotenv";
dotenv.config({ quiet: true });


//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0' before using this script.
//          👆👆👆

interface ProviderLogMethods {
  getTxLog(): string[];
  clearTxLog(): void;
}

export function providerLogPlugin(): StarknetPlugin<ProviderLogMethods> {
  const log: string[] = [];
  return {
    name: 'provider-log',

    // Add methods
    extend: () => ({
      getTxLog: () => [...log],
      clearTxLog: () => {
        log.length = 0;
      },
    }),

    // Track all transactions
    hooks: {
      afterRequest: (ctx: { method: string; params: any; result: any }) => {
        log.push(json.stringify(ctx));
      },
    },
  }
}

interface TransactionLogMethods {
  getTxLog(): string[];
  clearTxLog(): void;
}

export function txLogPlugin(): StarknetPlugin<TransactionLogMethods> {
  const log: string[] = [];

  return {
    name: 'tx-log',

    // Add methods
    extend: () => ({
      getTxLog: () => [...log],
      clearTxLog: () => {
        log.length = 0;
      },
    }),

    // Track all transactions
    accountHooks: {
      afterSign: (ctx: { typedData: TypedData; signature: Signature }) => {
        log.push(json.stringify(ctx));
      },
    },
  };
}



async function main() {
  // *** devnet
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });

  // *** Sepolia
  // const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9545/rpc/v0_10" }); // local Sepolia Testnet node
  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet 

  // *** Mainnet
  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Mainnet

  // *** Paradex
  // const myProvider = new RpcProvider({ nodeUrl: "https://rpc.api.prod.paradex.trade/rpc/v0_9"  }); // Paradex mainnet 
  // const myProvider = new RpcProvider({ nodeUrl: "https://rpc.api.testnet.paradex.trade/rpc/v0_9"  }); // Paradex testnet 

  // *** integration Sepolia
  // const myProvider = new RpcProvider({nodeUrl: equilibriumPathfinderIntegrationUrl    }); // Integration Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.26:9550/rpc/v0_10" }); // local Sepolia Integration node
  myProvider.use(providerLogPlugin());

  const bl = await myProvider.getBlockWithTxHashes();
  console.log(
    "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", bl.starknet_version,
    ", block #", bl.block_number,
  );
  console.log("Provider connected to Starknet.");
  // console.log(bl)
  //  process.exit(5);

  // **** initialize existing predeployed account 0 of Devnet
  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = "0x28563f81a0e454ddd3d6c136e4db728a9a98ffac97effc974dbf2fd68d22815";
  // const privateKey0 = "0x18455cfa3e966a746248fc68dcc315d4ccc449ad3e12f53211848499e6c946a";
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;
  // **** Sepolia
  // const accountAddress0 = account1BraavosSepoliaAddress;
  // const privateKey0 = account1TestBraavosSepoliaPrivateKey;
  // **** Mainnet
  // const accountAddress0 = account1BraavosMainnetAddress;
  // const privateKey0 = account1BraavosMainnetPrivateKey;
  // **** Integration Sepolia
  // const accountAddress0 = account1IntegrationOZ8address;
  // const privateKey0 = account1IntegrationOZ8privateKey;
  //  const accountAddress0 = account2IntegrationAXaddress;
  //  const privateKey0 = account2IntegrationAXprivateKey;
  const accountAddress0 = account3IntegrationOZ17address;
  const privateKey0 = account3IntegrationOZ17privateKey;
  // const accountAddress0 = account4IntegrationOZ20address;
  // const privateKey0 = account4IntegrationOZ20privateKey;
  // const accountAddress0 = account5IntegrationOZ20address;
  // const privateKey0 = account5IntegrationOZ20privateKey;

  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  account0.use(txLogPlugin());
  console.log("Account 0 connected.\n");
  console.log("Account address =", num.toHex64(account0.address));
  // process.exit(1);
  const compiledERC20Contract = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json").toString("ascii"));
  const ethContract = new Contract({ abi: compiledERC20Contract.abi, address: ethAddress, providerOrAccount: account0 });
  const strkContract = new Contract({ abi: compiledERC20Contract.abi, address: strkAddress, providerOrAccount: account0 });
  const balETH = await ethContract.call("balanceOf", [account0.address]) as bigint;
  const balSTRK = await strkContract.call("balanceOf", [account0.address]) as bigint;
  console.log("OZ account has a balance of :", formatBalance(balSTRK, 18), "STRK");
  console.log("OZ account has a balance of :", formatBalance(balETH, 18), "ETH");
  // process.exit(6);

  // config.set('resourceBoundsOverhead', {
  //     l1_gas: {
  //         max_amount: 500,
  //         max_price_per_unit: 500,
  //     },
  //     l2_gas: {
  //         max_amount: 2000,
  //         max_price_per_unit: 500,
  //     },
  //     l1_data_gas: {
  //         max_amount: 500,
  //         max_price_per_unit: 500,
  //     },
  // });

  const transfCall = strkContract.populate("transfer", {
    recipient: "0x70a5da4f557b77a9c54546e4bcc900806e28793d8e3eaaa207428d2387249b7",
    amount: 1n * 10n ** 17n
  });
  // const estim = await account0.estimateInvokeFee(transfCall, { skipValidate: true });
  // estim.resourceBounds.l2_gas.max_price_per_unit = bigIntMax(3n * 10n ** 9n, estim.resourceBounds.l2_gas.max_price_per_unit);
  // console.log("estimate=", estim);
  // // const tip=await myProvider.getEstimateTip(undefined,{maxBlocks:20,minTxsNecessary:5});
  // // console.log({tip});
  // // process.exit(5);
  console.log("transfer in progress...");
  const res = await account0.execute(transfCall, {
    //     tip: 1n * 10n ** 10n,
    //     skipValidate: false
  });
  // console.log("log=", myProvider.getTxLog(), myProvider.clearTxLog());
  const txR = await account0.provider.waitForTransaction(res.transaction_hash);
  console.log(txR);

  console.log('✅ Test completed.');

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
