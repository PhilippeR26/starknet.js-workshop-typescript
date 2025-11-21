// Calculate private key from seed phrase.
// use Starknet.js v5.16.0, starknet-devnet 0.5.5
// launch with npx ts-node src/scripts/argentX/2.getPrivFromSeed-Ethers.ts
import { BigNumber, utils, Wallet,  } from "ethers" //v5.5.0
import * as hdnode from "@ethersproject/hdnode";
import { ec, CallData, hash} from "starknet"
import * as mStark from '@scure/starknet';
import { bytesToHex } from '@noble/curves/abstract/utils';
import { ArgentXMnemonic } from "../../A-MainPriv/mainPriv";
import * as bip32 from '@scure/bip32';
import * as bip39 from '@scure/bip39';

async function main() {
    // with ethers & micro-starknet
    //const mnemonic: string = ArgentXMnemonic;
    const mnemonic = "inquiry tuition toe harvest vanish dress doctor maid divorce mystery cross loyal";
    // const entropy = hdnode.mnemonicToEntropy(mnemonic);
    // console.log("Entropy =",entropy);
    const wallet = Wallet.fromMnemonic(mnemonic);
    // const wallet2 = Wallet.fromMnemonic(mnemonic,"m/44'/9004'/0'/0/0");
    // console.log("wallet2 privK =",wallet2.privateKey);
    const secret = wallet.privateKey;
    console.log("secret =",secret);
    const masterNode = utils.HDNode.fromSeed(secret);
    //console.log("masterNode",masterNode);
        // const seed: Uint8Array = bip39.mnemonicToSeedSync(mnemonic);
    // const masterNode = utils.HDNode.fromSeed(seed);
    const baseDerivationPath = "m/44'/9004'/0'/0/";
    // process.exit(2);
    for (let i = 0; i < 4; i++) {
        const path = baseDerivationPath + String(i);
        console.log("path =", path);
        

        const childNode = masterNode.derivePath(path)
        console.log("childNode.privK=",childNode.privateKey);
        const groundKey = "0x" + mStark.grindKey(childNode.privateKey)
        // const pubKey = ec.starkCurve.getStarkKey(groundKey);
        //     const constructorCalldata = CallData.compile({
        //         owner: pubKey,
        //         guardian: 0
        //     });
            // const AXcontractAddress = hash.calculateContractAddressFromHash(
            //     pubKey,
            //     argentXaccountClassHash,
            //     constructorCalldata,
            //     0
            // );
        console.log("Account #",i,"\nPrivate Key =", groundKey, "\n", BigInt(groundKey));
   }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });