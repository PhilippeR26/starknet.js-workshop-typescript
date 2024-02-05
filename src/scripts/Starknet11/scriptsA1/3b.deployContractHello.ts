// Deploy an instance of an already declared contract.
// use of OZ deployer
// launch with npx ts-node 

import { Provider, Account, Contract, ec, json } from "starknet";
import { accountTestnet4Address, accountTestnet4privateKey } from "../../A1priv/A1priv";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    const provider = new Provider({ sequencer: { network: "goerli-alpha" } });

    const privateKey0 = accountTestnet4privateKey;
    const account0Address: string = accountTestnet4Address;

    const starkKeyPair0 = ec.getKeyPair(privateKey0);
    const account0 = new Account(provider, account0Address, starkKeyPair0);
    console.log('existing AX account4 connected.\n');

    // Deploy Test instance in devnet
    const testClassHash = "0xff0378becffa6ad51c67ac968948dbbd110b8a8550397cf17866afebc6c17d";
    //const compiledTest = json.parse(fs.readFileSync("./compiledContracts/test.json").toString("ascii"));
    const deployResponse = await account0.deployContract({ classHash: testClassHash });
    const { abi: testAbi } = await provider.getClassAt(deployResponse.contract_address);
    if (testAbi === undefined) { throw new Error("no abi.") };
    // Connect the new contract :
    const myTestContract = new Contract(testAbi, deployResponse.contract_address, provider);
    console.log('✅ Test Contract connected at =', myTestContract.address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });