// declare & deploy a contract.
// use of OZ deployer
// launch with npx ts-node src/scriptsA2/5.declareDeployContractOZ.ts

import { Provider, Account, Contract, ec, json, stark, uint256, shortString } from "starknet";
import { accountTestnet4Address, accountTestnet4privateKey } from "../../A1priv/A1priv";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    //initialize Provider 

    const provider = new Provider({ sequencer: { network: "goerli-alpha" } });

    const privateKey0 = accountTestnet4privateKey;
    const starkKeyPair0 = ec.getKeyPair(privateKey0);
    const account0Address: string = accountTestnet4Address;
    const account0 = new Account(provider, account0Address, starkKeyPair0);
    console.log('existing AX account4 connected.\n');

    // Declare & deploy Test contract in devnet
    const testClassHash = "0xff0378becffa6ad51c67ac968948dbbd110b8a8550397cf17866afebc6c17d";
    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/test.json").toString("ascii"));
    const deployResponse = await account0.declareDeploy({ contract: compiledTest, classHash: testClassHash });
    // In case of constructor, add for example : ,constructorCalldata: [encodeShortString('Token'),encodeShortString('ERC20'),account.address,],

    // Connect the new contract instance :
    const myTestContract = new Contract(compiledTest.abi, deployResponse.deploy.contract_address, provider);
    console.log('✅ Test Contract connected at =', myTestContract.address);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });