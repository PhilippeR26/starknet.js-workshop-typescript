// Deploy an OpenZeppelin 0.14.0 account without Introspection in devnet.
// Coded with Starknet.js v6.11.0 & devnet-rs v0.1.1 & starknet-devnet.js v0.0.4

import { RpcProvider, Account, Contract, ec, json, RawArgs, stark, num, uint256, Calldata, CallData, shortString, constants, hash, type BigNumberish, types, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant } from "starknet";
import { deployBraavosAccount, estimateBraavosAccountDeployFee, getBraavosSignature } from "../../braavos/3b.deployBraavos1";
import { DevnetProvider } from "starknet-devnet";
//import { OutsideExecution, OutsideExecutionOptions } from 'starknet';


import fs from "fs";
import * as dotenv from "dotenv";
import { formatBalance } from "../../utils/formatBalance";
import { ethAddress, strkAddress } from "../../utils/constants";
import type { DeployAccountResp } from "../../utils/types";
dotenv.config();

export async function deployAccountNoERC165(myProvider: RpcProvider, account0: Account):Promise<DeployAccountResp> {
  const l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
  
  //
  // *********** Deploy OpenZeppelin 0.14.0 account without Introspection *************
  //

    // Generate public and private key pair.
    const privateKey = stark.randomAddress();
    console.log('New account :\nprivateKey=', privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    console.log('publicKey=', starkKeyPub);
    //declare OZ wallet contract
    const compiledOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelinAccountNoERC165.sierra.json").toString("ascii")
    );
    const casmOZAccount = json.parse(
        fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelinAccountNoERC165.casm.json").toString("ascii")
    );
    const { transaction_hash: declTH, class_hash: decClassHash } = await account0.declareIfNot({ contract: compiledOZAccount, casm: casmOZAccount });
    console.log('OpenZeppelin account class hash =', decClassHash);
    if (declTH) { await myProvider.waitForTransaction(declTH); }

    // Calculate future address of the account
    const OZaccountConstructorCallData = CallData.compile({ publicKey: starkKeyPub });
    const OZcontractAddress = hash.calculateContractAddressFromHash(starkKeyPub, decClassHash, OZaccountConstructorCallData, 0);
    console.log('Precalculated account address=', OZcontractAddress);

    // fund account address before account creation
    await l2DevnetProvider.mint(OZcontractAddress, 10 * 10 ** 18, "WEI");
  await l2DevnetProvider.mint(OZcontractAddress, 10 * 10 ** 18, "FRI");
    // deploy account
    const OZaccount = new Account(myProvider, OZcontractAddress, privateKey);
    const { transaction_hash, contract_address } = await OZaccount.deployAccount({
        classHash: decClassHash,
        constructorCalldata: OZaccountConstructorCallData,
        addressSalt: starkKeyPub,
        contractAddress: OZcontractAddress
    });
    await myProvider.waitForTransaction(transaction_hash);
  console.log('✅ OpenZeppelin 0.14.0 no ERC165 introspection account deployed.');

  const result: DeployAccountResp = {
    account: OZaccount,
    address: OZcontractAddress,
    classH: decClassHash,
    privateK: privateKey,
    publicK: starkKeyPub,
  }
  return result
}