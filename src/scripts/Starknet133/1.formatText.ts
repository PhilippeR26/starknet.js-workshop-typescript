import { addAddressPadding, encode } from "starknet";

function createUri(id:string){
    const prefix="http:abc/";
    const suffix=".json";
    const idFormatted=encode.removeHexPrefix(addAddressPadding(id));
    return prefix+idFormatted+suffix
}

 console.log(createUri("0x345"));