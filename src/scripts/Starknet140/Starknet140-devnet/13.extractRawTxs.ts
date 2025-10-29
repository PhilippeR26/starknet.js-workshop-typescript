// Extract & process later a raw transaction.
// Launch with npx src/scripts/Starknet140/Starknet140-devnet/13.extractRawTxs.ts
// Coded with Starknet.js v8.5.4 & starknet-devnet.js v0.5.0
//
// ***************************************************
// *** TO USE ONLY FOR DEVELOPMENT PURPOSE.   ********
// *** NEVER USE THIS CODE TO PROCESS ITEMS   ********
// *** THAT HAVE A REAL VALUE.                ********
// *** IT'S NOT SAFE TO PROCESS THIS WAY.     ********
// ***************************************************

import { constants, Contract, Account, json, shortString, RpcProvider, RPC, num, ec, CallData, hash, cairo, hdParsingStrategy, CairoOptionVariant, BigNumberish, CairoResult, CairoResultVariant, RPC08, typedData, Signer, type CompiledSierra, type InvokeFunctionResponse, ETransactionVersion3, type Call, type InvocationsSignerDetails, type Signature, type V3InvocationsSignerDetails, transaction, stark, RPC09, type Invocation, type InvocationsDetailsWithNonce, type AllowArray, type UniversalDetails, type InvokedTransaction, type ProviderInterface, type RpcProviderOptions, Provider, defaultDeployer, defaultPaymaster, logger, PaymasterRpc, type AccountOptions, type CairoVersion, isVersion, config, RPCResponseParser } from "starknet";
import fs from "fs";
import { account1OZSepoliaAddress, account1OZSepoliaPrivateKey, account2TestBraavosSepoliaAddress, account2TestBraavosSepoliaPrivateKey } from "../../../A1priv/A1priv";
import { account1IntegrationOZ8address, account1IntegrationOZ8privateKey } from "../../../A2priv/A2priv";
import { ethAddress, strkAddress } from "../../utils/constants";
import { formatBalance } from "../../utils/formatBalance";
import axios from "axios";
import { blastKey } from "../../../A-MainPriv/mainPriv";
import * as dotenv from "dotenv";
import { DevnetProvider } from "starknet-devnet";
import { ETransactionType } from "@starknet-io/types-js";
dotenv.config();

import { type INVOKE_TXN_V3 } from "@starknet-io/types-js";
import { extractContractHashes, isSierra, type AccountInterface, type SignerInterface, type ETransactionVersion, type PaymasterInterface, type Deployer, type TipType, LibraryError, OutsideExecutionVersion, type BlockIdentifier, type Nonce, type EstimateFeeResponseOverhead, type DeclareContractPayload, type DeployAccountContractPayload, type UniversalDeployerContractPayload, type Invocations, type EstimateFeeBulk, type SimulateTransactionDetails, type SimulateTransactionOverheadResponse, type DeclareContractResponse, type MultiDeployContractResponse, type waitForTransactionOptions, type DeployContractUDCResponse, type DeployTransactionReceiptResponse, type DeclareAndDeployContractPayload, type DeclareDeployUDCResponse, type DeployContractResponse, TypedData, typedData as sourceTypeData, type OutsideExecutionOptions, type OutsideTransaction, type OutsideExecution, type DeclareContractTransaction, type DeployAccountContractTransaction, type AccountInvocationsFactoryDetails, type AccountInvocations, type PaymasterDetails, type PreparedTransaction, type ExecutionParameters, type UserTransaction, type PaymasterFeeEstimate, type ExecutableUserTransaction, src5, outsideExecution, paymaster as sourcePaymaster, provider, type ProviderOptions, type PaymasterOptions, type DeployerInterface } from "starknet";

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

const isUndefined = (value: unknown): value is undefined => {
  return typeof value === 'undefined' || value === undefined;
};


function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failure');
  }
}

type CustomAccountOptions = {
  /** Provider instance or configuration for blockchain interaction */
  provider: { optionsOrProvider: RpcProvider, channel: CustomChannel9 };
  /** Account address on the Starknet network */
  address: string;
  /** Private key or Signer Class instance for signing transactions */
  signer: Uint8Array | string | SignerInterface;
  /** Cairo version to use for this account (optional, auto-detected if not provided) */
  cairoVersion?: CairoVersion;
  /** Transaction version to use for sending transactions (optional) */
  transactionVersion?: constants.SupportedTransactionVersion;
  /** Paymaster configuration for sponsored transactions (optional) */
  paymaster?: PaymasterOptions | PaymasterInterface;
  /** Use of a custom account deployer contract (optional) */
  deployer?: DeployerInterface;
  /**
   * Default tip type to use for sending transactions (optional)
   * @default 'recommendedTip'
   */
  defaultTipType?: TipType;
};

abstract class RawTx {
  public abstract getInvokeRawTxRpc(
    functionInvocation: Invocation,
    details: InvocationsDetailsWithNonce
  ): RPC.RPCSPEC09.INVOKE_TXN_V3;

  public abstract sendInvokeRawTxRpc(transaction: RPC.RPCSPEC09.INVOKE_TXN_V3): Promise<any>

}

// ********** provider *******************************
export class customRpcProvider extends RpcProvider implements RawTx {
  public channel: CustomChannel9;

  constructor(data: { optionsOrProvider: RpcProvider, channel: CustomChannel9 }) {
    super(data.optionsOrProvider);
    this.channel = data.channel;

  }

