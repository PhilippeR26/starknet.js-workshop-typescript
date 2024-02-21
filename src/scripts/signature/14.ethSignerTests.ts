// Verify Ethereum signature. 
// Coded with Starknet.js v6.1.2
// launch with npx ts-node src/scripts/signature/14.ethSignerTests.ts

import { Account, CairoVersion, EthSigner, InvocationsSignerDetails, WeierstrassSignatureType, ec, encode, eth, num, constants, stark, types, RPC, DeclareSignerDetails, Contract, json, Call, DeployAccountSignerDetails, RpcProvider } from 'starknet';
import fs from "fs";

//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
async function main() {

  const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
  //const provider = new RpcProvider({ nodeUrl: junoNMtestnet });
  //const provider = new SequencerProvider({ network: constants.NetworkName.SN_GOERLI });
  //resetDevnetNow();
  // initialize existing predeployed account 0 of Devnet
  console.log("Provider connected to Starknet-devnet-rs");  
  
  const myPrivateKey = "0x525bc68475c0955fae83869beec0996114d4bb27b28b781ed2a20ef23121b8de";
  console.log("private key =", myPrivateKey);

  const message = {
    "types": {
      "StarkNetDomain": [
        { "name": "name", "type": "felt" },
        { "name": "version", "type": "felt" },
        { "name": "chainId", "type": "felt" }
      ],
      "Person": [
        { "name": "name", "type": "felt" },
        { "name": "wallet", "type": "felt" }
      ],
      "Mail": [
        { "name": "from", "type": "Person" },
        { "name": "to", "type": "Person" },
        { "name": "contents", "type": "felt" }
      ]
    },
    "primaryType": "Mail",
    "domain": {
      "name": "StarkNet Mail",
      "version": "1",
      "chainId": 1
    },
    "message": {
      "from": {
        "name": "Cow",
        "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
      },
      "to": {
        "name": "Bob",
        "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
      },
      "contents": "Hello, Bob!"
    }
  }

  const contractSierra = json.parse(fs.readFileSync("./compiledContracts/cairo230/PhilTest2.sierra.json").toString("ascii"));
  const contractCasm = json.parse(fs.readFileSync("./compiledContracts/cairo230/PhilTest2.casm.json").toString("ascii"));


  const myEthSigner = new EthSigner(myPrivateKey);
  console.log("pubkey=", await myEthSigner.getPubKey());
  const myEthAccount = new Account(provider, "0x65a822fbee1ae79e898688b5a4282dc79e0042cbed12f6169937fddb4c26641", myEthSigner)

  const sig0 = await myEthSigner.signMessage(message, "0x65a822fbee1ae79e898688b5a4282dc79e0042cbed12f6169937fddb4c26641");
  console.log("signature message =", sig0);


  // ***** transaction
  const myCall: Call = {
    contractAddress: "0x65a822fbee1ae79e898688b5a4282dc79e0042cbed12f6169937fddb4c26641",
    entrypoint: "test",
    calldata: [1, 2]
  }
  const sign1 = await myEthSigner.signTransaction([myCall], {
    version: "0x2",
    walletAddress: "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
    cairoVersion: "1",
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    nonce: 45,
    maxFee: 10 ** 15,
  } as InvocationsSignerDetails);
  console.log("signature tx =", sign1);

  // ******** deploy account
  const myDeployAcc: DeployAccountSignerDetails = {
    version: "0x2",
    contractAddress: "0x65a822fbee1ae79e898688b5a4282dc79e0042cbed12f6169937fddb4c26641",
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    classHash: "0x5f3614e8671257aff9ac38e929c74d65b02d460ae966cd826c9f04a7fa8e0d4",
    constructorCalldata: [1, 2],
    addressSalt: 1234,
    nonce: 45,
    maxFee: 10 ** 15,

    tip: 0,
    paymasterData: [],
    accountDeploymentData: [],
    nonceDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
    feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
    resourceBounds: stark.estimateFeeToBounds(constants.ZERO),
  }

  const sign2 = await myEthSigner.signDeployAccountTransaction(myDeployAcc);
  console.log("deploy account tx =", sign2);

  // ******** declare
  const myDeclare: DeclareSignerDetails = {
    version: "0x2",
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    senderAddress: "0x65a822fbee1ae79e898688b5a4282dc79e0042cbed12f6169937fddb4c26641",
    classHash: "0x5f3614e8671257aff9ac38e929c74d65b02d460ae966cd826c9f04a7fa8e0d4",
    nonce: 45,
    maxFee: 10 ** 15,

    tip: 0,
    paymasterData: [],
    accountDeploymentData: [],
    nonceDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
    feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
    resourceBounds: stark.estimateFeeToBounds(constants.ZERO),
  }

  const sign3 = await myEthSigner.signDeclareTransaction(myDeclare);
  console.log("deploy account tx =", sign3);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
