"use strict";
// test a contract using Zeroable.
// launch with npx ts-node src/scripts/Starknet131/Starknet131-sepolia/2.testZeroable.ts
// Coded with Starknet.js v6.9.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var starknet_1 = require("starknet");
var fs_1 = require("fs");
var dotenv = require("dotenv");
var types_js_1 = require("@starknet-io/types-js");
dotenv.config();
function main() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var myProvider, _c, _d, _e, _f, _g, accountAddress0, privateKey0, account0, rrr, compiledSierra, compiledCasm, constructor, deployResponse, testContract, res0, res1, res3, res4, res2, res5, res6, pt, where, res7, myCalldata, myCall, res8;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    myProvider = new starknet_1.RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
                    // **** local Sepolia Testnet node
                    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
                    // ****  Sepolia Testnet 
                    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
                    //  **** Mainnet 
                    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 
                    _d = (_c = console).log;
                    _e = ["chain Id ="];
                    _g = (_f = starknet_1.shortString).decodeShortString;
                    return [4 /*yield*/, myProvider.getChainId()];
                case 1:
                    _e = _e.concat([_g.apply(_f, [_h.sent()]), ", rpc"]);
                    return [4 /*yield*/, myProvider.getSpecVersion()];
                case 2:
                    // **** local Sepolia Testnet node
                    //const myProvider = new RpcProvider({ nodeUrl: "http://192.168.1.11:9545/rpc/v0_7" }); 
                    // ****  Sepolia Testnet 
                    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" });
                    //  **** Mainnet 
                    // const myProvider = new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/mainnet-juno/v0_7" }); 
                    _d.apply(_c, _e.concat([_h.sent()]));
                    console.log("Provider connected to Starknet");
                    // process.exit(5);
                    // *** initialize existing predeployed account 0 of Devnet
                    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
                    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
                    accountAddress0 = (_a = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS) !== null && _a !== void 0 ? _a : "";
                    privateKey0 = (_b = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY) !== null && _b !== void 0 ? _b : "";
                    account0 = new starknet_1.Account(myProvider, accountAddress0, privateKey0);
                    console.log("Account connected.\n");
                    rrr = types_js_1.ETransactionVersion2.V2;
                    compiledSierra = starknet_1.json.parse(fs_1["default"].readFileSync("./compiledContracts/cairo263/zeroable.sierra.json").toString("ascii"));
                    compiledCasm = starknet_1.json.parse(fs_1["default"].readFileSync("./compiledContracts/cairo263/zeroable.casm.json").toString("ascii"));
                    constructor = starknet_1.CallData.compile([]);
                    return [4 /*yield*/, account0.declareAndDeploy({ contract: compiledSierra, casm: compiledCasm, constructorCalldata: constructor })];
                case 3:
                    deployResponse = _h.sent();
                    console.log(deployResponse);
                    testContract = new starknet_1.Contract(compiledSierra.abi, deployResponse.deploy.contract_address, account0);
                    return [4 /*yield*/, testContract.call("get_nonZero_u128")];
                case 4:
                    res0 = (_h.sent());
                    console.log("NonZero::<u128>", res0);
                    return [4 /*yield*/, testContract.call("get_nonZero_felt")];
                case 5:
                    res1 = _h.sent();
                    console.log("NonZero::<felt252>", res1);
                    return [4 /*yield*/, testContract.call("get_nonZero_u256")];
                case 6:
                    res3 = (_h.sent());
                    console.log("NonZero::<u256>", starknet_1.num.toHex(res3));
                    return [4 /*yield*/, testContract.call("get_nonZero_struct")];
                case 7:
                    res4 = (_h.sent());
                    console.log("struct NonZero::<u256>", res4, "\n", starknet_1.num.toHex(res4.position.z));
                    return [4 /*yield*/, testContract.call("send_nonZero_u64", [200])];
                case 8:
                    res2 = _h.sent();
                    console.log("send NonZero::<u64>", res2);
                    return [4 /*yield*/, testContract.call("send_nonZero_felt", [300])];
                case 9:
                    res5 = _h.sent();
                    console.log("send NonZero::<felt252>", res5);
                    return [4 /*yield*/, testContract.call("send_nonZero_u256", ["0x5656236523452345234523524524510abcabcabcabcabcabcabacabcabbacab"])];
                case 10:
                    res6 = (_h.sent());
                    console.log("send NonZero::<u256>", starknet_1.num.toHex(res6));
                    pt = { x: 100, y: 200, z: "0x5656236523452345234523524524510abcabcabcabcabcabcabacabcabbacab" };
                    where = { position: pt };
                    return [4 /*yield*/, testContract.call("send_nonZero_struct", [where])];
                case 11:
                    res7 = (_h.sent());
                    console.log("send struct NonZero::<u256>", res7);
                    myCalldata = new starknet_1.CallData(testContract.abi);
                    myCall = myCalldata.compile("send_nonZero_struct", { where: where });
                    console.log("myCall=", myCall);
                    return [4 /*yield*/, testContract.call("send_nonZero_struct", myCall)];
                case 12:
                    res8 = _h.sent();
                    console.log("call : send struct NonZero::<u256>", res8);
                    console.log("✅ Test performed.");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return process.exit(0); })["catch"](function (error) {
    console.error(error);
    process.exit(1);
});