    public getInvokeRawTxRpc(
    functionInvocation: Invocation,
    details: InvocationsDetailsWithNonce
  ): RPC.RPCSPEC09.INVOKE_TXN_V3 {
    return this.channel.getInvokeRawTxChannel(functionInvocation, details);
  }

  public async sendInvokeRawTxRpc(transaction: RPC.RPCSPEC09.INVOKE_TXN_V3) {

    return this.channel.sendInvokeRawTxChannel(transaction) as Promise<InvokedTransaction>;
  
  }
}


// ********** account *******************************
export class CustomAccount extends customRpcProvider implements AccountInterface {
  public signer: SignerInterface;

  public address: string;

  public cairoVersion: CairoVersion;

  readonly transactionVersion: typeof ETransactionVersion.V3;

  public paymaster: PaymasterInterface;

  public deployer: Deployer;

  public defaultTipType: TipType;

  constructor(options: CustomAccountOptions) {
    const {
      provider,
      address,
      signer,
      cairoVersion,
      transactionVersion,
      paymaster,
      defaultTipType,
    } = options;
    super(provider);
    this.address = address.toLowerCase();
    this.signer = isString(signer) || signer instanceof Uint8Array ? new Signer(signer) : signer;

    if (cairoVersion) {
      this.cairoVersion = cairoVersion.toString() as CairoVersion;
    }
    this.transactionVersion = transactionVersion ?? config.get('transactionVersion');
    this.paymaster = paymaster ? new PaymasterRpc(paymaster) : defaultPaymaster;
    this.deployer = options.deployer ?? defaultDeployer;
    this.defaultTipType = defaultTipType ?? config.get('defaultTipType');

    logger.debug('Account setup', {
      transactionVersion: this.transactionVersion,
      cairoVersion: this.cairoVersion,
      channel: this.channel.id,
    });
  }

  public async extractInvokeRawTx(
    transactions: AllowArray<Call>,
    transactionsDetail: UniversalDetails = {}
  ): Promise<string> {
    const calls = [transactions].flat();
    const detailsWithTip = await this.resolveDetailsWithTip(transactionsDetail);

    // Estimate resource bounds if not provided
    const { resourceBounds: providedResourceBounds } = transactionsDetail;
    let resourceBounds = providedResourceBounds;
    if (!resourceBounds) {
      const estimateResponse = await this.estimateInvokeFee(calls, detailsWithTip);
      resourceBounds = estimateResponse.resourceBounds;
    }

    const accountInvocations = await this.accountInvocationsFactory(
      [{ type: ETransactionType.INVOKE, payload: calls }],
      {
        ...stark.v3Details(detailsWithTip),
        resourceBounds,
        versions: [this.resolveTransactionVersion(transactionsDetail.version)],
        nonce: transactionsDetail.nonce,
        skipValidate: false,
      }
    );

    const invocation = accountInvocations[0];

    const rawTx: RPC.RPCSPEC09.INVOKE_TXN_V3 = this.getInvokeRawTxRpc(
      {
        contractAddress: invocation.contractAddress,
        calldata: invocation.calldata,
        signature: invocation.signature,
      },
      {
        ...stark.v3Details(detailsWithTip),
        resourceBounds: invocation.resourceBounds,
        nonce: invocation.nonce,
        version: invocation.version,
      }
    );
    return json.stringify(rawTx, undefined, 2);
  }

  public async sendInvokeRawTx(
    transaction: string,
  ): Promise<InvokeFunctionResponse> {
   const invocation = json.parse(transaction);
    return this.sendInvokeRawTxRpc(invocation);
  }



  /** @deprecated @hidden */
  // The deprecation tag is meant to discourage use, not to signal future removal
  // it should only be removed if the relationship with the corresponding Provider.create(...) method changes
  static async create(): Promise<never> {
    throw new LibraryError('Not supported');
  }

  public async getNonce(blockIdentifier?: BlockIdentifier): Promise<Nonce> {
    return super.getNonceForAddress(this.address, blockIdentifier);
  }

  protected async getNonceSafe(nonce?: BigNumberish) {
    // Patch DEPLOY_ACCOUNT: RPC getNonce for non-existing address will result in error
    try {
      return num.toBigInt(nonce ?? (await this.getNonce()));
    } catch (error) {
      return 0n;
    }
  }

  /**
   * Retrieves the Cairo version from the network and sets `cairoVersion` if not already set in the constructor.
   * @param classHash if provided detects Cairo version from classHash, otherwise from the account address
   */
  public async getCairoVersion(classHash?: string) {
    if (!this.cairoVersion) {
      const { cairo } = classHash
        ? await super.getContractVersion(undefined, classHash)
        : await super.getContractVersion(this.address);
      this.cairoVersion = cairo;
    }
    return this.cairoVersion;
  } // TODO: TT Cairo version is still needed for invoke on existing contracts

  public async estimateInvokeFee(
    calls: AllowArray<Call>,
    details: UniversalDetails = {}
  ): Promise<EstimateFeeResponseOverhead> {
    // Transform all calls into a single invocation
    const invocations = [{ type: ETransactionType.INVOKE, payload: [calls].flat() }];
    const estimateBulk = await this.estimateFeeBulk(invocations, details);
    return estimateBulk[0]; // Get the first (and only) estimate
  }

  public async estimateDeclareFee(
    payload: DeclareContractPayload,
    details: UniversalDetails = {}
  ): Promise<EstimateFeeResponseOverhead> {
    assert(
      isSierra(payload.contract),
      'Declare fee estimation is not supported for Cairo0 contracts'
    );
    // Transform into invocations for bulk estimation
    const invocations = [
      { type: ETransactionType.DECLARE, payload: extractContractHashes(payload) },
    ];
    const estimateBulk = await this.estimateFeeBulk(invocations, details);
    return estimateBulk[0]; // Get the first (and only) estimate
  }

  public async estimateAccountDeployFee(
    {
      classHash,
      addressSalt = 0,
      constructorCalldata = [],
      contractAddress,
    }: DeployAccountContractPayload,
    details: UniversalDetails = {}
  ): Promise<EstimateFeeResponseOverhead> {
    const compiledCalldata = CallData.compile(constructorCalldata);
    const contractAddressFinal =
      contractAddress ??
      hash.calculateContractAddressFromHash(addressSalt, classHash, compiledCalldata, 0);

    // Transform into invocations for bulk estimation
    const invocations = [
      {
        type: ETransactionType.DEPLOY_ACCOUNT,
        payload: {
          classHash,
          constructorCalldata: compiledCalldata,
          addressSalt,
          contractAddress: contractAddressFinal,
        },
      },
    ];
    const estimateBulk = await this.estimateFeeBulk(invocations, details);
    return estimateBulk[0]; // Get the first (and only) estimate
  }

  public async estimateDeployFee(
    payload: UniversalDeployerContractPayload | UniversalDeployerContractPayload[],
    details: UniversalDetails = {}
  ): Promise<EstimateFeeResponseOverhead> {
    const { calls } = this.deployer.buildDeployerCall(payload, this.address);
    return this.estimateInvokeFee(calls, details);
  }

  public async estimateFeeBulk(
    invocations: Invocations,
    details: UniversalDetails = {}
  ): Promise<EstimateFeeBulk> {
    if (!invocations.length) throw TypeError('Invocations should be non-empty array');
    // skip estimating bounds if user provide bounds
    if (details.resourceBounds)
      return [stark.resourceBoundsToEstimateFeeResponse(details.resourceBounds)];

    const { nonce, blockIdentifier, version, skipValidate } = details;
    const detailsWithTip = await this.resolveDetailsWithTip(details);
    const accountInvocations = await this.accountInvocationsFactory(invocations, {
      ...stark.v3Details(detailsWithTip),
      versions: [
        stark.toTransactionVersion(
          stark.toFeeVersion(this.transactionVersion) || ETransactionVersion3.F3,
          version
        ), // sierra
      ],
      nonce,
      blockIdentifier,
      skipValidate,
    });

    return super.getEstimateFeeBulk(accountInvocations, {
      blockIdentifier,
      skipValidate,
    });
  }

  public async simulateTransaction(
    invocations: Invocations,
    details: SimulateTransactionDetails = {}
  ): Promise<SimulateTransactionOverheadResponse> {
    if (!invocations.length) throw TypeError('Invocations should be non-empty array');
    const {
      nonce,
      blockIdentifier,
      skipValidate = true,
      skipExecute,
      version: providedVersion,
    } = details;
    const detailsWithTip = await this.resolveDetailsWithTip(details);
    const accountInvocations = await this.accountInvocationsFactory(invocations, {
      ...stark.v3Details(detailsWithTip),
      versions: [this.resolveTransactionVersion(providedVersion)],
      nonce,
      blockIdentifier,
      skipValidate,
    });

    return super.getSimulateTransaction(accountInvocations, {
      blockIdentifier,
      skipValidate,
      skipExecute,
    });
  }

  public async execute(
    transactions: AllowArray<Call>,
    transactionsDetail: UniversalDetails = {}
  ): Promise<InvokeFunctionResponse> {
    const calls = [transactions].flat();
    const detailsWithTip = await this.resolveDetailsWithTip(transactionsDetail);

    // Estimate resource bounds if not provided
    const { resourceBounds: providedResourceBounds } = transactionsDetail;
    let resourceBounds = providedResourceBounds;
    if (!resourceBounds) {
      const estimateResponse = await this.estimateInvokeFee(calls, detailsWithTip);
      resourceBounds = estimateResponse.resourceBounds;
    }

    const accountInvocations = await this.accountInvocationsFactory(
      [{ type: ETransactionType.INVOKE, payload: calls }],
      {
        ...stark.v3Details(detailsWithTip),
        resourceBounds,
        versions: [this.resolveTransactionVersion(transactionsDetail.version)],
        nonce: transactionsDetail.nonce,
        skipValidate: false,
      }
    );

    const invocation = accountInvocations[0];

    return this.invokeFunction(
      {
        contractAddress: invocation.contractAddress,
        calldata: invocation.calldata,
        signature: invocation.signature,
      },
      {
        ...stark.v3Details(detailsWithTip),
        resourceBounds: invocation.resourceBounds,
        nonce: invocation.nonce,
        version: invocation.version,
      }
    );
  }

  /**
   * First check if contract is already declared, if not declare it
   * If contract already declared returned transaction_hash is ''.
   * Method will pass even if contract is already declared
   * @param transactionsDetail (optional)
   */
  public async declareIfNot(
    payload: DeclareContractPayload,
    transactionsDetail: UniversalDetails = {}
  ): Promise<DeclareContractResponse> {
    const declareContractPayload = extractContractHashes(payload);
    try {
      await this.getClassByHash(declareContractPayload.classHash);
    } catch (error) {
      return this.declare(payload, transactionsDetail);
    }
    return {
      transaction_hash: '',
      class_hash: declareContractPayload.classHash,
    };
  }

