// Connect a predeployed OZ account in devnet. 
// address and PrivKey are displayed when launching starknet-devnet, and have been  stored in .env file.
// launch with npx ts-node src/scripts/12.MessageToL2.ts
// Coded with Starknet.js v5.16.0, Starknet-devnet-rs v0.1.0

import { Account, hash, RpcProvider } from "starknet";
import * as dotenv from "dotenv";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//    👆👆👆
async function main() {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    console.log("Provider connected to Starknet-devnet-rs");

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress0: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress0, privateKey0);
    console.log("Account 0 connected.\n");

    const entryP = hash.getSelectorFromName("setPublicKey");
    console.log("entryP =", entryP);
    const responseEstimateMessageFee = await provider.estimateMessageFee({
        from_address: "0xc662c410C0ECf747543f5bA90660f6ABeBD9C8d", // L1 addr
        to_address: "0x033de869eb1905fe503610527c51e245119bd05c231e7165c95d6fb630fe05ff", // L2 addr (PhilTest2.cairo)
        entry_point_selector: "increase_bal", // needs to be a Cairo function with decorator @l1_handler, and first parameter named 'from_address'.
        payload: ["0x2b34"] // do not list here 'from_address' parameter.
    })
    console.log("Estimated fee =", responseEstimateMessageFee);
    //console.log("Estimated fee =", responseEstimateMessageFee.overall_fee);
    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });