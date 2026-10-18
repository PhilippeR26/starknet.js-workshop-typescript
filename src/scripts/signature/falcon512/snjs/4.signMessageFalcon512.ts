// Sign a SNIP-12 message with a S2morrow Falcon-512 account, then verify it off-chain and on-chain.
// launch with npx ts-node src/scripts/signature/falcon512/snjs/4.signMessageFalcon512.ts
// Coded with Starknet.js v11.4.0 + starknet-devnet

import { Account, constants, TypedDataRevision, type TypedData } from 'starknet';
import { Falcon512Signer, falcon512 } from 'starknet/falcon';
import { connectDevnet, loadAccount } from './demoCommon';

async function main() {
  // 🚨 launch script 2 before this script.
  const { myProvider } = await connectDevnet();
  const saved = loadAccount();
  const falconSigner = new Falcon512Signer(saved.secretKey);
  const falconAccount = new Account({ provider: myProvider, address: saved.address, signer: falconSigner });
  const fullPublicKey = await falconSigner.getPubKey();

  const myTypedData: TypedData = {
    domain: { name: 'Gift', chainId: constants.StarknetChainId.SN_SEPOLIA, version: '1', revision: TypedDataRevision.ACTIVE },
    message: { date_start: 2345, gift_id: 101 },
    primaryType: 'Message',
    types: {
      StarknetDomain: [
        { name: 'name', type: 'shortstring' },
        { name: 'chainId', type: 'shortstring' },
        { name: 'version', type: 'shortstring' },
      ],
      Message: [
        { name: 'date_start', type: 'felt' },
        { name: 'gift_id', type: 'u128' },
      ],
    },
  };

  const msgHash = await falconAccount.hashMessage(myTypedData);
  console.time('signMessage');
  const signature = await falconAccount.signMessage(myTypedData);
  console.timeEnd('signMessage');
  console.log('signature length =', (signature as string[]).length);

  const results = {
    offChainTypedData: falcon512.verifyMessage(myTypedData, signature, fullPublicKey, falconAccount.address),
    offChainHash: falcon512.verifyMessage(msgHash, signature, fullPublicKey),
    offChainLowLevel: falcon512.verify(signature, msgHash, fullPublicKey),
    onChainTypedData: await myProvider.verifyMessageInStarknet(myTypedData, signature, falconAccount.address),
    onChainHash: await myProvider.verifyMessageInStarknet(msgHash, signature, falconAccount.address),
    wrongHashRejected: !falcon512.verify(signature, '0x1234', fullPublicKey),
  };
  console.log(results);
  if (!Object.values(results).every(Boolean)) throw new Error('A verification gave an unexpected result');
  console.log('✅ SNIP-12 message signed with Falcon-512 verified off-chain and on-chain.');
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