  public async declare(
    payload: DeclareContractPayload,
    details: UniversalDetails = {}
  ): Promise<DeclareContractResponse> {
    assert(isSierra(payload.contract), constants.SYSTEM_MESSAGES.declareNonSierra);

    const declareContractPayload = extractContractHashes(payload);
    const detailsWithTip = await this.resolveDetailsWithTip(details);

    // Estimate resource bounds if not provided
    const { resourceBounds: providedResourceBounds } = details;
    let resourceBounds = providedResourceBounds;
    if (!resourceBounds) {
      const estimateResponse = await this.estimateDeclareFee(payload, detailsWithTip);
      resourceBounds = estimateResponse.resourceBounds;
    }

    const accountInvocations = await this.accountInvocationsFactory(
      [{ type: ETransactionType.DECLARE, payload: declareContractPayload }],
      {
        ...stark.v3Details(detailsWithTip),
        resourceBounds,
        versions: [this.resolveTransactionVersion(details.version)],
        nonce: details.nonce,
        skipValidate: false,
      }
    );

    const declaration = accountInvocations[0];

    return super.declareContract(
      {
        senderAddress: declaration.senderAddress,
        signature: declaration.signature,
        contract: declaration.contract,
        compiledClassHash: declaration.compiledClassHash,
      },
      {
        ...stark.v3Details(detailsWithTip),
        nonce: declaration.nonce,
        resourceBounds: declaration.resourceBounds,
        version: declaration.version,
      }
    );
  }

  public async deploy(
    payload: UniversalDeployerContractPayload | UniversalDeployerContractPayload[],
    details: UniversalDetails = {}
  ): Promise<MultiDeployContractResponse> {
    const { calls, addresses } = this.deployer.buildDeployerCall(payload, this.address);
    const invokeResponse = await this.execute(calls, details);

    return {
      ...invokeResponse,
      contract_address: addresses,
    };
  }

  public async deployContract(
    payload: UniversalDeployerContractPayload | UniversalDeployerContractPayload[],
    details: UniversalDetails & waitForTransactionOptions = {}
  ): Promise<DeployContractUDCResponse> {
    const deployTx = await this.deploy(payload, details);
    const txReceipt = await this.waitForTransaction(deployTx.transaction_hash, details);
    return this.deployer.parseDeployerEvent(
      txReceipt as unknown as DeployTransactionReceiptResponse
    );
  }

  public async declareAndDeploy(
    payload: DeclareAndDeployContractPayload,
    details: UniversalDetails & waitForTransactionOptions = {}
  ): Promise<DeclareDeployUDCResponse> {
    let declare = await this.declareIfNot(payload, details);
    if (declare.transaction_hash !== '') {
      const tx = await this.waitForTransaction(declare.transaction_hash, details);
      declare = { ...declare, ...tx };
    }
    const deploy = await this.deployContract(
      { ...payload, classHash: declare.class_hash },
      details
    );
    return { declare: { ...declare }, deploy };
  }

  public deploySelf = this.deployAccount;

  public async deployAccount(
    {
      classHash,
      constructorCalldata = [],
      addressSalt = 0,
      contractAddress: providedContractAddress,
    }: DeployAccountContractPayload,
    details: UniversalDetails = {}
  ): Promise<DeployContractResponse> {
    const compiledCalldata = CallData.compile(constructorCalldata); // TODO: TT check if we should add abi here to safe compile
    const contractAddress =
      providedContractAddress ??
      hash.calculateContractAddressFromHash(addressSalt, classHash, compiledCalldata, 0);

    const detailsWithTip = await this.resolveDetailsWithTip(details);

    // Estimate resource bounds if not provided
    const { resourceBounds: providedResourceBounds } = details;
    let resourceBounds = providedResourceBounds;
    if (!resourceBounds) {
      const estimateResponse = await this.estimateAccountDeployFee(
        {
          classHash,
          constructorCalldata,
          addressSalt,
          contractAddress,
        },
        detailsWithTip
      );
      resourceBounds = estimateResponse.resourceBounds;
    }

    const accountInvocations = await this.accountInvocationsFactory(
      [
        {
          type: ETransactionType.DEPLOY_ACCOUNT,
          payload: {
            classHash,
            constructorCalldata: compiledCalldata,
            addressSalt,
            contractAddress,
          },
        },
      ],
      {
        ...stark.v3Details(detailsWithTip),
        resourceBounds,
        versions: [this.resolveTransactionVersion(details.version)],
        nonce: constants.ZERO, // DEPLOY_ACCOUNT always uses nonce 0
        skipValidate: false,
      }
    );

    const deployment = accountInvocations[0];

    return super.deployAccountContract(
      {
        classHash: deployment.classHash,
        addressSalt: deployment.addressSalt,
        constructorCalldata: deployment.constructorCalldata,
        signature: deployment.signature,
      },
      {
        ...stark.v3Details(detailsWithTip),
        nonce: deployment.nonce,
        resourceBounds: deployment.resourceBounds,
        version: deployment.version,
      }
    );
  }

  public async signMessage(typedData: TypedData): Promise<Signature> {
    return this.signer.signMessage(typedData, this.address);
  }

  public async hashMessage(typedData: TypedData): Promise<string> {
    return sourceTypeData.getMessageHash(typedData, this.address);
  }

