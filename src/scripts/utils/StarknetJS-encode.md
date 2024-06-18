# How to
## encode function parameters :
JS function parameters --> decimal string[] to send to Starknet
```typescript
const params = {amount:10,destination:345}; 
const selectedFunction = "transfer"; 
const myCallData = new CallData(abi);
const result = myCallData.compile(selectedFunction, params);
```
`res = ["10","0","345"]`

## decode function response :
decimal string[] of Starknet response --> JS function response
```typescript
const myCallData = new CallData(abi);
const encodedArray = [123, 0, 34]; 
const res = myCallData.parse("get_owner", encodedArray);
```
`res = {"0": 123,"1": {"Some": 34}}`

## decode function calldata :
decimal string[] to send to Starknet --> JS function parameters
```typescript
const formattedParams = ["0x22","0x64","0x1e240"];
const myCallData = new CallData(abi);
const { inputs } = myCallData.parser.getLegacyFormat().find((abiItem: AbiEntry) => 
abiItem.name === selectedFunction) as FunctionAbi;
const inputsTypes = inputs.map((inp: any) => { return inp.type as string });
const res = myCallData.decodeParameters(inputsTypes, formattedParams);
```
`res = [34028236692093846346337460743176821145634, 123456]`

## encode function response :
JS function response --> decimal string[] of Starknet response
```typescript
const params = [cairo.tuple(300,new CairoOption<BigNumberish>(CairoOptionVariant.Some,50))]; 
const selectedType = "(core::felt252, core::option::Option::<core::integer::u8>)"; 
const iter = params[Symbol.iterator](); 
const structs = CallData.getAbiStruct(abi);
const enums = CallData.getAbiEnum(abi);
const abiExtract = abi.find((abiItem) => abiItem.name === selectedType); 
const inputAbi: AbiEntry = abiExtract ? 
    { name: abiExtract.type, type: abiExtract.name } :
    { name: "literal", type: responseType };
const result = parseCalldataField(iter, inputAbi, structs, enums);
```
`res = ["300","0","50"]`

## encode type :
JS type parameters --> decimal string[] understandable by Starknet 
```typescript
const params = [{p1:10, p2:20}]; 
const selectedType = "PhilTest2::PhilTest2::Order"; 
const iter = params[Symbol.iterator](); 
const structs = CallData.getAbiStruct(abi);
const enums = CallData.getAbiEnum(abi);
const abiExtract = abi.find((abiItem) => abiItem.name === selectedType); 
const inputAbi:AbiEntry = {name:abiExtract.type,type: abiExtract.name};
const result = parseCalldataField(iter, inputAbi, structs, enums);
```
`res = ["10","20"]`

## decode type : 
decimal string[] understandable by Starknet --> JS type parameters
```typescript
const myCallData = new CallData(abi);
const encodedArray = [34,67889]; 
const res = myCallData.decodeParameters("PhilTest2::PhilTest2::Order", encodedArray);
```
`res = {"p1": 34,"p2": 67889}

## Nota :
These examples are extracted from the encode/decode tool : https://starknet-encode-decode.vercel.app/
