//
// launch with npx ts-node 
import fs from "fs";
import ERC20addresses from "./ERC20addresses.json";

export interface objERC20 {
    name: string,
    addressDevnet: string,
    addressTestnet: string,
    addressTestnet2: string,
    addressMainnet: string,
}
const a: objERC20 = {
    name: "TEST",
    addressDevnet: "D",
    addressTestnet: "T",
    addressTestnet2: "",
    addressMainnet: ""
};
type kofERC20 = keyof objERC20;
const key: kofERC20 = "addressDevnet";
console.log(a[key]);
//const ERC20addresses = JSON.parse(fs.readFileSync("./src/scripts/jsonTest/ERC20addresses.json").toString("ascii"));
console.log("ERC20addresses =", ERC20addresses);
console.log(ERC20addresses.erc20[0]);
console.log(ERC20addresses.erc20[0].name);
console.log(ERC20addresses.erc20[0]["addressTestnet"]);
const myERC20: objERC20 | undefined = ERC20addresses.erc20.find((token: objERC20) => { if (token.name == "ETH") { return token } });
console.log("myERC20 =", myERC20);
if (myERC20) {
    const addressERC = myERC20[key];
    console.log("address =", addressERC);
}
const tokenPos = ERC20addresses.erc20.findIndex((token: objERC20) => { if (token.name == "ETH") { return true } });
console.log(tokenPos);
if (myERC20) {
    const test = myERC20.name == "ETH";
    console.log("test=", test)
}