  /**
   * Verify if an account is compatible with SNIP-9 outside execution, and with which version of this standard.
   * @returns {OutsideExecutionVersion} Not compatible, V1, V2.
   * @example
   * ```typescript
   * const result = myAccount.getSnip9Version();
   * // result = "V1"
   * ```
   */
  public async getSnip9Version(): Promise<OutsideExecutionVersion> {
    if (await src5.supportsInterface(this, this.address, constants.SNIP9_V2_INTERFACE_ID)) {
      return OutsideExecutionVersion.V2;
    }
    if (await src5.supportsInterface(this, this.address, constants.SNIP9_V1_INTERFACE_ID)) {
      return OutsideExecutionVersion.V1;
    }
    // Account does not support either version 2 or version 1
    return OutsideExecutionVersion.UNSUPPORTED;
  }

  /**
   * Verify if a SNIP-9 nonce has not yet been used by the account.
   * @param {BigNumberish} nonce SNIP-9 nonce to test.
   * @returns  {boolean} true if SNIP-9 nonce not yet used.
   * @example
   * ```typescript
   * const result = myAccount.isValidSnip9Nonce(1234);
   * // result = true
   * ```
   */
  public async isValidSnip9Nonce(nonce: BigNumberish): Promise<boolean> {
    try {
      const call: Call = {
        contractAddress: this.address,
        entrypoint: 'is_valid_outside_execution_nonce',
        calldata: [num.toHex(nonce)],
      };
      const resp = await this.callContract(call);
      return BigInt(resp[0]) !== 0n;
    } catch (error) {
      throw new Error(`Failed to check if nonce is valid: ${error}`);
    }
  }

  /**
   * Outside transaction needs a specific SNIP-9 nonce, that we get in this function.
   * A SNIP-9 nonce can be any number not yet used ; no ordering is needed.
   * @returns  {string} an Hex string of a SNIP-9 nonce.
   * @example
   * ```typescript
   * const result = myAccount.getSnip9Nonce();
   * // result = "0x28a612590dbc36927933c8ee0f357eee639c8b22b3d3aa86949eed3ada4ac55"
   * ```
   */
  public async getSnip9Nonce(): Promise<string> {
    const nonce = stark.randomAddress();
    const isValidNonce = await this.isValidSnip9Nonce(nonce);
    if (!isValidNonce) {
      return this.getSnip9Nonce();
    }
    return nonce;
  }

  /**
   * Creates an object containing transaction(s) that can be executed by an other account with` Account.executeFromOutside()`, called Outside Transaction.
   * @param {OutsideExecutionOptions} options Parameters of the transaction(s).
   * @param {AllowArray<Call>} calls Transaction(s) to execute.
   * @param {OutsideExecutionVersion} [version] SNIP-9 version of the Account that creates the outside transaction.
   * @param {BigNumberish} [nonce] Outside Nonce.
   * @returns {OutsideTransaction} and object that can be used in `Account.executeFromOutside()`
   * @example
   * ```typescript
   * const now_seconds = Math.floor(Date.now() / 1000);
   * const callOptions: OutsideExecutionOptions = {
      caller: executorAccount.address, execute_after: now_seconds - 3600, execute_before: now_seconds + 3600 };
   * const call1: Call = { contractAddress: ethAddress, entrypoint: 'transfer', calldata: {
   *     recipient: recipientAccount.address, amount: cairo.uint256(100) } };
   * const outsideTransaction1: OutsideTransaction = await signerAccount.getOutsideTransaction(callOptions, call3);
   * // result = {
   * // outsideExecution: {
   * // caller: '0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691',
   * // nonce: '0x28a612590dbc36927933c8ee0f357eee639c8b22b3d3aa86949eed3ada4ac55',
   * // execute_after: 1723650229, execute_before: 1723704229, calls: [[Object]] },
   * // signature: Signature {
   * // r: 67518627037915514985321278857825384106482999609634873287406612756843916814n,
   * // s: 737198738569840639192844101690009498983611654458636624293579534560862067709n, recovery: 0 },
   * // signerAddress: '0x655f8fd7c4013c07cf12a92184aa6c314d181443913e21f7e209a18f0c78492',
   * // version: '2'
   * // }
   * ```
   */
  public async getOutsideTransaction(
    options: OutsideExecutionOptions,
    calls: AllowArray<Call>,
    version?: OutsideExecutionVersion,
    nonce?: BigNumberish
  ): Promise<OutsideTransaction> {
    if (!num.isHex(options.caller) && options.caller !== 'ANY_CALLER') {
      throw new Error(`The caller ${options.caller} is not valid.`);
    }
    const codedCaller: string = num.isHex(options.caller) ? options.caller : constants.OutsideExecutionCallerAny;
    const myCalls: Call[] = [calls].flat();
    const supportedVersion = version ?? (await this.getSnip9Version());
    if (!supportedVersion) {
      throw new Error('This account is not handling outside transactions.');
    }
    const myNonce = nonce ? num.toHex(nonce) : await this.getSnip9Nonce();
    const message = outsideExecution.getTypedData(
      await this.getChainId(),
      {
        caller: codedCaller,
        execute_after: options.execute_after,
        execute_before: options.execute_before,
      },
      myNonce,
      myCalls,
      supportedVersion
    );
    const sign: Signature = await this.signMessage(message);
    const toExecute: OutsideExecution = {
      caller: codedCaller,
      nonce: myNonce,
      execute_after: options.execute_after,
      execute_before: options.execute_before,
      calls: myCalls.map(outsideExecution.getOutsideCall),
    };
    return {
      outsideExecution: toExecute,
      signature: sign,
      signerAddress: this.address,
      version: supportedVersion,
    };
  }

