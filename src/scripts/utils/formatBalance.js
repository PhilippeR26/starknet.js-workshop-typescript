"use strict";
exports.__esModule = true;
exports.formatBalance = void 0;
function formatBalance(qty, decimals) {
    var balance = String("0").repeat(decimals) + qty.toString();
    var rightCleaned = balance.slice(-decimals).replace(/(\d)0+$/gm, '$1');
    var leftCleaned = BigInt(balance.slice(0, balance.length - decimals)).toString();
    return leftCleaned + "." + rightCleaned;
}
exports.formatBalance = formatBalance;
