import { bytesToHex } from '@noble/hashes/utils.js';
import {
  CallData,
  ETransactionVersion3,
  hash,
  stark,
  transaction,
  typedData as starknetTypedData,
  type Call,
  type DeclareSignerDetails,
  type DeployAccountSignerDetails,
  type InvocationsSignerDetails,
  type Signature,
  type SignerInterface,
  type TypedData,
} from 'starknet';
import {
  getPublicKey,
  getPackedPublicKey,
  importFalconRsSecretKey,
  publicKeyToNtt,
  SECRET_KEY_LENGTH,
  toBytes,
} from './s2morrow/keys';
import { signHash } from './s2morrow/signature';

const isV3 = (version: string): boolean => (Object.values(ETransactionVersion3) as string[]).includes(version);

function assertV3(version: string): void {
  if (!isV3(version)) throw new Error('Falcon512: only V3 transactions are supported');
}

/** Signer for S2morrow Falcon-512 accounts (post-quantum), pure TypeScript. */
export class Falcon512Signer implements SignerInterface {
  readonly #secretKey: Uint8Array;

  readonly #publicKey: Uint8Array;

  readonly #pkNtt: Uint16Array;

  readonly #packedPublicKey: string[];

  /** @param secretKey NIST Falcon-512 secret key (1281 bytes), Uint8Array or hex string. */
  constructor(secretKey: Uint8Array | string) {
    const bytes = toBytes(secretKey, SECRET_KEY_LENGTH, 'secret key');
    this.#publicKey = getPublicKey(bytes); // fully validates the key
    this.#secretKey = bytes;
    this.#pkNtt = publicKeyToNtt(this.#publicKey);
    this.#packedPublicKey = getPackedPublicKey(this.#publicKey);
  }

  /** Builds a signer from a falcon-rs secret key (3584 bytes). */
  static fromFalconRs(secretKey: Uint8Array | string): Falcon512Signer {
    const nist = importFalconRsSecretKey(secretKey);
    try {
      return new Falcon512Signer(nist);
    } finally {
      nist.fill(0);
    }
  }

  /** NIST Falcon-512 public key (897 bytes), hex string. */
  public async getPubKey(): Promise<string> {
    return '0x' + bytesToHex(this.#publicKey);
  }

  /** The 29 felts of the account constructor argument `pk_packed`. */
  public getPackedPublicKey(): string[] {
    return [...this.#packedPublicKey];
  }

  public async signMessage(typedData: TypedData, accountAddress: string): Promise<Signature> {
    return this.signRaw(starknetTypedData.getMessageHash(typedData, accountAddress));
  }

  public async signTransaction(transactions: Call[], details: InvocationsSignerDetails): Promise<Signature> {
    assertV3(details.version);
    const compiledCalldata = transaction.getExecuteCalldata(transactions, details.cairoVersion);
    const msgHash = hash.calculateInvokeTransactionHash({
      ...details,
      senderAddress: details.walletAddress,
      compiledCalldata,
      version: details.version,
      nonceDataAvailabilityMode: stark.intDAM(details.nonceDataAvailabilityMode),
      feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
    });
    return this.signRaw(msgHash);
  }

  public async signDeployAccountTransaction(details: DeployAccountSignerDetails): Promise<Signature> {
    assertV3(details.version);
    const compiledConstructorCalldata = CallData.compile(details.constructorCalldata);
    const msgHash = hash.calculateDeployAccountTransactionHash({
      ...details,
      salt: details.addressSalt,
      compiledConstructorCalldata,
      version: details.version,
      nonceDataAvailabilityMode: stark.intDAM(details.nonceDataAvailabilityMode),
      feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
    });
    return this.signRaw(msgHash);
  }

  public async signDeclareTransaction(details: DeclareSignerDetails): Promise<Signature> {
    assertV3(details.version);
    const msgHash = hash.calculateDeclareTransactionHash({
      ...details,
      version: details.version,
      nonceDataAvailabilityMode: stark.intDAM(details.nonceDataAvailabilityMode),
      feeDataAvailabilityMode: stark.intDAM(details.feeDataAvailabilityMode),
    });
    return this.signRaw(msgHash);
  }

  protected async signRaw(msgHash: string): Promise<Signature> {
    return signHash(BigInt(msgHash), this.#secretKey, this.#pkNtt);
  }
}
