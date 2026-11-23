// Post-quantum encrypted message between two OpenZeppelin Falcon-512 accounts.
// Alice (account with hint) and Bob (direct account) share a secret with ML-KEM-768 (FIPS 203); each side signs its
// part with its Falcon account. Alice then encrypts a random Latin text with AES-256-GCM and sends it to Bob.
// The accounts are declared and deployed if needed. Only their Falcon public keys are read on-chain: the exchange
// itself is off-chain, as in a dapp.
// Launch with npx ts-node src/scripts/signature/falcon512/OZfalcon512/3.ozFalcon512MlKemMessage.ts
// Coded with Starknet.js v11.9.0 and starknet-devnet v0.11.0.

import { Account, CairoBytes31, CallData, RpcProvider, cairo, encode, hash, json, num, stark, type BigNumberish, type Call, type CairoAssembly, type CompiledSierra } from "starknet";
import { Falcon512Signer, falcon512, mlkem, type Falcon512AccountType, type MlKemSignedCapsule, type MlKemSignedKey } from "starknet/falcon";
import { gcm } from "@noble/ciphers/aes.js";
import { bytesToUtf8, equalBytes, randomBytes, utf8ToBytes } from "@noble/ciphers/utils.js";
import { DevnetProvider } from "starknet-devnet";
import fs from "fs";
import { strkAddress } from "../../../utils/constants";
import { formatBalance } from "../../../utils/formatBalance";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey } from "../../../../A1priv/A1priv";
import { account1MainnetAddress, account1MainnetPrivateKey, alchemyKey } from "../../../../A-MainPriv/mainPriv";

type AccountName = "Alice" | "Bob";
type AccountConfig = { name: AccountName; accountType: Falcon512AccountType; expectedClassHash: string; sierraFile: string; casmFile: string };

const SCRIPT_DIR = "./src/scripts/signature/falcon512/OZfalcon512/";
// Alice: OpenZeppelin preset with hint. Bob: direct OpenZeppelin preset. Both compiled unmodified with Scarb 2.21.0.
const ALICE: AccountConfig = {
  name: "Alice",
  accountType: "oz-hint",
  expectedClassHash: "0x14660ce3739fbde6e33d994cebd6a9fb20e800516b2e1b6c253d4d09baa9ae0",
  sierraFile: SCRIPT_DIR + "oz_falcon512_Falcon512ShakeAccountUpgradeable.contract_class.json",
  casmFile: SCRIPT_DIR + "oz_falcon512_Falcon512ShakeAccountUpgradeable.compiled_contract_class.json",
};
const BOB: AccountConfig = {
  name: "Bob",
  accountType: "oz-direct",
  expectedClassHash: "0x16111958d61eedfa5a950b608997abb4981b548f1862d620cc9247461ddeeb1",
  sierraFile: SCRIPT_DIR + "oz_falcon512_Falcon512ShakeDirectAccountUpgradeable.contract_class.json",
  casmFile: SCRIPT_DIR + "oz_falcon512_Falcon512ShakeDirectAccountUpgradeable.compiled_contract_class.json",
};
// Keys of the Falcon accounts of the other networks (never written for devnet). Listed in .gitignore.
const KEYS_FILE = SCRIPT_DIR + "ozFalcon512MlKemKeys.json";

// Given to an account before its DEPLOY_ACCOUNT, its only paid transaction. The node requires a balance above the
// maximum fee of the transaction: about 3.6 STRK with hint and 4.4 STRK direct, on Sepolia in November 2026.
const FUNDING = 6n * 10n ** 18n;
const ML_KEM_KEY_LIFETIME = 3600; // seconds

const LATIN_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor",
  "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure",
  "in", "reprehenderit", "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
  "est", "laborum",
];

type FeeLine = { payer: string; step: string; paid: bigint };
type StoredFalconAccount = { address: string; secretKey: string };
type KeysFile = Record<string, Partial<Record<AccountName, StoredFalconAccount>>>; // one entry per chain name

function formatStrk(fri: bigint): string {
  return formatBalance(fri, 18) + " STRK";
}

function toHexKey(secretKey: Uint8Array): string {
  return "0x" + Buffer.from(secretKey).toString("hex");
}

