// Test of an OpenZeppelin Falcon-512 account, variant with hint (Falcon512ShakeAccountUpgradeable, 60-felt signatures):
// declare (if not), DEPLOY_ACCOUNT signed by Falcon, STRK transfer, key change.
// On devnet only: migration of a predeployed Stark account to this Falcon class, at the same address.
// Launch with npx ts-node src/scripts/signature/falcon512/OZfalcon512/1.ozFalcon512HintAccount.ts
// Coded with Starknet.js v11.8.0 and starknet-devnet v0.11.0.

import { Account, CairoBytes31, CallData, RpcProvider, cairo, hash, json, num, type BigNumberish, type Call, type CairoAssembly, type CompiledSierra } from "starknet";
import { Falcon512Signer, falcon512, type Falcon512AccountType } from "starknet/falcon";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import { strkAddress } from "../../../utils/constants";
import { formatBalance } from "../../../utils/formatBalance";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey } from "../../../../A1priv/A1priv";
import { account1MainnetAddress, account1MainnetPrivateKey, alchemyKey } from "../../../../A-MainPriv/mainPriv";

// Account class: OpenZeppelin preset with hint, compiled unmodified with Scarb 2.21.0.
const ACCOUNT_TYPE: Falcon512AccountType = "oz-hint";
const EXPECTED_CLASS_HASH = "0x14660ce3739fbde6e33d994cebd6a9fb20e800516b2e1b6c253d4d09baa9ae0";
const SCRIPT_DIR = "./src/scripts/signature/falcon512/OZfalcon512/";
const SIERRA_FILE = SCRIPT_DIR + "oz_falcon512_Falcon512ShakeAccountUpgradeable.contract_class.json";
const CASM_FILE = SCRIPT_DIR + "oz_falcon512_Falcon512ShakeAccountUpgradeable.compiled_contract_class.json";
// Keys of the Falcon accounts of the other networks (never written for devnet). Listed in .gitignore.
const KEYS_FILE = SCRIPT_DIR + "ozFalcon512HintKeys.json";

const FUNDING = 10n * 10n ** 18n; // account0 tops up the Falcon account to this STRK balance, on all networks
const TRANSFER_AMOUNT = 10n ** 10n; // fri of STRK, sent to account0 by each test transfer

type FeeLine = { payer: string; step: string; paid: bigint };
type StoredFalconAccount = { address: string; secretKey: string; pendingSecretKey?: string };
type KeysFile = Record<string, StoredFalconAccount>; // one entry per chain name

function formatStrk(fri: bigint): string {
  return formatBalance(fri, 18) + " STRK";
}

function toHexKey(secretKey: Uint8Array): string {
  return "0x" + Buffer.from(secretKey).toString("hex");
}

function readKeys(): KeysFile {
  return fs.existsSync(KEYS_FILE) ? (JSON.parse(fs.readFileSync(KEYS_FILE, "utf8")) as KeysFile) : {};
}

function writeKeys(keys: KeysFile): void {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2) + "\n");
}

function strkTransfer(recipient: string, amount: bigint): Call {
  return { contractAddress: strkAddress, entrypoint: "transfer", calldata: CallData.compile({ recipient, amount: cairo.uint256(amount) }) };
}

async function strkBalance(provider: RpcProvider, address: string): Promise<bigint> {
  const res = await provider.callContract({ contractAddress: strkAddress, entrypoint: "balance_of", calldata: [address] });
  return BigInt(res[0]) + (BigInt(res[1]) << 128n);
}

async function isDeployed(provider: RpcProvider, address: string): Promise<boolean> {
  try {
    await provider.getClassHashAt(address);
    return true;
  } catch {
    return false;
  }
}

// get_public_key returns [29, …the 29 felts]: the first felt is the length.
async function onChainPublicKey(provider: RpcProvider, address: string): Promise<bigint[]> {
  const res = await provider.callContract({ contractAddress: address, entrypoint: "get_public_key" });
  return res.slice(1).map((felt) => BigInt(felt));
}

function sameKey(onChain: bigint[], packed: readonly BigNumberish[]): boolean {
  return onChain.length === packed.length && onChain.every((felt, i) => felt === BigInt(packed[i]));
}

