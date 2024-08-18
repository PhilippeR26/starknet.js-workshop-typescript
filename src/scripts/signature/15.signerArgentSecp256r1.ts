// Starknet.js signer for NIST P256 signature (secp256r1)

import { secp256r1 } from '@noble/curves/p256';
import {
  addAddressPadding,
  cairo,
  Call,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  encode,
  hash,
  InvocationsSignerDetails,
  num,
  Signature,
  stark,
  transaction,
  typedData,
  type TypedData,
  type Uint256,
  V2DeclareSignerDetails,
  V2DeployAccountSignerDetails,
  V2InvocationsSignerDetails,
  V3DeclareSignerDetails,
  V3DeployAccountSignerDetails,
  V3InvocationsSignerDetails,
} from 'starknet';
import { ETransactionVersion2, ETransactionVersion3 } from "@starknet-io/types-js";
import { CallData } from 'starknet';
//import { starkCurve } from '../utils/ec';
//import { buf2hex } from '../utils/encode';
// import {
//   calculateDeclareTransactionHash,
//   calculateDeployAccountTransactionHash,
//   calculateInvokeTransactionHash,
// } from '../utils/hash';
// import { toHex } from '../utils/num';
// import { intDAM } from '../utils/stark';
// import { getExecuteCalldata } from '../utils/transaction';
// import { getMessageHash } from '../utils/typedData';
import { SignerInterface } from 'starknet';

export class ArgentP256Signer implements SignerInterface {
  protected pk: string;

  constructor(pk: Uint8Array | string = secp256r1.utils.randomPrivateKey()) {
    this.pk = pk instanceof Uint8Array ? encode.addHexPrefix(encode.buf2hex(pk)) : addAddressPadding(num.toHex(pk));
    //console.log(this.pk);
  }

  // public key is an u256
  public async getPubKey(): Promise<string> {
    if (!num.isHex(this.pk)) throw new Error(`${this.pk} needs to be a hex-string`);

    let adaptedValue: string = encode.removeHexPrefix(this.pk);
    if (adaptedValue.length % 2 !== 0) {
      adaptedValue = `0${adaptedValue}`;
    }
    return encode.addHexPrefix(encode.buf2hex(secp256r1.getPublicKey(adaptedValue)).slice(2));
  }

  public async signMessage(myTypedData: TypedData, accountAddress: string): Promise<Signature> {
    const msgHash = typedData.getMessageHash(myTypedData, accountAddress);
    return this.signRaw(msgHash);
  }

  public async signTransaction(
    transactions: Call[],
    details: InvocationsSignerDetails
  ): Promise<Signature> {
    const compiledCalldata = transaction.getExecuteCalldata(transactions, details.cairoVersion);
    let msgHash;

    // TODO: How to do generic union discriminator for all like this
    if (Object.values(ETransactionVersion2).includes(details.version as any)) {
      const det = details as V2InvocationsSignerDetails;
      msgHash = hash.calculateInvokeTransactionHash({
        ...det,
        senderAddress: det.walletAddress,
        compiledCalldata,
        version: det.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
      const det = details as V3InvocationsSignerDetails;
      msgHash = hash.calculateInvokeTransactionHash({
        ...det,
        senderAddress: det.walletAddress,
        compiledCalldata,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw Error('unsupported signTransaction version');
    }

    return this.signRaw(msgHash as string);
  }

  public async signDeployAccountTransaction(
    details: DeployAccountSignerDetails
  ): Promise<Signature> {
    const compiledConstructorCalldata = CallData.compile(details.constructorCalldata);
    /*     const version = BigInt(details.version).toString(); */
    let msgHash;

    if (Object.values(ETransactionVersion2).includes(details.version as any)) {
      const det = details as V2DeployAccountSignerDetails;
      msgHash = hash.calculateDeployAccountTransactionHash({
        ...det,
        salt: det.addressSalt,
        constructorCalldata: compiledConstructorCalldata,
        version: det.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
      const det = details as V3DeployAccountSignerDetails;
      msgHash = hash.calculateDeployAccountTransactionHash({
        ...det,
        salt: det.addressSalt,
        compiledConstructorCalldata,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw Error('unsupported signDeployAccountTransaction version');
    }

    return this.signRaw(msgHash as string);
  }

  public async signDeclareTransaction(
    // contractClass: ContractClass,  // Should be used once class hash is present in ContractClass
    details: DeclareSignerDetails
  ): Promise<Signature> {
    let msgHash;

    if (Object.values(ETransactionVersion2).includes(details.version as any)) {
      const det = details as V2DeclareSignerDetails;
      msgHash = hash.calculateDeclareTransactionHash({
        ...det,
        version: det.version,
      });
    } else if (Object.values(ETransactionVersion3).includes(details.version as any)) {
      const det = details as V3DeclareSignerDetails;
      msgHash = hash.calculateDeclareTransactionHash({
        ...det,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
      });
    } else {
      throw Error('unsupported signDeclareTransaction version');
    }

    return this.signRaw(msgHash as string);
  }

  protected async signRaw(msgHash: string): Promise<Signature> {
    const signature = secp256r1.sign(encode.removeHexPrefix(addAddressPadding(msgHash)), encode.removeHexPrefix(this.pk),{lowS:true});
    console.log({ signature },"\ns <= SECP_256_R1_HALF :",signature.s <= BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551") / 2n);
    const pubK: Uint256 = cairo.uint256(await this.getPubKey());
    const r: Uint256 = cairo.uint256(signature.r);
    const s: Uint256 = cairo.uint256(signature.s);
    const y_parity: boolean = Boolean(signature.recovery);
    const formattedSignature = CallData.compile([
      1,
      2,
      cairo.tuple(pubK, {
        r,
        s,
        y_parity
      })
    ]);
    console.log({ formattedSignature });
    return formattedSignature;
  }
}
export function p256RandomPrivateKey(): string {
  return encode.sanitizeHex(encode.buf2hex(secp256r1.utils.randomPrivateKey()));
}
78991612456162898002509856066830489575806608947111614636816128002717858044001n
57896044605178124381348723474703786764998477612067880171211129530534256022184n