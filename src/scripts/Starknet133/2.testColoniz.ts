// Mint token in an ArgentX account in a devnet-rs (forked from mainnet)
// Launch with npx ts-node src/scripts/Starknet133/Starknet133-devnet/3.testWaitForTx.ts
// Coded with Starknet.js v6.20.3 & devnet-rs v0.2.3 & starknet-devnet.js v0.2.3

import { RpcProvider, Account, shortString, json, Contract, type InvokeFunctionResponse, TransactionFinalityStatus, Call, CairoCustomEnum } from "starknet";
import { DevnetProvider } from "starknet-devnet";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0  --state-archive-capacity full --fork-network https://free-rpc.nethermind.io/sepolia-juno/v0_7' in devnet-rs directory before using this script.
//          👆👆👆

async function main() {
  // const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  // const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  // // **** local Sepolia Testnet node
  // //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
  // // ****  Sepolia Testnet 
  // // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
  // //  **** Mainnet 
  // // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 


  // if (!(await l2DevnetProvider.isAlive())) {
  //   console.log("No l2 devnet.");
  //   process.exit();
  // }
  // console.log("chain Id =", shortString.decodeShortString(await myProvider.getChainId()), ", rpc", await myProvider.getSpecVersion());
  // console.log("Provider connected to Starknet");

  // const accData = await l2DevnetProvider.getPredeployedAccounts();
  // // *** initialize existing predeployed account 0 of Devnet
  // const accountAddress0 = accData[0].address;
  // const privateKey0 = accData[0].private_key;
  // // **** Sepolia
  // // const accountAddress0 = account1BraavosSepoliaAddress;
  // // const privateKey0 = account1BraavosSepoliaPrivateKey;
  // // **** Mainnet
  // //  const accountAddress0 = account1BraavosMainnetAddress;
  // //  const privateKey0 = account1BraavosMainnetPrivateKey;

  // const account0 = new Account(myProvider, accountAddress0, privateKey0);
  // const account1 = new Account(myProvider, accData[1].address, accData[1].private_key);
  // const account2 = new Account(myProvider, accData[2].address, accData[2].private_key);
  // console.log("Accounts connected.\n");

  const colonizAddress = "0x123";
  const colonizSierra = json.parse(fs.readFileSync("./compiledContracts/cairo284/coloniz_ColonizProfile.contract_class.json").toString("ascii"));
  const colonizContract = new Contract(colonizSierra.abi, colonizAddress);

  type ProfileVariants = {
    body: CairoCustomEnum,
    tool: CairoCustomEnum,
    background: CairoCustomEnum,
    cloth: CairoCustomEnum,
    face: CairoCustomEnum,
    accessory: CairoCustomEnum,
  };

  const BodyVariants = {
    BODY1: "BODY1",
    BODY2: "BODY2",
    BODY3: "BODY3",
    BODY4: "BODY4",
    BODY5: "BODY5",
    BODY6: "BODY6",
    BODY7: "BODY7",
  } as const;

  const ToolVariants = {
    TOOL1: "TOOL1",
    TOOL2: "TOOL2",
    TOOL3: "TOOL3",
    TOOL4: "TOOL4",
    TOOL5: "TOOL5",
    TOOL6: "TOOL6",
    EMPTY: "EMPTY",
  } as const;

  const BackgroundVariants = {
    BACKGROUND1: "BACKGROUND1",
    BACKGROUND2: "BACKGROUND2",
    BACKGROUND3: "BACKGROUND3",
    BACKGROUND4: "BACKGROUND4",
    BACKGROUND5: "BACKGROUND5",
    EMPTY: "EMPTY",
  } as const;

  const ClothVariants = {
    CLOTH1: "CLOTH1",
    CLOTH2: "CLOTH2",
    CLOTH3: "CLOTH3",
    CLOTH4: "CLOTH4",
    CLOTH5: "CLOTH5",
    EMPTY: "EMPTY",
  } as const;

  const FaceVariants = {
    FACE1: "FACE1",
    FACE2: "FACE2",
    FACE3: "FACE3",
    FACE4: "FACE4",
    FACE5: "FACE5",
    FACE6: "FACE6",
    FACE7: "FACE7",
    FACE8: "FACE8",

  } as const;

  const AccessoryVariants = {
    ACCESSORY1: "ACCESSORY1",
    ACCESSORY2: "ACCESSORY2",
    ACCESSORY3: "ACCESSORY3",
    ACCESSORY4: "ACCESSORY4",
    ACCESSORY5: "ACCESSORY5",
    ACCESSORY6: "ACCESSORY6",
    ACCESSORY7: "ACCESSORY7",
    EMPTY: "EMPTY",

  } as const;

  const myProfile: ProfileVariants = {
    body: new CairoCustomEnum({ [BodyVariants.BODY1]: {} }),
    tool: new CairoCustomEnum({ [ToolVariants.TOOL3]: {} }),
    background: new CairoCustomEnum({ [BackgroundVariants.BACKGROUND2]: {} }),
    cloth: new CairoCustomEnum({ [ClothVariants.CLOTH5]: {} }),
    face: new CairoCustomEnum({ [FaceVariants.FACE7]: {} }),
    accessory: new CairoCustomEnum({ [AccessoryVariants.ACCESSORY5]: {} }),
  };
  console.log(myProfile);

  const myCall: Call = colonizContract.populate("create_profile", {
    coloniznft_contract_address: "0x123",
    registry_hash: "0x234",
    implementation_hash: "0x345",
    salt: 22,
    profile_variants: myProfile,
  });
  console.log(myCall);

  console.log("✅ Test performed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
