// Declare the S2morrow Falcon-512 account class (pure TypeScript flow).
// launch with npx ts-node src/scripts/signature/falcon512/pureTS/1.declareFalcon512.ts
// Coded with Starknet.js v11.0.2 + starknet-devnet

import { connectDevnet, loadFalconAccountClass } from './demoCommon';

async function main() {
  const { myProvider, account0 } = await connectDevnet();
  const { sierra, casm, classHash } = loadFalconAccountClass();
  console.log('Expected class hash =', classHash);
  const resDecl = await account0.declareIfNot({ contract: sierra, casm });
  if (resDecl.transaction_hash) {
    await myProvider.waitForTransaction(resDecl.transaction_hash);
    console.log('Declared.');
  } else {
    console.log('Already declared.');
  }
  console.log('Falcon-512 account class hash =', resDecl.class_hash);
  console.log('✅ Test completed.');
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
