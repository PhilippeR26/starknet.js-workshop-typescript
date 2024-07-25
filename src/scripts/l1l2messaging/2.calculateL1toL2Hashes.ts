// Calculate hashes related to L1->L2 messages.
// Launch with npx ts-node src/scripts/l1l2messaging/2.calculateL1toL2Hashes.ts
// Coded with Starknet.js v6.11.0 + experimental

import { constants, hash } from "starknet";

async function main() {
    // Example l1 tx for a message L1->L2:
    // https://sepolia.etherscan.io/tx/0xd82ce7dd9f3964d89d2eb9d555e1460fb7792be274950abe578d610f95cc40f5
    // data extracted from etherscan :
    const l1FromAddress = "0x0000000000000000000000008453fc6cd1bcfe8d4dfc069c400b433054d47bdc";
    const l2ToAddress = 2158142789748719025684046545159279785659305214176670733242887773692203401023n;
    const l2Selector = 774397379524139446221206168840917193112228400237242521560346153613428128537n;
    const payload = [
        4543560n,
        829565602143178078434185452406102222830667255948n,
        3461886633118033953192540141609307739580461579986333346825796013261542798665n,
        9000000000000000n,
        0n,
    ];
    const l1Nonce = 8288n;

    // Resulting L2 msg Hash
    // https://sepolia.starkscan.co/message/0x2e350fa9d830482605cb68be4fdb9f0cb3e1f95a0c51623ac1a5d1bd997c2090#messagelogs
    const l1L2MessageHash = hash.getL2MessageHash(l1FromAddress, l2ToAddress, l2Selector, payload, l1Nonce);
    console.log({ l1L2MessageHash });

    // Resulting L2 tx Hash
    // https://sepolia.starkscan.co/tx/0x067d959200d65d4ad293aa4b0da21bb050a1f669bce37d215c6edbf041269c07
    const l1L2txH = hash.calculateL2MessageTxHash(l1FromAddress, l2ToAddress, l2Selector, payload, constants.StarknetChainId.SN_SEPOLIA, l1Nonce);
    console.log({ l1L2txH });
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
