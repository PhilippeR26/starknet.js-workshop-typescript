"use strict";
// to reproduce in Typescript the Cairo keccak_u256s_be_inputs()
// coded with Starknet.js v6.13.0 
exports.__esModule = true;
var sha3_1 = require("@noble/hashes/sha3");
var starknet_1 = require("starknet");
function swapU128Endians(val) {
    var res = "";
    for (var i = 0; i < 16; i++) {
        res += val.slice(30 - i * 2, 32 - i * 2);
    }
    return res;
}
var u256array = [
    starknet_1.cairo.uint256("0x0000000000000000000000000000000000000000000000000000000000030201"),
    starknet_1.cairo.uint256("0x0000000000000000000000000000000000000000000000000000000000060504")
];
var hexConcat = starknet_1.encode.addHexPrefix(u256array.reduce(function (res, u256) { return res + starknet_1.uint256.uint256ToBN(u256).toString(16).padStart(64, "0"); }, ""));
console.log({ hexConcat: hexConcat });
var buf = starknet_1.num.hexToBytes(hexConcat);
var h256 = starknet_1.encode.addHexPrefix(starknet_1.encode.buf2hex((0, sha3_1.keccak_256)(buf)));
var hU256 = starknet_1.cairo.uint256(h256);
var swappedEndianLow = swapU128Endians(BigInt(hU256.low).toString(16).padStart(32, "0"));
var swappedEndianHigh = swapU128Endians(BigInt(hU256.high).toString(16).padStart(32, "0"));
var result = starknet_1.encode.addHexPrefix(swappedEndianLow + swappedEndianHigh);
console.log({ result: result });
console.log(BigInt(result));