function shortHex(bytes: Uint8Array): string {
  return "0x" + encode.buf2hex(bytes).slice(0, 32) + "…";
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

async function expectRejected(step: string, action: () => unknown): Promise<void> {
  try {
    await action();
  } catch (error) {
    console.log(`${step}: ✅ refused, as expected (${(error as Error).message.slice(0, 100)})`);
    return;
  }
  throw new Error(`${step}: accepted, but it should have been refused`);
}

function randomLatinText(lines: number): string {
  const pick = (): string => LATIN_WORDS[Math.floor(Math.random() * LATIN_WORDS.length)];
  return Array.from({ length: lines }, () => {
    const words = Array.from({ length: 8 + Math.floor(Math.random() * 5) }, pick);
    words[0] = words[0][0].toUpperCase() + words[0].slice(1);
    return words.join(" ") + ".";
  }).join("\n");
}

// Declares the class if needed, then gives the Falcon account of `cfg.name`: reused from KEYS_FILE (not on devnet),
// or new, funded by account0 and deployed with a DEPLOY_ACCOUNT signed by Falcon.
async function prepareFalconAccount(provider: RpcProvider, account0: Account, cfg: AccountConfig, keys: KeysFile, chainName: string, onDevnet: boolean, report: FeeLine[]): Promise<Account> {
  console.log(`\n*** ${cfg.name}: ${cfg.accountType} account`);
  const compiledSierra = json.parse(fs.readFileSync(cfg.sierraFile).toString("ascii")) as CompiledSierra;
  const compiledCasm = json.parse(fs.readFileSync(cfg.casmFile).toString("ascii")) as CairoAssembly;
  const resDeclare = await account0.declareIfNot({ contract: compiledSierra, casm: compiledCasm });
  if (resDeclare.transaction_hash) {
    await provider.waitForTransaction(resDeclare.transaction_hash);
    console.log("Class declared now, transaction hash =", resDeclare.transaction_hash);
  }
  const classHash = num.toHex(resDeclare.class_hash);
  if (BigInt(classHash) !== BigInt(cfg.expectedClassHash)) {
    throw new Error(`Unexpected class hash ${classHash}`);
  }
  console.log("Class hash =", classHash);

  let stored = keys[chainName]?.[cfg.name];
  if (stored === undefined) {
    const { secretKey } = falcon512.generateKeyPair();
    const packed = new Falcon512Signer(secretKey, { accountType: cfg.accountType }).getPackedPublicKey();
    const address = hash.calculateContractAddressFromHash(packed[0], classHash, CallData.compile({ public_key: packed }), 0);
    stored = { address, secretKey: toHexKey(secretKey) };
    if (onDevnet) {
      console.log("New Falcon key (devnet: not saved).");
    } else {
      keys[chainName] = { ...keys[chainName], [cfg.name]: stored };
      writeKeys(keys);
      console.log("New Falcon key saved in", KEYS_FILE);
    }
  } else {
    console.log("Falcon account read from", KEYS_FILE);
  }
  const signer = new Falcon512Signer(stored.secretKey, { accountType: cfg.accountType });
  const account = new Account({ provider, address: stored.address, signer });
  const deployed = await isDeployed(provider, stored.address);
  console.log("Address =", stored.address, ", already deployed =", deployed);
  if (deployed) {
    if (!sameKey(await onChainPublicKey(provider, stored.address), signer.getPackedPublicKey())) {
      throw new Error(`The stored key of ${cfg.name} is not the key of the account.`);
    }
    return account;
  }

  const balance = await strkBalance(provider, stored.address);
  if (balance < FUNDING) {
    const resFund = await account0.execute(strkTransfer(stored.address, FUNDING - balance));
    const txRFund = await provider.waitForTransaction(resFund.transaction_hash);
    if (!txRFund.isSuccess()) {
      throw new Error(`Funding of ${cfg.name} failed`);
    }
  }
  console.log("Balance before deployment =", formatStrk(await strkBalance(provider, stored.address)));
  const packed = signer.getPackedPublicKey();
  const deployPayload = { classHash, constructorCalldata: CallData.compile({ public_key: packed }), addressSalt: packed[0], contractAddress: stored.address };
  const resDeploy = await account.deployAccount(deployPayload, { skipValidate: false });
  console.log("DEPLOY_ACCOUNT: transaction hash =", resDeploy.transaction_hash);
  const txRDeploy = await provider.waitForTransaction(resDeploy.transaction_hash);
  if (!txRDeploy.isSuccess()) {
    console.log(txRDeploy.value);
    throw new Error(`DEPLOY_ACCOUNT of ${cfg.name} failed`);
  }
  const paid = BigInt(txRDeploy.value.actual_fee.amount);
  console.log("DEPLOY_ACCOUNT: ✅ done, fee paid =", formatStrk(paid));
  report.push({ payer: `${cfg.name} (${cfg.accountType})`, step: "DEPLOY_ACCOUNT", paid });
  return account;
}

async function main() {
  // *** Network: uncomment one line. Devnet by default.
  const myNodeUrl = "http://127.0.0.1:5050/rpc"; // starknet-devnet v0.11.0
  // const myNodeUrl = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey; // Sepolia Testnet
  // const myNodeUrl = "http://192.168.1.26:9545/rpc/v0_10"; // local Sepolia node
  // const myNodeUrl = "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey; // Mainnet
  const myProvider = new RpcProvider({ nodeUrl: myNodeUrl });
  const chainId = await myProvider.getChainId();
  const chainName = new CairoBytes31(chainId).decodeUtf8();
  console.log("chain Id =", chainName, ", rpc", await myProvider.getSpecVersion(), ", SN version =", (await myProvider.getBlock()).starknet_version);

  // A starknet-devnet node answers GET /is_alive. Its chain id (SN_SEPOLIA) does not tell it apart.
  // No restart: this script changes no key. The devnet only decides where the Falcon keys go.
  const l2DevnetProvider = new DevnetProvider({ url: myNodeUrl.replace(/\/rpc$/, ""), timeout: 40_000 });
  const onDevnet = await l2DevnetProvider.isAlive();
  console.log(onDevnet ? "Devnet detected: the Falcon keys are not saved." : `Not a devnet: the Falcon accounts are kept in ${KEYS_FILE}`);
  const devnetAccounts = onDevnet ? await l2DevnetProvider.getPredeployedAccounts() : [];

  // *** Payer account (declares the classes, funds the Falcon accounts): uncomment one block.
  // devnet: predeployed account 0
  const accountAddress0 = devnetAccounts[0]?.address;
  const privateKey0 = devnetAccounts[0]?.private_key;
  // Sepolia Testnet
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;
  // Mainnet
  // const accountAddress0 = account1MainnetAddress;
  // const privateKey0 = account1MainnetPrivateKey;
  if (!accountAddress0 || !privateKey0) {
    throw new Error("No payer account: uncomment the block of this network.");
  }
  const account0 = new Account({ provider: myProvider, address: accountAddress0, signer: privateKey0 });
  console.log("Payer account0 =", account0.address);

  // ********** The two Falcon accounts
  const keys: KeysFile = onDevnet ? {} : readKeys();
  const report: FeeLine[] = [];
  const alice = await prepareFalconAccount(myProvider, account0, ALICE, keys, chainName, onDevnet, report);
  const bob = await prepareFalconAccount(myProvider, account0, BOB, keys, chainName, onDevnet, report);

  // ********** On-chain part: the Falcon public keys, which check every signature of the exchange
  console.log("\n*** Falcon public keys, read on-chain with get_public_key (mlkem reads them to check each signature)");
  for (const [name, account] of [["Alice", alice], ["Bob", bob]] as const) {
    const key = await onChainPublicKey(myProvider, account.address);
    console.log(`${name}: ${key.length} felts, first one = ${num.toHex(key[0])}`);
  }

  // ********** 1. Alice: a new ML-KEM-768 key, signed by her Falcon account
  console.log("\n*** 1. Alice creates an ML-KEM-768 key and signs it");
  const validUntil = Math.floor(Date.now() / 1000) + ML_KEM_KEY_LIFETIME;
  const aliceMlKemKey = mlkem.createKey(chainId, validUntil);
  const signedKey: MlKemSignedKey = {
    keyOwnerAddress: alice.address,
    publicKey: aliceMlKemKey.publicKey,
    validUntil,
    signature: await alice.signMessage(aliceMlKemKey.typedData),
  };
  console.log("ML-KEM public key:", signedKey.publicKey.length, "bytes,", shortHex(signedKey.publicKey));
  console.log("Valid until", new Date(validUntil * 1000).toISOString(), ", signature of Alice:", stark.formatSignature(signedKey.signature).length, "felts");
  console.log("Alice keeps her ML-KEM seed secret:", aliceMlKemKey.seed.length, "bytes.");
  console.log("→ Alice sends to Bob: her address, the ML-KEM public key, validUntil and her signature.");

  // ********** 2. Bob: checks the key of Alice, makes a capsule and signs it
  console.log("\n*** 2. Bob checks the key of Alice, makes a capsule and signs it");
  const bobSide = await mlkem.encapsulate(myProvider, signedKey, bob.address);
  console.log("✅ Signature of Alice checked with her on-chain Falcon key.");
  const signedCapsule: MlKemSignedCapsule = {
    senderAddress: bob.address,
    capsule: bobSide.capsule,
    timestamp: bobSide.timestamp,
    signature: await bob.signMessage(bobSide.typedData),
  };
  console.log("Capsule:", signedCapsule.capsule.length, "bytes,", shortHex(signedCapsule.capsule));
  console.log("Timestamp", new Date(signedCapsule.timestamp * 1000).toISOString(), ", signature of Bob:", stark.formatSignature(signedCapsule.signature).length, "felts");
  console.log("Bob holds the shared secret:", bobSide.sharedSecret.length, "bytes.");
  console.log("→ Bob sends to Alice: his address, the capsule, the timestamp and his signature.");

  // ********** 3. Alice: checks the capsule of Bob and recovers the shared secret
  console.log("\n*** 3. Alice checks the capsule of Bob and recovers the shared secret");
  const aliceSecret = await mlkem.decapsulate(myProvider, signedCapsule, alice.address, aliceMlKemKey.seed);
  console.log("✅ Signature of Bob checked with his on-chain Falcon key.");
  if (!equalBytes(aliceSecret, bobSide.sharedSecret)) {
    throw new Error("Alice and Bob have different secrets");
  }
  console.log("✅ Alice and Bob hold the same secret of", aliceSecret.length, "bytes (never transmitted).");
  await expectRejected("A capsule of Bob presented as sent by Alice", () =>
    mlkem.decapsulate(myProvider, { ...signedCapsule, senderAddress: alice.address }, alice.address, aliceMlKemKey.seed)
  );

  // ********** 4. Alice: encrypts a text with AES-256-GCM; the shared secret is the 32-byte key
  console.log("\n*** 4. Alice encrypts a text with AES-256-GCM (key: the shared secret)");
  const text = randomLatinText(3);
  console.log("Plain text:\n" + text);
  const nonce = randomBytes(12); // one message per ML-KEM key: a random nonce is enough
  const encrypted = gcm(aliceSecret, nonce).encrypt(utf8ToBytes(text));
  console.log("Nonce:", nonce.length, "bytes,", shortHex(nonce));
  console.log("Encrypted text:", encrypted.length, "bytes (the text, then a 16-byte authentication tag),", shortHex(encrypted));
  console.log("→ Alice sends to Bob: the nonce and the encrypted text.");

  // ********** 5. Bob: decrypts with his copy of the shared secret
  console.log("\n*** 5. Bob decrypts with his copy of the shared secret");
  const decrypted = bytesToUtf8(gcm(bobSide.sharedSecret, nonce).decrypt(encrypted));
  console.log("Decrypted text:\n" + decrypted);
  if (decrypted !== text) {
    throw new Error("The decrypted text differs from the text of Alice");
  }
  console.log("✅ Bob reads exactly the text of Alice.");
  const tampered = encrypted.slice();
  tampered[0] ^= 1;
  await expectRejected("An encrypted text changed by one bit", () => gcm(bobSide.sharedSecret, nonce).decrypt(tampered));

  // ********** STRK consumption
  console.log("\n*** STRK consumed by the Falcon accounts");
  if (report.length === 0) {
    console.log("None in this run: both accounts were already deployed, and the exchange is off-chain.");
  }
  for (const line of report) {
    console.log(`${line.payer} | ${line.step}: paid ${formatStrk(line.paid)}`);
  }

  console.log("\n✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
