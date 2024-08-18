"use strict";
// Collection of functions for Braavos account (Cairo 1) creation
// coded with Starknet.js v6.1.4
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.deployBraavosAccount = exports.estimateBraavosAccountDeployFee = exports.calculateAddressBraavos = exports.getBraavosSignature = void 0;
var starknet_1 = require("starknet");
var types_js_1 = require("@starknet-io/types-js");
var BraavosBaseClassHash = "0x013bfe114fb1cf405bfc3a7f8dbe2d91db146c17521d40dcf57e16d6b59fa8e6";
var BraavosAccountClassHash = "0x00816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253";
function getBraavosSignature(BraavosAddress, BraavosConstructorCallData, starkKeyPubBraavos, version, max_fee, chainId, nonce, privateKeyBraavos) {
    var txnHash = starknet_1.hash.calculateDeployAccountTransactionHash({
        contractAddress: BraavosAddress,
        classHash: BraavosBaseClassHash,
        constructorCalldata: BraavosConstructorCallData,
        salt: starkKeyPubBraavos,
        version: starknet_1.RPC.ETransactionVersion2.V1,
        maxFee: max_fee,
        chainId: chainId,
        nonce: nonce
    });
    // braavos v1.0.0 specific deployment signature :
    // sig[0: 1] - r,s from stark sign on txn_hash
    // sig[2] - actual impl hash - the impl hash we will replace class into
    // sig[3: n - 2] -  auxiliary data - hws public key, multisig, daily withdrawal limit etc
    // sig[n - 2] -  chain_id - guarantees aux sig is not replayed from other chain ids
    // sig[n - 1: n] -  r,s from stark sign on poseidon_hash(sig[2: n-2])
    var parsedOtherSigner = Array(9).fill(0);
    var _a = starknet_1.ec.starkCurve.sign(txnHash, starknet_1.num.toHex(privateKeyBraavos)), r = _a.r, s = _a.s;
    var txnHashPoseidon = starknet_1.hash.computePoseidonHashOnElements(__spreadArray(__spreadArray([
        BraavosAccountClassHash
    ], parsedOtherSigner, true), [
        chainId
    ], false));
    var _b = starknet_1.ec.starkCurve.sign(txnHashPoseidon, starknet_1.num.toHex(privateKeyBraavos)), rPoseidon = _b.r, sPoseidon = _b.s;
    var signature = __spreadArray(__spreadArray([
        r.toString(),
        s.toString(),
        BraavosAccountClassHash.toString()
    ], parsedOtherSigner.map(function (e) { return e.toString(); }), true), [
        chainId.toString(),
        rPoseidon.toString(),
        sPoseidon.toString()
    ], false);
    console.log("Braavos special signature =", signature);
    return signature;
}
exports.getBraavosSignature = getBraavosSignature;
var BraavosConstructor = function (starkKeyPubBraavos) { return starknet_1.CallData.compile({ public_key: starkKeyPubBraavos }); };
function calculateAddressBraavos(privateKeyBraavos) {
    var starkKeyPubBraavos = starknet_1.ec.starkCurve.getStarkKey(starknet_1.num.toHex(privateKeyBraavos));
    var BraavosProxyConstructorCallData = BraavosConstructor(starkKeyPubBraavos);
    return starknet_1.hash.calculateContractAddressFromHash(starkKeyPubBraavos, BraavosBaseClassHash, BraavosProxyConstructorCallData, 0);
}
exports.calculateAddressBraavos = calculateAddressBraavos;
function buildBraavosAccountDeployPayload(privateKeyBraavos, _a, _b) {
    var classHash = _a.classHash, addressSalt = _a.addressSalt, constructorCalldata = _a.constructorCalldata, providedContractAddress = _a.contractAddress;
    var nonce = _b.nonce, chainId = _b.chainId, version = _b.version, maxFee = _b.maxFee;
    return __awaiter(this, void 0, void 0, function () {
        var compiledCalldata, contractAddress, starkKeyPubBraavos, signature;
        return __generator(this, function (_c) {
            compiledCalldata = starknet_1.CallData.compile(constructorCalldata !== null && constructorCalldata !== void 0 ? constructorCalldata : []);
            contractAddress = providedContractAddress !== null && providedContractAddress !== void 0 ? providedContractAddress : calculateAddressBraavos(privateKeyBraavos);
            starkKeyPubBraavos = starknet_1.ec.starkCurve.getStarkKey(starknet_1.num.toHex(privateKeyBraavos));
            signature = getBraavosSignature(contractAddress, compiledCalldata, starkKeyPubBraavos, version, maxFee, chainId, BigInt(nonce), privateKeyBraavos);
            return [2 /*return*/, {
                    classHash: classHash,
                    addressSalt: addressSalt,
                    constructorCalldata: compiledCalldata,
                    signature: signature
                }];
        });
    });
}
function estimateBraavosAccountDeployFee(privateKeyBraavos, provider, _a) {
    var _b = _a === void 0 ? {} : _a, blockIdentifier = _b.blockIdentifier, skipValidate = _b.skipValidate;
    return __awaiter(this, void 0, void 0, function () {
        var version, nonce, chainId, cairoVersion, starkKeyPubBraavos, BraavosAccountAddress, BraavosConstructorCallData, payload, response, suggestedMaxFee;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    version = starknet_1.RPC.ETransactionVersion2.F1;
                    nonce = starknet_1.constants.ZERO;
                    return [4 /*yield*/, provider.getChainId()];
                case 1:
                    chainId = _c.sent();
                    cairoVersion = "1";
                    starkKeyPubBraavos = starknet_1.ec.starkCurve.getStarkKey(starknet_1.num.toHex(privateKeyBraavos));
                    BraavosAccountAddress = calculateAddressBraavos(privateKeyBraavos);
                    BraavosConstructorCallData = BraavosConstructor(starkKeyPubBraavos);
                    return [4 /*yield*/, buildBraavosAccountDeployPayload(privateKeyBraavos, {
                            classHash: BraavosBaseClassHash.toString(),
                            addressSalt: starkKeyPubBraavos,
                            constructorCalldata: BraavosConstructorCallData,
                            contractAddress: BraavosAccountAddress
                        }, {
                            nonce: nonce,
                            chainId: chainId,
                            version: version,
                            walletAddress: BraavosAccountAddress,
                            maxFee: starknet_1.constants.ZERO,
                            cairoVersion: cairoVersion
                        })];
                case 2:
                    payload = _c.sent();
                    console.log("estimate payload =", payload);
                    return [4 /*yield*/, provider.getDeployAccountEstimateFee(__assign({}, payload), { version: version, nonce: nonce }, blockIdentifier, skipValidate)];
                case 3:
                    response = _c.sent();
                    console.log("response estimate fee =", response);
                    suggestedMaxFee = starknet_1.stark.estimatedFeeToMaxFee(response.overall_fee);
                    return [2 /*return*/, suggestedMaxFee];
            }
        });
    });
}
exports.estimateBraavosAccountDeployFee = estimateBraavosAccountDeployFee;
function deployBraavosAccount(privateKeyBraavos, provider, max_fee) {
    return __awaiter(this, void 0, void 0, function () {
        var nonce, starkKeyPubBraavos, BraavosAddress, BraavosConstructorCallData, _a, version, signatureBraavos, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    nonce = starknet_1.constants.ZERO;
                    starkKeyPubBraavos = starknet_1.ec.starkCurve.getStarkKey(starknet_1.num.toHex(privateKeyBraavos));
                    console.log("pubkey =", starkKeyPubBraavos.toString());
                    BraavosAddress = calculateAddressBraavos(privateKeyBraavos);
                    BraavosConstructorCallData = BraavosConstructor(starkKeyPubBraavos);
                    if (!(
                    // console.log("constructor =", BraavosConstructorCallData);
                    max_fee !== null && 
                    // console.log("constructor =", BraavosConstructorCallData);
                    max_fee !== void 0)) return [3 /*break*/, 1];
                    // console.log("constructor =", BraavosConstructorCallData);
                    _a = max_fee;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, estimateBraavosAccountDeployFee(privateKeyBraavos, provider)];
                case 2:
                    _a = (
                    // console.log("constructor =", BraavosConstructorCallData);
                    max_fee = _d.sent());
                    _d.label = 3;
                case 3:
                    // console.log("constructor =", BraavosConstructorCallData);
                    _a;
                    version = types_js_1.ETransactionVersion2.V1;
                    _b = getBraavosSignature;
                    _c = [BraavosAddress,
                        BraavosConstructorCallData,
                        starkKeyPubBraavos,
                        version,
                        max_fee];
                    return [4 /*yield*/, provider.getChainId()];
                case 4:
                    signatureBraavos = _b.apply(void 0, _c.concat([_d.sent(), nonce,
                        privateKeyBraavos]));
                    return [2 /*return*/, provider.deployAccountContract({
                            classHash: BraavosBaseClassHash.toString(),
                            addressSalt: starkKeyPubBraavos,
                            constructorCalldata: BraavosConstructorCallData,
                            signature: signatureBraavos
                        }, {
                            nonce: nonce,
                            maxFee: max_fee,
                            version: version
                        })];
            }
        });
    });
}
exports.deployBraavosAccount = deployBraavosAccount;
