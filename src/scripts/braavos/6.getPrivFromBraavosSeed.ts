// Calculate private key from Braavos seed phrase.
// Coded with Starknet.js v6.6.0
// launch with npx ts-node src/scripts/braavos/6.getPrivFromBraavosSeed.ts
import { CallData, ec, hash, type BigNumberish } from "starknet";
import * as mStarknet from '@scure/starknet';
import * as bip32 from "@scure/bip32";
import * as bip39 from '@scure/bip39';
import { calculateAddressBraavos } from "./3b.deployBraavos1";

const mnemonic = "inquiry tuition toe harvest vanish dress doctor maid divorce mystery cross loyal";
const BraavosBaseClassHash: BigNumberish = "0x013bfe114fb1cf405bfc3a7f8dbe2d91db146c17521d40dcf57e16d6b59fa8e6";

const masterSeed = bip39.mnemonicToSeedSync(mnemonic);
const hdKey1 = bip32.HDKey.fromMasterSeed(masterSeed)
const pathBase = "m/44'/9004'/0'/0/";

for (let i = 0; i < 8; i++) {
    const path = pathBase + String(i);
    const hdKeyI = hdKey1.derive(path);
    console.log("path =", path);
    const starknetPrivateKey = "0x" + mStarknet.grindKey(hdKeyI.privateKey!);
    console.log("privateKey =", starknetPrivateKey);
    // addresses valid for accounts created with the Cairo 1 implementation of the Braavos contract
    const accountBraavosAddress = calculateAddressBraavos(starknetPrivateKey);
    console.log('Account address=', accountBraavosAddress);
}
