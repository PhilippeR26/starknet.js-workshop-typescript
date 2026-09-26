// Shared helpers of the pureTS demo scripts (devnet). Not part of lib/.
import fs from 'fs';
import {
  Account,
  CairoBytes31,
  hash,
  json,
  RpcProvider,
  type Abi,
  type CairoAssembly,
  type CompiledSierra,
} from 'starknet';
import { DevnetProvider } from 'starknet-devnet';
import { strkAddress } from '../../../utils/constants';

export const FALCON_DIR = './src/scripts/signature/falcon512';
export const KEYS_FILE = `${FALCON_DIR}/pureTS/accountKeysTS.json`;
export const STRK_ADDRESS = strkAddress;

export type SavedAccount = { address: string; secretKey: string; publicKey: string };

export async function connectDevnet(): Promise<{ myProvider: RpcProvider; account0: Account }> {
  //          👇👇👇
  // 🚨🚨🚨 launch 'cargo run --release -- --seed 0 --state-archive-capacity full' in the Starknet-Devnet directory before using this script.
  //          👆👆👆
  const myProvider = new RpcProvider({ nodeUrl: 'http://127.0.0.1:5050/rpc' }); // only starknet-devnet
  // const myProvider = new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + alchemyKey }); // Sepolia Testnet
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log('No l2 devnet.');
    process.exit();
  }
  console.log(
    'chain Id =', new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ', rpc', await myProvider.getSpecVersion(),
    ', SN version =', (await myProvider.getBlock()).starknet_version
  );
  const accData = await l2DevnetProvider.getPredeployedAccounts();
  const account0 = new Account({ provider: myProvider, address: accData[0].address, signer: accData[0].private_key });
  console.log('Devnet account 0 =', account0.address);
  return { myProvider, account0 };
}

export function loadCompiled(basePath: string): { sierra: CompiledSierra; casm: CairoAssembly } {
  const sierra = json.parse(fs.readFileSync(`${basePath}.sierra.json`).toString('ascii')) as CompiledSierra;
  const casm = json.parse(fs.readFileSync(`${basePath}.casm.json`).toString('ascii')) as CairoAssembly;
  return { sierra, casm };
}

export function loadFalconAccountClass(): { sierra: CompiledSierra; casm: CairoAssembly; classHash: string } {
  const { sierra, casm } = loadCompiled(`${FALCON_DIR}/falcon512Account`);
  return { sierra, casm, classHash: hash.computeContractClassHash(sierra) };
}

/** Constructor argument `pk_packed` (struct PackedPolynomial512 { s0 … s28 }). */
export const toPkStruct = (packed: string[]): Record<string, string> =>
  Object.fromEntries(packed.map((value, i) => [`s${i}`, value]));

export function loadErc20Abi(): Abi {
  return json.parse(
    fs.readFileSync('./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20Upgradeable.sierra.json').toString('ascii')
  ).abi;
}

export function saveAccount(data: SavedAccount): void {
  fs.writeFileSync(KEYS_FILE, json.stringify(data, undefined, 2));
}

export function loadAccount(): SavedAccount {
  if (!fs.existsSync(KEYS_FILE)) {
    console.log(`${KEYS_FILE} not found: run script 2 first.`);
    process.exit();
  }
  return json.parse(fs.readFileSync(KEYS_FILE).toString('ascii')) as SavedAccount;
}