  /**
   * An account B executes a transaction that has been signed by an account A.
   * Fees are paid by B.
   * @param {AllowArray<OutsideTransaction>} outsideTransaction the signed transaction generated by `Account.getOutsideTransaction()`.
   * @param {UniversalDetails} [opts] same options than `Account.execute()`.
   * @returns {InvokeFunctionResponse} same response than `Account.execute()`.
   * @example
   * ```typescript
   * const outsideTransaction1: OutsideTransaction = await signerAccount.getOutsideTransaction(callOptions, call1);
   * const outsideTransaction2: OutsideTransaction = await signerAccount.getOutsideTransaction(callOptions4, call4);
   * const result = await myAccount.executeFromOutside([
      outsideTransaction1,
      outsideTransaction2,
    ]);
   * // result = { transaction_hash: '0x11233...`}
   * ```
   */
  public async executeFromOutside(
    outsideTransaction: AllowArray<OutsideTransaction>,
    opts?: UniversalDetails
  ): Promise<InvokeFunctionResponse> {
    const multiCall = outsideExecution.buildExecuteFromOutsideCall(outsideTransaction);
    return this.execute(multiCall, opts);
  }

  /*
   * Support methods
   */

  /**
   * Helper method to resolve details with tip estimation
   * @private
   */
  private async resolveDetailsWithTip(
    details: UniversalDetails
  ): Promise<UniversalDetails & { tip: BigNumberish }> {
    return {
      ...details,
      tip: details.tip ?? (await this.getEstimateTip())[this.defaultTipType],
    };
  }

  /**
   * Helper method to resolve transaction version
   * @private
   */
  private resolveTransactionVersion(providedVersion?: BigNumberish) {
    return stark.toTransactionVersion(
      this.transactionVersion || ETransactionVersion3.V3,
      providedVersion
    );
  }

  public async buildInvocation(
    call: Array<Call>,
    details: InvocationsSignerDetails
  ): Promise<Invocation> {
    const calldata = transaction.getExecuteCalldata(call, await this.getCairoVersion());
    const signature = !details.skipValidate ? await this.signer.signTransaction(call, details) : [];

    return {
      ...stark.v3Details(details),
      contractAddress: this.address,
      calldata,
      signature,
    };
  }

  public async buildDeclarePayload(
    payload: DeclareContractPayload,
    details: InvocationsSignerDetails
  ): Promise<DeclareContractTransaction> {
    const { classHash, contract, compiledClassHash } = extractContractHashes(payload);
    const compressedCompiledContract = provider.parseContract(contract);

    assert(
      !isUndefined(compiledClassHash) &&
      (details.version === ETransactionVersion3.F3 ||
        details.version === ETransactionVersion3.V3),
      'V3 Transaction work with Cairo1 Contracts and require compiledClassHash'
    );

    const signature = !details.skipValidate
      ? await this.signer.signDeclareTransaction({
        ...details,
        ...stark.v3Details(details),
        classHash,
        compiledClassHash,
        senderAddress: details.walletAddress,
      })
      : [];

    return {
      senderAddress: details.walletAddress,
      signature,
      contract: compressedCompiledContract,
      compiledClassHash,
    };
  }

  public async buildAccountDeployPayload(
    {
      classHash,
      addressSalt = 0,
      constructorCalldata = [],
      contractAddress: providedContractAddress,
    }: DeployAccountContractPayload,
    details: InvocationsSignerDetails
  ): Promise<DeployAccountContractTransaction> {
    const compiledCalldata = CallData.compile(constructorCalldata);
    const contractAddress =
      providedContractAddress ??
      hash.calculateContractAddressFromHash(addressSalt, classHash, compiledCalldata, 0);

    const signature = !details.skipValidate
      ? await this.signer.signDeployAccountTransaction({
        ...details,
        ...stark.v3Details(details),
        classHash,
        contractAddress,
        addressSalt,
        constructorCalldata: compiledCalldata,
      })
      : [];

    return {
      ...stark.v3Details(details),
      classHash,
      addressSalt,
      constructorCalldata: compiledCalldata,
      signature,
    };
  }

