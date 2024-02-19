// Calculate private key from ArgentX seed phrase.
// Coded with Starknet.js v5.19.5, starknet-devnet 0.6.1
// launch with npx ts-node src/scripts/argentX/4.getPrivFromArgentXSeed.ts
import { CallData, ec, hash } from "starknet";
import * as mStarknet from '@scure/starknet';
import * as bip32 from "@scure/bip32";
import * as bip39 from '@scure/bip39';

const mnemonic = "inquiry tuition toe harvest vanish dress doctor maid divorce mystery cross loyal";
const contractAXclassHash = "0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b";

const masterSeed = bip39.mnemonicToSeedSync(mnemonic);
const hdKey1 = bip32.HDKey.fromMasterSeed(masterSeed).derive("m/44'/60'/0'/0/0");
const hdKey2 = bip32.HDKey.fromMasterSeed(hdKey1.privateKey!)
const pathBase = "m/44'/9004'/0'/0/";

for (let i = 0; i < 5; i++) {
    const path = pathBase + String(i);
    const hdKeyi = hdKey2.derive(path);
    console.log("path =", path);
    const starknetPrivateKey = "0x" + mStarknet.grindKey(hdKeyi.privateKey!);
    console.log("privateKey =", starknetPrivateKey);
    const starkKeyPubAX = ec.starkCurve.getStarkKey(starknetPrivateKey);
    const constructorAXCallData=CallData.compile([starkKeyPubAX,0]);
    const accountAXAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, contractAXclassHash, constructorAXCallData, 0);
    console.log('Account address=', accountAXAddress);
}
// The addresses calculation is valid only for the accounts created after the release of the new Cairo 1 account contract (v0.3.0). For accounts created earlier, you have to try with older classes : 

// |version|                   class hash                                       |
// | ----- | ------------------------------------------------------------------ |
// |v0.3.1|0x029927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b|
// |v0.3.0 |0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003   |
// |v0.2.3.1|0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2 |
// |v0.2.3 |0x01a7820094feaf82d53f53f214b81292d717e7bb9a92bb2488092cd306f3993f  |
// |v0.2.2 |0x3e327de1c40540b98d05cbcb13552008e36f0ec8d61d46956d2f9752c294328   |
// |v0.2.1 |0x06a1776964b9f991c710bfe910b8b37578b32b26a7dffd1669a1a59ac94bf82f  |
// |v0.2.0 |0x07595b4f7d50010ceb00230d8b5656e3c3dd201b6df35d805d3f2988c69a1432  |
// |v0.1.0 |0x02c3348ad109f7f3967df6494b3c48741d61675d9a7915b265aa7101a631dc33  |

