"use strict";
// test u96 Cairo type.
// launch with npx ts-node src/scripts/Starknet132/Starknet132-devnet/4.u96.ts
// Coded with Starknet.js v6.14.1+experimental, Starknet-devnet-rs v0.2.0
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
var starknet_devnet_1 = require("starknet-devnet");
dotenv.config();
//          👇👇👇
// 🚨🚨🚨 launch 'cargo run --release -- --seed 0' in devnet-rs directory before using this script
//          👆👆👆
function main() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var myProvider, l2DevnetProvider, _c, _d, _e, _f, _g, privateKey0, accountAddress0, account0, testSierra, testCasm, deployResponse, myTestContract, myU96, myCalldata1, myCallData, myCalldata, myCall, resp1;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    myProvider = new starknet_1.RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
                    l2DevnetProvider = new starknet_devnet_1.DevnetProvider({ timeout: 40000 });
                    return [4 /*yield*/, l2DevnetProvider.isAlive()];
                case 1:
                    if (!(_h.sent())) {
                        console.log("No l2 devnet.");
                        process.exit();
                    }
                    _d = (_c = console).log;
                    _e = ["chain Id ="];
                    _g = (_f = starknet_1.shortString).decodeShortString;
                    return [4 /*yield*/, myProvider.getChainId()];
                case 2:
                    _e = _e.concat([_g.apply(_f, [_h.sent()]), ", rpc"]);
                    return [4 /*yield*/, myProvider.getSpecVersion()];
                case 3:
                    _d.apply(_c, _e.concat([_h.sent()]));
                    console.log("Provider connected to Starknet-devnet-rs");
                    privateKey0 = (_a = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY) !== null && _a !== void 0 ? _a : "";
                    accountAddress0 = (_b = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS) !== null && _b !== void 0 ? _b : "";
                    account0 = new starknet_1.Account(myProvider, accountAddress0, privateKey0);
                    console.log("Account 0 connected.\n");
                    testSierra = starknet_1.json.parse(fs_1["default"].readFileSync("./compiledContracts/cairo282/u96.sierra.json").toString("ascii"));
                    testCasm = starknet_1.json.parse(fs_1["default"].readFileSync("./compiledContracts/cairo282/u96.casm.json").toString("ascii"));
                    return [4 /*yield*/, account0.declareAndDeploy({
                            contract: testSierra,
                            casm: testCasm
                        })];
                case 4:
                    deployResponse = _h.sent();
                    myTestContract = new starknet_1.Contract(testSierra.abi, deployResponse.deploy.contract_address, myProvider);
                    console.log('Test Contract connected at =', myTestContract.address);
                    myU96 = Math.pow(2n, 90n);
                    myCalldata1 = starknet_1.CallData.compile([myU96]);
                    console.log("CallData.compile =", myCalldata1);
                    myCallData = new starknet_1.CallData(myTestContract.abi);
                    myCalldata = myCallData.compile("test_u96", {
                        inp: myU96
                    });
                    console.log("myCallData.compile =", myCalldata);
                    myCall = myTestContract.populate("test_u96", { inp: myU96 });
                    console.log("myContract.populate =", myCall);
                    return [4 /*yield*/, myTestContract.call("test_u96", [myU96])];
                case 5:
                    resp1 = _h.sent();
                    console.log("test_u96 =", resp1, starknet_1.num.toHex(resp1));
                    console.log('✅ Test completed.');
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