  /**
   * Build account invocations with proper typing based on transaction type
   * @private
   */
  public async accountInvocationsFactory(
    invocations: [{ type: typeof ETransactionType.INVOKE; payload: AllowArray<Call> }],
    details: AccountInvocationsFactoryDetails
  ): Promise<
    [({ type: typeof ETransactionType.INVOKE } & Invocation) & InvocationsDetailsWithNonce]
  >;
  public async accountInvocationsFactory(
    invocations: [{ type: typeof ETransactionType.DECLARE; payload: DeclareContractPayload }],
    details: AccountInvocationsFactoryDetails
  ): Promise<
    [
      ({ type: typeof ETransactionType.DECLARE } & DeclareContractTransaction) &
      InvocationsDetailsWithNonce,
    ]
  >;
  public async accountInvocationsFactory(
    invocations: [
      { type: typeof ETransactionType.DEPLOY_ACCOUNT; payload: DeployAccountContractPayload },
    ],
    details: AccountInvocationsFactoryDetails
  ): Promise<
    [
      ({ type: typeof ETransactionType.DEPLOY_ACCOUNT } & DeployAccountContractTransaction) &
      InvocationsDetailsWithNonce,
    ]
  >;
  public async accountInvocationsFactory(
    invocations: Invocations,
    details: AccountInvocationsFactoryDetails
  ): Promise<AccountInvocations>;
  public async accountInvocationsFactory(
    invocations: Invocations,
    details: AccountInvocationsFactoryDetails
  ): Promise<AccountInvocations> {
    const { nonce, blockIdentifier, skipValidate = true } = details;
    const safeNonce = await this.getNonceSafe(nonce);
    const chainId = await this.getChainId();
    const versions = details.versions.map((it) => stark.toTransactionVersion(it));

    // BULK ACTION FROM NEW ACCOUNT START WITH DEPLOY_ACCOUNT
    const tx0Payload: any = 'payload' in invocations[0] ? invocations[0].payload : invocations[0];
    const cairoVersion =
      invocations[0].type === ETransactionType.DEPLOY_ACCOUNT
        ? await this.getCairoVersion(tx0Payload.classHash)
        : await this.getCairoVersion();

    return Promise.all(
      ([] as Invocations).concat(invocations).map(async (transaction, index: number) => {
        const txPayload: any = 'payload' in transaction ? transaction.payload : transaction;
        const signerDetails = {
          ...stark.v3Details(details),
          walletAddress: this.address,
          nonce: num.toBigInt(Number(safeNonce) + index),
          chainId,
          cairoVersion,
          version: versions[0],
          skipValidate,
        };
        const common = {
          type: transaction.type,
          nonce: num.toBigInt(Number(safeNonce) + index),
          blockIdentifier,
          version: versions[0],
        };

        if (transaction.type === ETransactionType.INVOKE) {
          const payload = await this.buildInvocation(
            ([] as Call[]).concat(txPayload),
            signerDetails
          );
          return {
            ...common,
            ...payload,
            ...signerDetails,
          };
        }
        if (transaction.type === ETransactionType.DEPLOY) {
          const { calls } = this.deployer.buildDeployerCall(txPayload, this.address);
          const payload = await this.buildInvocation(calls, signerDetails);
          return {
            ...common,
            ...payload,
            ...signerDetails,
            type: ETransactionType.INVOKE,
          };
        }
        if (transaction.type === ETransactionType.DECLARE) {
          assert(
            isSierra(txPayload.contract),
            'Declare fee estimation is not supported for Cairo0 contracts'
          );
          const payload = await this.buildDeclarePayload(txPayload, signerDetails);
          return {
            ...common,
            ...payload,
            ...signerDetails,
          };
        }
        if (transaction.type === ETransactionType.DEPLOY_ACCOUNT) {
          const payload = await this.buildAccountDeployPayload(txPayload, signerDetails);
          return {
            ...common,
            ...payload,
            ...signerDetails,
          };
        }
        throw Error(`accountInvocationsFactory: unsupported transaction type: ${transaction}`);
      })
    ) as Promise<AccountInvocations>;
  }

  /*
   * SNIP-29 Paymaster
   */

  public async buildPaymasterTransaction(
    calls: Call[],
    paymasterDetails: PaymasterDetails
  ): Promise<PreparedTransaction> {
    // If the account isn't deployed, we can't call the supportsInterface function to know if the account is compatible with SNIP-9
    if (!paymasterDetails.deploymentData) {
      const snip9Version = await this.getSnip9Version();
      if (snip9Version === OutsideExecutionVersion.UNSUPPORTED) {
        throw Error('Account is not compatible with SNIP-9');
      }
    }
    const parameters: ExecutionParameters = {
      version: '0x1',
      feeMode: paymasterDetails.feeMode,
      timeBounds: paymasterDetails.timeBounds,
    };
    let transaction: UserTransaction;
    if (paymasterDetails.deploymentData) {
      if (calls.length > 0) {
        transaction = {
          type: 'deploy_and_invoke',
          invoke: { userAddress: this.address, calls },
          deployment: paymasterDetails.deploymentData,
        };
      } else {
        transaction = {
          type: 'deploy',
          deployment: paymasterDetails.deploymentData,
        };
      }
    } else {
      transaction = {
        type: 'invoke',
        invoke: { userAddress: this.address, calls },
      };
    }
    return this.paymaster.buildTransaction(transaction, parameters);
  }

  public async estimatePaymasterTransactionFee(
    calls: Call[],
    paymasterDetails: PaymasterDetails
  ): Promise<PaymasterFeeEstimate> {
    const preparedTransaction = await this.buildPaymasterTransaction(calls, paymasterDetails);
    return preparedTransaction.fee;
  }

  public async preparePaymasterTransaction(
    preparedTransaction: PreparedTransaction
  ): Promise<ExecutableUserTransaction> {
    let transaction: ExecutableUserTransaction;
    switch (preparedTransaction.type) {
      case 'deploy_and_invoke': {
        const signature = await this.signMessage(preparedTransaction.typed_data);
        transaction = {
          type: 'deploy_and_invoke',
          invoke: {
            userAddress: this.address,
            typedData: preparedTransaction.typed_data,
            signature: stark.signatureToHexArray(signature),
          },
          deployment: preparedTransaction.deployment,
        };
        break;
      }
      case 'invoke': {
        const signature = await this.signMessage(preparedTransaction.typed_data);
        transaction = {
          type: 'invoke',
          invoke: {
            userAddress: this.address,
            typedData: preparedTransaction.typed_data,
            signature: stark.signatureToHexArray(signature),
          },
        };
        break;
      }
      case 'deploy': {
        transaction = {
          type: 'deploy',
          deployment: preparedTransaction.deployment,
        };
        break;
      }
      default:
        throw Error('Invalid transaction type');
    }
    return transaction;
  }

