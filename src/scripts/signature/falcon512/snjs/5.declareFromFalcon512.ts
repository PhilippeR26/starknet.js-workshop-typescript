// The S2morrow Falcon-512 account declares the `hello` contract, deploys it, writes and reads it.
// launch with npx ts-node src/scripts/signature/falcon512/snjs/5.declareFromFalcon512.ts
// Coded with Starknet.js v11.4.0 + starknet-devnet

import { Account, CairoBytes31, Contract, num } from 'starknet';
import { Falcon512Signer } from 'starknet/falcon';
import { connectDevnet, loadAccount, loadCompiled } from './demoCommon';

async function main() {
  // 🚨 launch script 2 before this script.
  const { myProvider } = await connectDevnet();
  const saved = loadAccount();
  const falconAccount = new Account({ provider: myProvider, address: saved.address, signer: new Falcon512Signer(saved.secretKey) });
  const { sierra, casm } = loadCompiled('./compiledContracts/cairo260/hello');

  // *** DECLARE, signed with Falcon-512
  const resDecl = await falconAccount.declareIfNot({ contract: sierra, casm }, { skipValidate: false });
  if (resDecl.transaction_hash) {
    await myProvider.waitForTransaction(resDecl.transaction_hash);
    console.log('hello declared by the Falcon-512 account, class hash =', resDecl.class_hash);
  } else {
    console.log('hello already declared: signDeclareTransaction not exercised on this run (restart the devnet to exercise it).');
  }

  // *** deploy through the UDC (INVOKE signed with Falcon-512)
  const deployResp = await falconAccount.deployContract({ classHash: resDecl.class_hash }, { skipValidate: false });
  await myProvider.waitForTransaction(deployResp.transaction_hash);
  console.log('hello deployed at', deployResp.contract_address);

  // *** write then read
  const helloContract = new Contract({ abi: sierra.abi, address: deployResp.contract_address, providerOrAccount: falconAccount });
  const resp = await helloContract.withOptions({ skipValidate: false }).set_name(CairoBytes31.fromText('Falcon512').toHexString());
  const txR = await myProvider.waitForTransaction(resp.transaction_hash);
  if (!txR.isSuccess()) {
    console.log(txR);
    throw new Error('set_name failed');
  }
  const name = new CairoBytes31(num.toHex((await helloContract.get_name()) as bigint)).decodeUtf8();
  console.log('get_name() =', name);
  if (name !== 'Falcon512') throw new Error('Unexpected name');
  console.log('✅ Declare, deploy and invoke signed with Falcon-512 accepted.');
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
