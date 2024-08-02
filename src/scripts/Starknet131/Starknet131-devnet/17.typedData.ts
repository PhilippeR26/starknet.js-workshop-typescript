import { Account, RpcProvider, typedData, TypedDataRevision, type TypedData } from "starknet";

const typedDataValidate: TypedData  = {
    types: {
        StarknetDomain: [
            { name: 'name', type: 'shortstring' },
            { name: 'version', type: 'shortstring' },
            { name: 'chainId', type: 'shortstring' },
            { name: 'revision', type: 'shortstring'}
           
        ],
        OutsideExecution: [
            { name: "Caller", type: "ContractAddress" },
            { name: "Nonce", type: "felt" },
            { name: "Execute After", type: "u128" },
            { name: "Execute Before", type: "u128" },
            { name: "Calls", type: "Call*" }
        ]
        ,
        Call: [
            { name: "To", type: "ContractAddress" },
            { name: "Selector", type: "selector" },
            { name: "Calldata", type: "felt*" },
          ],
    },
    primaryType: "OutsideExecution",
    domain: {
        name: 'Account.execute_from_outside', 
        version: "2", 
        chainId: "SN_MAIN",
        revision: TypedDataRevision.ACTIVE
    },
    message: {
        Caller: "0x07bbfa74550e2b62bc596e8f1d239121f87cb7ae306c1f9fcb24a88f468aa72c",
        Nonce: "0x01125444",
        "Execute After": "1",
        "Execute Before": "9999999999999",
        Calls: [
            {
                To: "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                Selector: "0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e",
                Calldata: [
                  "0x07bbfa74550e2b62bc596e8f1d239121f87cb7ae306c1f9fcb24a88f468aa72c",
                  "0x408004f1ea3847",
                  "0x0"
                ]
              }
        ],
    },
};

const account=new Account(new RpcProvider({nodeUrl:"ze"}),"0x123","0xabc");
const msgHash = typedData.getMessageHash(typedDataValidate, account.address);
console.log({msgHash});