  public async executePaymasterTransaction(
    calls: Call[],
    paymasterDetails: PaymasterDetails,
    maxFeeInGasToken?: BigNumberish
  ): Promise<InvokeFunctionResponse> {
    // Build the transaction
    const preparedTransaction = await this.buildPaymasterTransaction(calls, paymasterDetails);

    // Check the transaction is safe
    // Check gas fee value & gas token address
    // Check that provided calls and builded calls are strictly equal
    sourcePaymaster.assertPaymasterTransactionSafety(
      preparedTransaction,
      calls,
      paymasterDetails,
      maxFeeInGasToken
    );

    // Prepare the transaction, tx is safe here
    const transaction: ExecutableUserTransaction =
      await this.preparePaymasterTransaction(preparedTransaction);

    // Execute the transaction
    return this.paymaster
      .executeTransaction(transaction, preparedTransaction.parameters)
      .then((response) => ({ transaction_hash: response.transaction_hash }));
  }

  /*
   * External methods
   */

  /**
   * Get the Starknet ID for an address
   * @param address - The address to get the Starknet ID for
   * @param StarknetIdContract - The Starknet ID contract address (optional)
   * @returns The Starknet ID for the address
   */
  public async getStarkName(
    address: BigNumberish = this.address, // default to the wallet address
    StarknetIdContract?: string
  ): Promise<string> {
    return super.getStarkName(address, StarknetIdContract);
  }
}

// ********** channel *******************************
export class CustomChannel9 extends RPC09.RpcChannel {

  public getInvokeRawTxChannel(functionInvocation: Invocation, details: InvocationsDetailsWithNonce): RPC.RPCSPEC09.INVOKE_TXN_V3 {
    const transaction = this.buildTransaction(
      {
        type: ETransactionType.INVOKE,
        ...functionInvocation,
        ...details,
      },
      'transaction'
    );
    return transaction;
  }

  public async sendInvokeRawTxChannel(transaction: RPC.RPCSPEC09.INVOKE_TXN_V3) {
    const promise = this.fetchEndpoint('starknet_addInvokeTransaction', {
      invoke_transaction: transaction,
    });
    return this.waitMode ? this.waitForTransaction((await promise).transaction_hash) : promise;
  }

  public async invokeTata(functionInvocation: Invocation, details: InvocationsDetailsWithNonce) {
    const transaction = this.buildTransaction(
      {
        type: ETransactionType.INVOKE,
        ...functionInvocation,
        ...details,
      },
      'transaction'
    );

    const promise = this.fetchEndpoint('starknet_addInvokeTransaction', {
      invoke_transaction: transaction,
    });
  }
}


async function main() {
  // initialize Provider 
  const specialChannel = new CustomChannel9({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const initialProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
  const myProvider = new customRpcProvider({ optionsOrProvider: initialProvider, channel: specialChannel }); // only starknet-devnet
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  if (!(await l2DevnetProvider.isAlive())) {
    console.log("No l2 devnet.");
    process.exit();
  }

  // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_8", specVersion: constants.SupportedRpcVersion.v08 }); // Sepolia Testnet 
  //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.44:9550/rpc/v0_6" }); // local Sepolia Integration node
  //const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno" }); //v0.6.0

  // Check that communication with provider is OK
  console.log(
    // "chain Id =", new CairoBytes31(await myProvider.getChainId()).decodeUtf8(),
    ", rpc", await myProvider.getSpecVersion(),
    ", SN version =", (await myProvider.getBlock()).starknet_version);
  console.log("Provider connected to Starknet Devnet.");

  //process.exit(5);
  // *** Devnet
  const accData = await l2DevnetProvider.getPredeployedAccounts();
  // *** initialize existing predeployed account 0 of Devnet
  const accountAddress0 = accData[0].address;
  const privateKey0 = accData[0].private_key;
  const accountAddress1 = accData[1].address;
  const privateKey1 = accData[1].private_key;
  // *** initialize existing Sepolia Testnet account
  // const accountAddress0 = account1OZSepoliaAddress;
  // const privateKey0 = account1OZSepoliaPrivateKey;
  // *** initialize existing Sepolia Integration account
  // const privateKey0 = account1IntegrationOZprivateKey;
  // const accountAddress0 = account1IntegrationOZaddress;
  // *** initialize existing Argent X mainnet  account
  // const privateKey0 = account4MainnetPrivateKey;
  // const accountAddress0 = account4MainnetAddress
  const account0 = new CustomAccount({ provider: { optionsOrProvider: myProvider, channel: specialChannel }, address: accountAddress0, signer: privateKey0 });
  console.log('existing_ACCOUNT_ADDRESS=', accountAddress0);
  const account1 = new Account({ provider: myProvider, address: accountAddress1, signer: privateKey1 });
  console.log('existing account connected.\n');

  // ********** main code
  const erc20Sierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/erc20OZ070decimals.sierra.json").toString("ascii")) as CompiledSierra;
  const strkContract = new Contract({
    abi: erc20Sierra.abi,
    address: strkAddress,
    providerOrAccount: account0,
  });
  const myCall = strkContract.populate("transfer", {
    recipient: account1.address,
    amount: 2n * 10n ** 16n,
  });
  const jsonTransaction = await account0.extractInvokeRawTx(myCall, { tip: 200n });
  console.log("json =", jsonTransaction);
  const result=await account0.sendInvokeRawTx(jsonTransaction);
  const txR = await myProvider.waitForTransaction(result.transaction_hash);
  console.log("txR =", txR);




  console.log("✅ Test completed.");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
