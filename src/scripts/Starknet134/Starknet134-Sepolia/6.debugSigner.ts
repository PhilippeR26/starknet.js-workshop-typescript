import {
  Call,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  InvocationsSignerDetails,
  Signature,
  TypedData,
  V2DeclareSignerDetails,
  V2DeployAccountSignerDetails,
  V2InvocationsSignerDetails,
  V3DeclareSignerDetails,
  V3DeployAccountSignerDetails,
  V3InvocationsSignerDetails,
} from 'starknet';
import { ETransactionVersion2, ETransactionVersion3 } from 'starknet';
import { CallData } from 'starknet';
import { ec, encode, hash, num, stark, transaction, typedData as typedDataSNJS, SignerInterface } from 'starknet';

export class Signer implements SignerInterface {
  protected pk: Uint8Array | string;

  constructor(pk: Uint8Array | string = ec.starkCurve.utils.randomPrivateKey()) {
    this.pk = pk instanceof Uint8Array ? encode.buf2hex(pk) : num.toHex(pk);
  }

  public async getPubKey(): Promise<string> {
    return ec.starkCurve.getStarkKey(this.pk);
  }

  public async signMessage(typedData: TypedData, accountAddress: string): Promise<Signature> {
    const msgHash = typedDataSNJS.getMessageHash(typedData, accountAddress);
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
      console.log("Transaction =\n",{
        ...det,
        senderAddress: det.walletAddress,
        compiledCalldata,
        version: det.version,
        nonceDataAvailabilityMode: stark.intDAM(det.nonceDataAvailabilityMode),
        feeDataAvailabilityMode: stark.intDAM(det.feeDataAvailabilityMode),
        msgHash
      });
    } else {
      throw Error('unsupported signTransaction version');
    }
    const sign = this.signRaw(msgHash as string);
    console.log("Signature =\n",sign);
    return sign;
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
    return ec.starkCurve.sign(msgHash, this.pk);
  }
}
