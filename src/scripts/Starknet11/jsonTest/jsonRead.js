"use strict";
exports.__esModule = true;
//
// launch with npx ts-node 
var fs_1 = require("fs");
var a = {
    name: "",
    addressDevnet: "",
    AddressTestnet: "T",
    AddressTestnet2: "",
    AddressMainnet: ""
};
var key = "AddressTestnet";
console.log(a[key]);
var ERC20addresses = JSON.parse(fs_1["default"].readFileSync("./src/scripts/jsonTest/test.json").toString("ascii"));
console.log("ERC20addresses =", ERC20addresses);
console.log(ERC20addresses.erc20[0]);
console.log(ERC20addresses.erc20[0].name);
console.log(ERC20addresses.erc20[0]["AddressTestnet"]);
var myERC20 = ERC20addresses.erc20.find(function (token) { return token.name = "ECU"; });
console.log("myERC20 =", myERC20);
var addressERC = myERC20[key];
console.log("address =", addressERC);
