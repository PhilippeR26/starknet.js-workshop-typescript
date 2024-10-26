// create a very complex nested calldata
// launch with npx src/scripts/Starknet132/Starknet132-Sepolia/4.callComplexTypes.ts
// Coded with Starknet.js v6.17.0

import { BigNumberish, shortString, num, byteArray, RpcProvider, Account, json, Contract, CallData, parseCalldataField, type ByteArray, encode, CairoCustomEnum, type CairoEnumRaw } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
import { account1BraavosSepoliaAddress, account1BraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
dotenv.config();


async function main() {
  //   const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only starknet-devnet-rs
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // ****  Sepolia Testnet 
  const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" });
  // const provider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_6" }); // local pathfinder testnet node
  // const provider = new RpcProvider({ nodeUrl: junoNMtestnet }); // local pathfinder testnet node
  // if (!(await l2DevnetProvider.isAlive())) {
  //     console.log("No l2 devnet.");
  //     process.exit();
  //   }
  console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  console.log("Provider connected to Starknet");

  //const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;
  // **** Sepolia
  const accountAddress0 = account1BraavosSepoliaAddress;
  const privateKey0 = account1BraavosSepoliaPrivateKey;
  // **** Mainnet
  //  const accountAddress0 = account1BraavosMainnetAddress;
  //  const privateKey0 = account1BraavosMainnetPrivateKey;

  const account0 = new Account(myProvider, accountAddress0, privateKey0);


  const address = "0x03c96ed8f587cd3bd30caf08cdc2e8a30915675f7dbe05589049d0b65183f9e4";
  const compiledSierra = await myProvider.getClassAt(address);
  const nftContract = new Contract(compiledSierra.abi, address, account0);

  type Issuer = {
    name: string,
    contact: string,
    certification: string,
  }

  enum AT {
    Cash,
    Commodity,
    Stock,
    Bond,
    Credit,
    Art,
    IntellectualProperty,
  }
  type AssetType = keyof typeof AT;

  type Valuation = {
    currency: string,
    amount: BigNumberish,
  }

  type Document = {
    document_name: string,
    document_type: string,
    document_url: string,
  }

  type AssetDetails = {
    location: string,
    legal_status: string,
    valuation: Valuation,
    issued_date: string,
    expiry_date: string,
    condition: string,
    dimensions: string,
    material: string,
    color: string,
    historical_significance: string,
    document: Document,
  }

  type Owner = {
    name: string,
    contact: string,
  }

  type RoyaltyInfo = {
    recipient: BigNumberish,
    percentage: BigNumberish,
  }
  type RWAMetadata = {
    name: string,
    description: string,
    image: string,
    external_url: string,
    asset_id: string,
    issuer: Issuer,
    asset_type: CairoCustomEnum,
    asset_details: AssetDetails,
    current_owner: Owner,
    royalty_info: RoyaltyInfo,
    legal_jurisdiction: string,
    disclaimer: string,
  }

  const myIssuer: Issuer = {
    name: "name1",
    contact: "contact1",
    certification: "certification1",
  };
  const assetChoice: AssetType = "Bond";
  const myAssetType = new CairoCustomEnum({ [assetChoice]: {} });
  const myValuation: Valuation = {
    currency: "Stark of course",
    amount: 2345n,
  };
  const myDocument: Document = {
    document_name: "Very important!",
    document_type: "sacred",
    document_url: "http://starknetjs.com/docs/next/guides/cairo_enum#cairo-custom-enum",
  };
  const myAssetDetails: AssetDetails = {
    location: "In the chain",
    legal_status: "illegal",
    valuation: myValuation,
    issued_date: "12/march/2024",
    expiry_date: "12/dec/2024",
    condition: "strict",
    dimensions: "very large",
    material: "very hard",
    color: "dark forest",
    historical_significance: "indeed",
    document: myDocument,
  };
  const myOwner: Owner = {
    name: "Satoshi",
    contact: "Vitalik",
  }
  const myRoyaltyInfo: RoyaltyInfo = {
    recipient: "Phil26",
    percentage: 95,
  }
  const myRWA: RWAMetadata = {
    name: "birds magnificence",
    description: "beautiful colored birds",
    image: "img23",
    external_url: "http://starknetjs.com/assets/images/WalletAccountArchitecture-e5cf4590640224aba5457512de6bf9d0.png",
    asset_id: "STRK",
    issuer: myIssuer,
    asset_type: myAssetType,
    asset_details: myAssetDetails,
    current_owner: myOwner,
    royalty_info: myRoyaltyInfo,
    legal_jurisdiction: "Singapore",
    disclaimer: "Miraculous if it works!!!!",
  }

  const myCall = nftContract.populate("mint", { metadata: myRWA });
  console.log(myCall);
  const resp = await account0.execute(myCall);
  const txR = await myProvider.waitForTransaction(resp.transaction_hash);
  console.log(txR);

  console.log("✅ end of script.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