// The fee estimate made by starknet.js must run the costly Falcon validation: skipValidate: false.
async function invokeWithReport(provider: RpcProvider, report: FeeLine[], payer: string, step: string, account: Account, calls: Call[]): Promise<void> {
  const { transaction_hash } = await account.execute(calls, { skipValidate: false });
  console.log(`${step}: transaction hash =`, transaction_hash);
  const txR = await provider.waitForTransaction(transaction_hash);
  if (!txR.isSuccess()) {
    console.log(txR.value);
    throw new Error(`${step} failed`);
  }
  const paid = BigInt(txR.value.actual_fee.amount);
  console.log(`${step}: ✅ done, fee paid =`, formatStrk(paid));
  report.push({ payer, step, paid });
}

async function expectRefused(step: string, account: Account, calls: Call[]): Promise<void> {
  try {
    await account.estimateInvokeFee(calls, { skipValidate: false });
  } catch (error) {
    console.log(`${step}: ✅ refused, as expected (${(error as Error).message.slice(0, 100)}…)`);
    return;
  }
  throw new Error(`${step}: accepted, but it should have been refused`);
}

async function main() {
  // *** Network: uncomment one line. Devnet by default.
  const myNodeUrl = "http://127.0.0.1:5050/rpc"; // starknet-devnet v0.11.0
  // const myNodeUrl = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey; // Sepolia Testnet
  // const myNodeUrl = "http://192.168.1.26:9545/rpc/v0_10"; // local Sepolia node
  // const myNodeUrl = "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey; // Mainnet
  // const myNodeUrl = "http://192.168.1.26:6060/rpc/v0_10"; // local Mainnet node
  const myProvider = new RpcProvider({ nodeUrl: myNodeUrl });
  const chainName = new CairoBytes31(await myProvider.getChainId()).decodeUtf8();
  console.log("chain Id =", chainName, ", rpc", await myProvider.getSpecVersion(), ", SN version =", (await myProvider.getBlock()).starknet_version);

  // A starknet-devnet node answers GET /is_alive. Its chain id (SN_SEPOLIA) does not tell it apart.
  const l2DevnetProvider = new DevnetProvider({ url: myNodeUrl.replace(/\/rpc$/, ""), timeout: 40_000 });
  const onDevnet = await l2DevnetProvider.isAlive();
  if (onDevnet) {
    await l2DevnetProvider.restart();
    console.log("Devnet detected and restarted: its predeployed accounts have Stark keys again.");
  } else {
    console.log("Not a devnet: the Falcon account is kept in", KEYS_FILE);
  }
  const devnetAccounts = onDevnet ? await l2DevnetProvider.getPredeployedAccounts() : [];

  // *** Payer account (declares the class, funds the Falcon account): uncomment one block.
  // devnet: predeployed account 0
  const accountAddress0 = devnetAccounts[0]?.address;
  const privateKey0 = devnetAccounts[0]?.private_key;
  // Sepolia Testnet
  //  const accountAddress0 = account1OZSepoliaAddress;
  //  const privateKey0 = account1OZSepoliaPrivateKey;
  // Mainnet
  // const accountAddress0 = account1MainnetAddress;
  // const privateKey0 = account1MainnetPrivateKey;

  if (!accountAddress0 || !privateKey0) {
    throw new Error("No payer account: uncomment the block of this network.");
  }
  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log("Payer account0 =", account0.address);

  // ********** Declaration of the Falcon account class
  console.log("\n*** Declaration");
  const compiledSierra = json.parse(fs.readFileSync(SIERRA_FILE).toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync(CASM_FILE).toString("ascii")) as CairoAssembly;
  const resDeclare = await account0.declareIfNot({ contract: compiledSierra, casm: compiledCasm });
  if (resDeclare.transaction_hash) {
    await myProvider.waitForTransaction(resDeclare.transaction_hash);
    console.log("Class declared now, transaction hash =", resDeclare.transaction_hash);
  } else {
    console.log("Class already declared.");
  }
  const classHash = num.toHex(resDeclare.class_hash);
  if (BigInt(classHash) !== BigInt(EXPECTED_CLASS_HASH)) {
    throw new Error(`Unexpected class hash ${classHash}`);
  }
  console.log("Class hash =", classHash, `(${ACCOUNT_TYPE})`);

  // ********** Falcon account: key and address
  console.log("\n*** Falcon account");
  const keys: KeysFile = onDevnet ? {} : readKeys();
  let stored = keys[chainName];
  if (stored === undefined) {
    const { secretKey } = falcon512.generateKeyPair();
    const packed = new Falcon512Signer(secretKey, { accountType: ACCOUNT_TYPE }).getPackedPublicKey();
    const address = hash.calculateContractAddressFromHash(packed[0], classHash, CallData.compile({ public_key: packed }), 0);
    stored = { address, secretKey: toHexKey(secretKey) };
    if (onDevnet) {
      console.log("New Falcon key (devnet: not saved).");
    } else {
      keys[chainName] = stored;
      writeKeys(keys);
      console.log("New Falcon key saved in", KEYS_FILE);
    }
  } else {
    console.log("Falcon account of", chainName, "read from", KEYS_FILE);
  }
  const falconAddress = stored.address;
  const deployed = await isDeployed(myProvider, falconAddress);
  let falconSigner = new Falcon512Signer(stored.secretKey, { accountType: ACCOUNT_TYPE });
  if (deployed) {
    const onChainKey = await onChainPublicKey(myProvider, falconAddress);
    if (!sameKey(onChainKey, falconSigner.getPackedPublicKey())) {
      const pending = stored.pendingSecretKey;
      if (pending === undefined || !sameKey(onChainKey, new Falcon512Signer(pending, { accountType: ACCOUNT_TYPE }).getPackedPublicKey())) {
        throw new Error("No stored key matches the key of the account.");
      }
      // A previous run changed the key, but stopped before recording it as the current key.
      stored.secretKey = pending;
      delete stored.pendingSecretKey;
      writeKeys(keys);
      falconSigner = new Falcon512Signer(pending, { accountType: ACCOUNT_TYPE });
      console.log("The pending key is the key of the account: recorded as the current key.");
    }
  }
  let falconAccount = new Account({ provider: myProvider, address: falconAddress, signer: falconSigner });
  console.log("Falcon account address =", falconAddress, ", already deployed =", deployed);
  console.log("Packed public key: 29 felts, first one =", falconSigner.getPackedPublicKey()[0]);
  const report: FeeLine[] = [];

  // ********** Funding by account0
  const balanceBeforeFunding = await strkBalance(myProvider, falconAddress);
  console.log("Falcon account balance =", formatStrk(balanceBeforeFunding));
  if (balanceBeforeFunding < FUNDING) {
    const resFund = await account0.execute(strkTransfer(falconAddress, FUNDING - balanceBeforeFunding));
    const txRFund = await myProvider.waitForTransaction(resFund.transaction_hash);
    if (!txRFund.isSuccess()) {
      throw new Error("Funding failed");
    }
    console.log("Funded by account0: Falcon account balance =", formatStrk(await strkBalance(myProvider, falconAddress)));
  }

  // ********** DEPLOY_ACCOUNT, signed by the Falcon key
  if (!deployed) {
    console.log("\n*** Deployment");
    const packed = falconSigner.getPackedPublicKey();
    const deployPayload = { classHash, constructorCalldata: CallData.compile({ public_key: packed }), addressSalt: packed[0], contractAddress: falconAddress };
    const resDeploy = await falconAccount.deployAccount(deployPayload, { skipValidate: false });
    console.log("DEPLOY_ACCOUNT: transaction hash =", resDeploy.transaction_hash);
    const txRDeploy = await myProvider.waitForTransaction(resDeploy.transaction_hash);
    if (!txRDeploy.isSuccess()) {
      console.log(txRDeploy.value);
      throw new Error("DEPLOY_ACCOUNT failed");
    }
    const paidDeploy = BigInt(txRDeploy.value.actual_fee.amount);
    console.log("DEPLOY_ACCOUNT: ✅ done, fee paid =", formatStrk(paidDeploy));
    report.push({ payer: "Falcon account", step: "DEPLOY_ACCOUNT", paid: paidDeploy });
  }

  // ********** Transfer signed by the current key
  console.log("\n*** Transfer of", TRANSFER_AMOUNT, "fri of STRK to account0");
  await invokeWithReport(myProvider, report, "Falcon account", "Transfer signed by the current key", falconAccount, [strkTransfer(account0.address, TRANSFER_AMOUNT)]);
  console.log("Falcon account balance =", formatStrk(await strkBalance(myProvider, falconAddress)));

  // ********** Key change: the current key signs the transaction, the new key signs an acceptance
  console.log("\n*** Key change");
  const { secretKey: newSecretKey } = falcon512.generateKeyPair();
  const newSigner = new Falcon512Signer(newSecretKey, { accountType: ACCOUNT_TYPE });
  if (!onDevnet) {
    stored.pendingSecretKey = toHexKey(newSecretKey);
    writeKeys(keys);
    console.log("New key saved as pending in", KEYS_FILE);
  }
  const acceptance = await newSigner.signOwnershipAcceptance(falconAddress, falconSigner.getPackedPublicKey());
  console.log("Acceptance signed by the new key:", acceptance.length, "felts");
  const setKeyCall: Call = {
    contractAddress: falconAddress,
    entrypoint: "set_public_key",
    calldata: CallData.compile({ new_public_key: newSigner.getPackedPublicKey(), signature: acceptance }),
  };
  await invokeWithReport(myProvider, report, "Falcon account", "Key change (set_public_key)", falconAccount, [setKeyCall]);
  if (!onDevnet) {
    stored.secretKey = toHexKey(newSecretKey);
    delete stored.pendingSecretKey;
    writeKeys(keys);
    console.log("New key recorded as the current key in", KEYS_FILE);
  }
  if (!sameKey(await onChainPublicKey(myProvider, falconAddress), newSigner.getPackedPublicKey())) {
    throw new Error("get_public_key does not return the new key");
  }
  console.log("✅ get_public_key returns the new key.");
  const oldFalconAccount = falconAccount;
  falconAccount = new Account({ provider: myProvider, address: falconAddress, signer: newSigner });
  await invokeWithReport(myProvider, report, "Falcon account", "Transfer signed by the new key", falconAccount, [strkTransfer(account0.address, TRANSFER_AMOUNT)]);
  await expectRefused("Transfer signed by the old key", oldFalconAccount, [strkTransfer(account0.address, TRANSFER_AMOUNT)]);
  console.log("Falcon account balance =", formatStrk(await strkBalance(myProvider, falconAddress)));

  // ********** Devnet only: a predeployed Stark account becomes a Falcon account, at the same address
  if (onDevnet) {
    console.log("\n*** Devnet: migration of the predeployed account 1 to the Falcon class");
    const accountAddress1 = devnetAccounts[1].address;
    const starkAccount1 = new Account({ provider: myProvider, address: accountAddress1, signer: devnetAccounts[1].private_key });
    console.log("Account 1 =", accountAddress1, ", class hash before =", await myProvider.getClassHashAt(accountAddress1));
    const { secretKey: migrationSecretKey } = falcon512.generateKeyPair();
    const migrationSigner = new Falcon512Signer(migrationSecretKey, { accountType: ACCOUNT_TYPE });
    // First migration: the Falcon key storage is still empty, so the current key is [].
    const migrationAcceptance = await migrationSigner.signOwnershipAcceptance(accountAddress1, []);
    // OpenZeppelin requires both calls in the same transaction, signed by the Stark key.
    const migrationCalls: Call[] = [
      { contractAddress: accountAddress1, entrypoint: "upgrade", calldata: CallData.compile({ new_class_hash: classHash }) },
      {
        contractAddress: accountAddress1,
        entrypoint: "set_public_key",
        calldata: CallData.compile({ new_public_key: migrationSigner.getPackedPublicKey(), signature: migrationAcceptance }),
      },
    ];
    await invokeWithReport(myProvider, report, "Account 1", "Migration: upgrade + set_public_key, signed by the Stark key", starkAccount1, migrationCalls);
    const classHashAfter = await myProvider.getClassHashAt(accountAddress1);
    if (BigInt(classHashAfter) !== BigInt(classHash)) {
      throw new Error(`Account 1 has the class ${classHashAfter}`);
    }
    if (!sameKey(await onChainPublicKey(myProvider, accountAddress1), migrationSigner.getPackedPublicKey())) {
      throw new Error("Account 1: get_public_key does not return the Falcon key");
    }
    console.log("✅ Account 1: class hash after =", classHashAfter, ", get_public_key returns the Falcon key.");
    const falconAccount1 = new Account({ provider: myProvider, address: accountAddress1, signer: migrationSigner });
    await invokeWithReport(myProvider, report, "Account 1", "Transfer signed by the Falcon key", falconAccount1, [strkTransfer(account0.address, TRANSFER_AMOUNT)]);
    await expectRefused("Account 1: transfer signed by the old Stark key", starkAccount1, [strkTransfer(account0.address, TRANSFER_AMOUNT)]);
  }

  // ********** STRK consumption
  console.log("\n*** STRK consumed by the Falcon accounts");
  for (const line of report) {
    console.log(`${line.payer} | ${line.step}: paid ${formatStrk(line.paid)}`);
  }
  for (const payer of [...new Set(report.map((line) => line.payer))]) {
    const total = report.filter((line) => line.payer === payer).reduce((sum, line) => sum + line.paid, 0n);
    console.log(`Total paid by ${payer} = ${formatStrk(total)}`);
  }

  console.log("\n✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
