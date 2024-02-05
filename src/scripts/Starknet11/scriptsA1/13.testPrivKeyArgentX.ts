// Test the consistency of a ArgentX private key.
// using Starknet.js v4.22.0
// launch with npx ts-node src/scripts/testPrivKeyArgentX.ts

import { Provider, Account, Contract, ec, json ,number} from "starknet";
import { accountTestnet4Address, accountTestnet4privateKey } from "../../A1priv/A1priv";
import fs from "fs";

async function main() {
    const provider = new Provider({ sequencer: { network: "goerli-alpha" } });

    const privateKey4 = accountTestnet4privateKey;
    const account4Address: string = accountTestnet4Address;
    const starkKeyPair4 = ec.getKeyPair(privateKey4);
    const account0 = new Account(provider, account4Address, starkKeyPair4);
    console.log('existing AX account4 connected.\n');

    const fullPublicKey = starkKeyPair4.getPublic("hex");
    console.log("full publickey =", fullPublicKey);
    const starknetPublicKey = number.cleanHex( ec.getStarkKey(starkKeyPair4));
    console.log("starknet publickey =", starknetPublicKey); // is first part of full pubKey

    const abiAccount = json.parse(fs.readFileSync("compiledContracts/ArgentAccount_0_2_3_abi.json").toString("ascii"));
    // Connect the new contract :
    const myAccountContract = new Contract(abiAccount, account4Address, provider);
    const resp = await myAccountContract.getSigner();
    const signer=number.toHex(resp[0]);
    console.log("Signer of ArgentX account =", signer);
    signer===starknetPublicKey?
    console.log('✅ Private key valid for this account.',):
    console.log('❌ Private key NOT valid for this account.',);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });