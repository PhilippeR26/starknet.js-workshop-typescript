import { json } from "starknet";
import fs from "fs";

export const compiledSierraStake = json.parse(fs.readFileSync("./compiledContracts/cairo284/contracts_Staking.contract_class_361.json").toString("ascii"));
export const compiledSierraPool = json.parse(fs.readFileSync("./compiledContracts/cairo284/contracts_Pool.contract_class_361.json").toString("ascii"));
export const strkSierra = json.parse(fs.readFileSync("./compiledContracts/cairo264/openZeppelin14/openzeppelin_ERC20.sierra.json").toString("ascii"));
export const STAKING_ADDRESS = "0x03745ab04a431fc02871a139be6b93d9260b0ff3e779ad9c8b377183b23109f1" as const; 


