// Transfer STRK from a S2morrow Falcon-512 account (INVOKE signed in pure TypeScript).
// launch with npx ts-node src/scripts/signature/falcon512/pureTS/3.useFalcon512Account.ts
// Coded with Starknet.js v11.0.2 + starknet-devnet

import { Account, Contract } from 'starknet';
import { displayBalances } from '../../../utils/displayBalances';
import { connectDevnet, loadAccount, loadErc20Abi, STRK_ADDRESS } from './demoCommon';
import { Falcon512Signer } from './lib';

async function main() {
  // 🚨 launch script 2 before this script.
  const { myProvider, account0 } = await connectDevnet();
  const saved = loadAccount();
  const falconAccount = new Account({ provider: myProvider, address: saved.address, signer: new Falcon512Signer(saved.secretKey) });
  console.log('Falcon-512 account =', falconAccount.address);
  await displayBalances(falconAccount.address, myProvider);

  const strkContract = new Contract({ abi: loadErc20Abi(), address: STRK_ADDRESS, providerOrAccount: falconAccount });
  console.log('Transfer...');
  console.time('transfer');
  const resp = await strkContract.withOptions({ skipValidate: false }).transfer(account0.address, 1n * 10n ** 10n);
  const txR = await myProvider.waitForTransaction(resp.transaction_hash);
  console.timeEnd('transfer');
  if (!txR.isSuccess()) {
    console.log(txR);
    throw new Error('Transfer failed');
  }
  await displayBalances(falconAccount.address, myProvider);
  console.log('✅ Transfer signed with Falcon-512 accepted.');
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
