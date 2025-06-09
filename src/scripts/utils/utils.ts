import { provider as providerUtil } from "starknet";
import type { RpcProvider } from "starknet";

/**
 * 
 * @param delay unit is millisecond
 * @returns 
 */
export function wait(delay: number) { // ms
    return new Promise((res) => {
        setTimeout(res, delay);
    });
}

export async function keypress(): Promise<void> {
    process.stdin.setRawMode(true);
    return new Promise(resolve => process.stdin.once('data', data => {
        const byteArray = [...data];
        if (byteArray.length > 0 && byteArray[0] === 3) {
            console.log('^C');
            process.exit(1);
        }
        process.stdin.setRawMode(false);
        resolve();
    }))
}


export async function waitNextBlock(provider: RpcProvider, delay: number) {
    const initBlock = await provider.getBlockNumber();
    let isNewBlock: boolean = false
    while (!isNewBlock) {
        const currentBlock = await provider.getBlockNumber();
        if (currentBlock !== initBlock) {
            isNewBlock = true
        } else {
            await providerUtil.wait(delay);
        }
    }
}
