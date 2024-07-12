import { Account, json, RpcProvider, hash, Contract } from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import {  account0OZSepoliaAddress, account0OZSepoliaPrivateKey } from "../../../A1priv/A1priv";

dotenv.config(); // Load environment variables from .env file

async function main() {
  const provider = new RpcProvider({
    nodeUrl: "https://starknet-mainnet.public.blastapi.io",
  });

  const privateKey0 = process.env.DEPLOYER_PRIVATE_KEY;
  const accountAddress = process.env.DEPLOYER_PUBLIC_KEY;

  const account0 = new Account(provider, accountAddress!, privateKey0!);
  
  // Parse the compiled contract files
  const compiledSierra = json.parse(
    fs
      .readFileSync(
        "MarketFactory.contract_class.json"
      )
      .toString("ascii")
  );
  const compiledCasm = json.parse(
    fs
      .readFileSync(
        "MarketFactory.compiled_contract_class.json"
      )
      .toString("ascii")
  );

  console.log("Using Account Address:", accountAddress!);

  const ch = hash.computeSierraContractClassHash(compiledSierra);
  console.log("Class hash calc =", ch);
  const compCH = hash.computeCompiledClassHash(compiledCasm);
  console.log("compiled class hash =", compCH);

  const deployResponse = await account0.declareAndDeploy({
    contract: compiledSierra,
    casm: compiledCasm,
    constructorCalldata: [accountAddress!],
  });

  // Connect the new contract instance:
  const myTestContract = new Contract(
    compiledSierra.abi,
    deployResponse.deploy.contract_address,
    provider
  );
  console.log(":white_check_mark: Test Contract Class Hash =", deployResponse.declare.class_hash);
  console.log(":white_check_mark: Test Contract connected at =", myTestContract.address);

  return;
}