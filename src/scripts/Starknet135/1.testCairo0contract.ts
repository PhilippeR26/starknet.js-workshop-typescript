// Test Cairo0 type conformity.
// Launch with npx ts-node src/scripts/Starknet135/1.testCairo0contract.ts
// Coded with Starknet.js v7.1.0

import { json, type LegacyCompiledContract, type Program } from "starknet";
import fs from "fs";


const compiledHelloSierra: LegacyCompiledContract = json.parse(fs.readFileSync("./compiledContracts/cairo060/Account_0_5_1.json").toString("ascii"));
console.log('compiledHelloSierra =', compiledHelloSierra.program.hints);


