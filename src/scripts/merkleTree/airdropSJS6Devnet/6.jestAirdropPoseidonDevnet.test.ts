// Test a Merkle tree hashed with Poseidon.
// Coded with Starknet.js v6.17.0 and Starknet-devnet-rs v0.2.0
// Launch with npx jest src/scripts/merkleTree/airdropSJS6Devnet/6.jestAirdropPoseidonDevnet.test.ts

import { Account, json, Contract, RpcProvider, RPC, num, uint256, Uint256, Calldata, CallData, Call, encode, addAddressPadding, CairoBytes31 } from "starknet";
import * as Merkle from "starknet-merkle-tree";
import * as dotenv from "dotenv";
import fs from "fs";
import { DevnetProvider } from "starknet-devnet";
dotenv.config();

//    👇👇👇
// 🚨🚨🚨 
// 🚨🚨🚨 launch starknet-devnet-rs 'cargo run --release -- --seed 0' before using this script
//    👆👆👆




describe('Airdrop contract tests', () => {
    const provider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" }); // only for starknet-devnet-rs
    // initialize existing pre-deployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    const accountAddress0 = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
    const privateKey0 = "0x71d7bb07b9a64f6f78ac4c816aff4da9";
    const account0 = new Account({ provider, address: accountAddress0, signer: privateKey0 });
    const accountAddress1 = "0x78662e7352d062084b0010068b99288486c2d8b914f6e2a55ce945f8792c8b1";
    const privateKey1 = "0xe1406455b7d66b1690803be066cbe5e";
    const account1 = new Account({ provider, address: accountAddress1, signer: privateKey1 });
    const accountAddress2 = "0x49dfb8ce986e21d354ac93ea65e6a11f639c1934ea253e5ff14ca62eca0f38e";
    const privateKey2 = "0xa20a02f0ac53692d144b20cb371a60d7";
    const account2 = new Account({ provider, address: accountAddress2, signer: privateKey2 });
    const accountAddress3 = "0x4f348398f859a55a0c80b1446c5fdc37edb3a8478a32f10764659fc241027d3";
    const privateKey3 = "0xa641611c17d4d92bd0790074e34beeb7";
    const account3 = new Account({ provider, address: accountAddress3, signer: privateKey3 });
    const accountAddress8 = "0x4d8bb41636b42d3c69039f3537333581cc19356a0c93904fa3e569498c23ad0";
    const privateKey8 = "0xb467066159b295a7667b633d6bdaabac";
    const account8 = new Account({ provider, address: accountAddress8, signer: privateKey8 });
    const accountAddress9 = "0x4b3f4ba8c00a02b66142a4b1dd41a4dfab4f92650922a3280977b0f03c75ee1";
    const privateKey9 = "0x57b2f8431c772e647712ae93cc616638";
    const account9 = new Account({ provider, address: accountAddress9, signer: privateKey9 });
    //const account0 = new Account(provider, accountAddress0, privateKey0, undefined, RPC.ETransactionVersion.V2);
    let erc20Contract: Contract;
    let merkleVerifyContract: Contract;
    let airdropContract: Contract;
    let tree: Merkle.StarknetMerkleTree;
    let l2DevnetProvider: DevnetProvider;
    const initialConsolation = 3n;
    beforeAll(async () => {
        l2DevnetProvider = new DevnetProvider({ timeout: 40_000 });
        if (!(await l2DevnetProvider.isAlive())) {
            console.log("No l2 devnet.");
            process.exit();
        }
        console.log(
            "chain Id =", new CairoBytes31(await provider.getChainId()).decodeUtf8(),
            ", rpc", await provider.getSpecVersion(),
            ", SN version =", (await provider.getBlock()).starknet_version);
        console.log("Provider connected to Starknet-devnet");
        console.log("Account 0 connected.\n");

        tree = Merkle.StarknetMerkleTree.load(
            JSON.parse(fs.readFileSync('./src/scripts/merkleTree/airdropSJS6Devnet/treeListAddressPoseidonDevnet.json', 'ascii'))
        );

        // ********* deploy ERC20
        const compiledSierraERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.sierra.json").toString("ascii"));
        const compiledCasmERC20 = json.parse(fs.readFileSync("compiledContracts/cairo220/erc20OZ070.casm.json").toString("ascii"));
        const myCallERC20 = new CallData(compiledSierraERC20.abi);
        const myConstructorERC20: Calldata = myCallERC20.compile("constructor", {
            name: "Starknet.js-v6-celebration",
            symbol: "SJS6",
            initial_supply: 40000,
            recipient: account0.address,
        });
        const deployResponseERC20 = await account0.declareAndDeploy({
            contract: compiledSierraERC20,
            casm: compiledCasmERC20,
            constructorCalldata: myConstructorERC20
        }, { tip: 0 });
        const erc20Address = deployResponseERC20.deploy.contract_address;
        const erc20ClassHash = deployResponseERC20.declare.class_hash;
        console.log("ERC20 contract :");
        console.log("class_hash =", erc20ClassHash);
        console.log("address =", erc20Address);
        erc20Contract = new Contract({ abi: compiledSierraERC20.abi, address: erc20Address, providerOrAccount: account0 });


        // ******** deploy MerkleVerify
        const compiledSierraMerkleVerify = json.parse(fs.readFileSync("compiledContracts/cairo2150/merkle_verify_poseidon_Merkle.contract_class.json").toString("ascii"));
        const compiledCasmMerkleVerify = json.parse(fs.readFileSync("compiledContracts/cairo2150/merkle_verify_poseidon_Merkle.compiled_contract_class.json").toString("ascii"));
        const myCallMerkleVerify = new CallData(compiledSierraMerkleVerify.abi);
        const root = tree.root;
        console.log("root =", num.toHex64(root));
        const myConstructorMerkleVerify: Calldata = myCallMerkleVerify.compile("constructor", {
            merkle_root: root,
        });
        const deployResponse0 = await account0.declareAndDeploy({
            contract: compiledSierraMerkleVerify,
            casm: compiledCasmMerkleVerify,
            constructorCalldata: myConstructorMerkleVerify
        }, { tip: 0 });
        const merkleAddress = deployResponse0.deploy.contract_address;
        const merkleClassHash = deployResponse0.declare.class_hash;
        console.log("MerkleVerify contract :");
        console.log("class_hash =", merkleClassHash);
        console.log("address =", merkleAddress);
        merkleVerifyContract = new Contract({ abi: compiledSierraMerkleVerify.abi, address: merkleAddress, providerOrAccount: account0 });


        // ********* deploy airdrop contract
        const compiledSierraAirdrop = json.parse(fs.readFileSync("./compiledContracts/cairo2150/airdrop_airdrop.contract_class.json").toString("ascii"));
        const compiledCasmAirdrop = json.parse(fs.readFileSync("./compiledContracts/cairo2150/airdrop_airdrop.compiled_contract_class.json").toString("ascii"));
        const myCallAirdrop = new CallData(compiledSierraAirdrop.abi);
        const myConstructorAirdrop: Calldata = myCallAirdrop.compile("constructor", {
            erc20_address: erc20Address,
            merkle_address: merkleAddress,
            erc20_owner: account0.address,
            start_time: 10, // no date of airdrop start
            consolation_remaining: initialConsolation,
        });
        const deployResponse = await account0.declareAndDeploy({
            contract: compiledSierraAirdrop,
            casm: compiledCasmAirdrop,
            constructorCalldata: myConstructorAirdrop
        }, { tip: 0 });
        const airdropAddress = deployResponse.deploy.contract_address;
        const airdropClassHash = deployResponse.declare.class_hash;
        console.log("Airdrop contract :");
        console.log("class_hash =", airdropClassHash);
        console.log("address =", airdropAddress);
        airdropContract = new Contract({ abi: compiledSierraAirdrop.abi, address: airdropAddress, providerOrAccount: account0 });

        // ********* authorize the Airdrop contract to transfer some tokens
        const authorize: Call = erc20Contract.populate("approve", {
            spender: airdropAddress,
            amount: 40_000,
        });
        const tx = await account0.execute(authorize, { tip: 0 });
        const txR = await provider.waitForTransaction(tx.transaction_hash);
        console.log("authorize success =", txR.isSuccess());

    });

    test("initial values", async () => {
        const merkleAddr = await airdropContract.call("get_merkle_address", []);
        expect(merkleAddr).toBe(BigInt(merkleVerifyContract.address));
        const erc20Addr = await airdropContract.call("get_erc20_address", []);
        expect(erc20Addr).toBe(BigInt(erc20Contract.address));
        const getTime = await airdropContract.call("get_start_time", []);
        console.log("getTime=", getTime);
        expect(getTime).toBe(10n);
        const getQtyAirdropped = await airdropContract.call("qty_airdropped", []);
        expect(getQtyAirdropped).toBe(0n);
        const getRemaining = await airdropContract.call("remaining_consolation", []);
        expect(getRemaining).toBe(initialConsolation);
        const done = await airdropContract.call("is_address_airdropped", [account9.address]);
        expect(done).toBe(false);
    });

    test("is airdropped before airdrop", async () => {
        const claimAddress = encode.sanitizeHex(account1.address).toLowerCase();
        const indexAddress = tree.dump().values.findIndex((leaf, idx: number) => encode.sanitizeHex(leaf.value[0]).toLowerCase() == claimAddress);
        expect(indexAddress).not.toBe(-1);
        const leaf = tree.getInputData(indexAddress);
        const result0 = await airdropContract.call("is_address_airdropped", [leaf[0]]);
        expect(result0).toBe(false);
        const result1 = await airdropContract.call("is_address_consoled", [leaf[0]]);
        expect(result1).toBe(false);
    });

    test("claim when whitelisted", async () => {
        const claimAddress = addAddressPadding(account1.address);
        const indexAddress = tree.dump().values.findIndex((leaf, idx: number) => encode.sanitizeHex(leaf.value[0]).toLowerCase() == claimAddress);
        expect(indexAddress).not.toBe(-1);
        const leaf = tree.getInputData(indexAddress);
        const proof = tree.getProof(indexAddress);
        const amount: Uint256 = { low: leaf[1], high: leaf[2] };
        const myCall = airdropContract.populate("claim_airdrop", {
            amount,
            proof
        });
        const txResp = await account1.execute(myCall, { tip: 0 });

        const txR = await provider.waitForTransaction(txResp.transaction_hash);
        expect(txR.isSuccess()).toBe(true);

        const balance = await erc20Contract.call("balanceOf", [account1.address]);
        expect(balance).toBe(900n);

        const done = await airdropContract.call("is_address_airdropped", [account1.address]);
        expect(done).toBe(true);

        const isCons = await airdropContract.call("is_address_consoled", [account1.address]);
        expect(isCons).toBe(false);

        const qtyAirdrop = await airdropContract.call("qty_airdropped", []);
        expect(qtyAirdrop).toBe(900n);

        const remainCons = await airdropContract.call("remaining_consolation", []);
        expect(remainCons).toBe(initialConsolation);

        let mess: string = "";
        try { const res = await account1.execute(myCall, { tip: 0 }) } catch (err) {
            mess = (err as Error).message;
        }
        expect(mess.includes("Address already airdropped")).toBe(true); // try to claim again

        let mess2: string = "";
        const myCall2 = airdropContract.populate("claim_airdrop", {
            amount,
            proof: [0] //  voluntarily wrong proof
        });
        try { const res = await account1.execute(myCall2, { tip: 0 }) } catch (err) {
            mess2 = (err as Error).message;
        }
        expect(mess2.includes("Address already airdropped")).toBe(true); // malicious case : try to be consoled with a voluntarily wrong proof after airdropped performed with the proper proof.

        const result2 = await airdropContract.call("is_address_airdropped", [account2.address]);
        expect(result2).toBe(false);
        const isCons2 = await airdropContract.call("is_address_consoled", [account2.address]);
        expect(isCons2).toBe(false);
        const myCall3 = airdropContract.populate("claim_airdrop", {
            amount: 1,
            proof: [0] // voluntarily wrong proof, to obtain a consolation
        });
        const res3 = await account2.execute(myCall3, { tip: 0 }); // get consolation 
        await provider.waitForTransaction(res3.transaction_hash);
        const isCons3 = await airdropContract.call("is_address_consoled", [account2.address]);
        expect(isCons3).toBe(true);
        const claimAddress4 = addAddressPadding(account2.address);
        const indexAddress4 = tree.dump().values.findIndex((leaf, idx: number) => encode.sanitizeHex(leaf.value[0]).toLowerCase() == claimAddress4);
        expect(indexAddress4).not.toBe(-1);
        const leaf4 = tree.getInputData(indexAddress4);
        const proof4 = tree.getProof(indexAddress4);
        const amount4: Uint256 = { low: leaf4[1], high: leaf4[2] };
        const myCall4 = airdropContract.populate("claim_airdrop", {
            amount: amount4,
            proof: proof4 // with the proper proof
        });
        let mess4: string = "";
        try { const res = await account2.execute(myCall4, { tip: 0 }); } catch (err) {
            mess4 = (err as Error).message;
        }
        expect(mess4.includes("Malicious. Already consoled.")).toBe(true); // malicious case : try to claim with proper proof after consolation made by using voluntarily a wrong proof.

        // await expect(account1.execute(myCall)).rejects.toThrow(); 
    });

    test("claim when not whitelisted", async () => {
        const claimAddress = addAddressPadding(account9.address).toLowerCase();
        const indexAddress = tree.dump().values.findIndex((leaf, idx: number) => encode.sanitizeHex(leaf.value[0]).toLowerCase() == claimAddress);
        expect(indexAddress).toBe(-1);
        const amount: Uint256 = { low: 50, high: 0 };
        const myCall = airdropContract.populate("claim_airdrop", {
            amount,
            proof: [0]
        });
        const txResp = await account9.execute(myCall, { tip: 0 });

        const txR = await provider.waitForTransaction(txResp.transaction_hash);
        expect(txR.isSuccess()).toBe(true);

        const balance = await erc20Contract.call("balanceOf", [account9.address]);
        expect(balance).toBe(1n);

        const done = await airdropContract.call("is_address_airdropped", [account9.address]);
        expect(done).toBe(false);

        const isCons = await airdropContract.call("is_address_consoled", [account9.address]);
        expect(isCons).toBe(true);

        const qtyAirdrop = await airdropContract.call("qty_airdropped", []);
        expect(qtyAirdrop).toBe(900n);

        const remainCons = await airdropContract.call("remaining_consolation", []);
        expect(remainCons).toBe(initialConsolation - 2n);

        let mess: string = "";
        try { const res = await account9.execute(myCall, { tip: 0 }) } catch (err) {
            mess = (err as Error).message;
        }
        expect(mess.includes("Address already consoled")).toBe(true); // try to claim again


        const remainCons2 = await airdropContract.call("remaining_consolation", []);
        expect(remainCons2).toBe(1n);
        const res = await account8.execute(myCall, { tip: 0 });
        const remainCons3 = await airdropContract.call("remaining_consolation", []);
        expect(remainCons3).toBe(0n);
        let mess2: string = "";
        try { const res = await account8.execute(myCall, { tip: 0 }) } catch (err) {
            mess2 = (err as Error).message;
        }
        expect(mess2.includes("Too late, no more consol. prize")).toBe(true); // 0 consolation prize
    });

    test("claim before start", async () => {
        // ********* deploy new airdrop contract
        const compiledSierraAirdrop = json.parse(fs.readFileSync("./compiledContracts/cairo240/airdropSJS6.sierra.json").toString("ascii"));
        const compiledCasmAirdrop = json.parse(fs.readFileSync("./compiledContracts/cairo240/airdropSJS6.casm.json").toString("ascii"));
        const lastBlockTime = (await provider.getBlock("latest")).timestamp;
        console.log("lastBlockTime=", lastBlockTime);
        const myCallAirdrop = new CallData(compiledSierraAirdrop.abi);
        const myConstructorAirdrop: Calldata = myCallAirdrop.compile("constructor", {
            erc20_address: erc20Contract.address,
            merkle_address: merkleVerifyContract.address,
            erc20_owner: account0.address,
            start_time: lastBlockTime + 10000, // date in the future
            consolation_remaining: 10_000,
        });
        const deployResponse2 = await account0.declareAndDeploy({
            contract: compiledSierraAirdrop,
            casm: compiledCasmAirdrop,
            constructorCalldata: myConstructorAirdrop
        }, { tip: 0 });
        const airdropAddress2 = deployResponse2.deploy.contract_address;
        const airdropClassHash2 = deployResponse2.declare.class_hash;
        const airdrop2Contract = new Contract({ abi: compiledSierraAirdrop.abi, address: airdropAddress2, providerOrAccount: account1 });
        const blTime = await airdrop2Contract.call("get_current_time", []);
        console.log("current block time=", blTime);
        const claimAddress = encode.sanitizeHex(account1.address).toLowerCase();
        const indexAddress = tree.dump().values.findIndex((leaf, idx: number) => encode.sanitizeHex(leaf.value[0]).toLowerCase() == claimAddress);
        expect(indexAddress).not.toBe(-1);
        const leaf = tree.getInputData(indexAddress);
        const proof = tree.getProof(indexAddress);
        const amount: Uint256 = { low: leaf[1], high: leaf[2] };
        const myCall2 = airdrop2Contract.populate("claim_airdrop", {
            amount,
            proof
        });
        let mess: string = "";
        try {
            const res = await account1.execute(myCall2, { tip: 0 });
            console.log("a")
        } catch (err) {
            mess = (err as Error).message;
        }
        expect(mess.includes("Airdrop has not started yet.")).toBe(true); // try to claim in advance


    })
});