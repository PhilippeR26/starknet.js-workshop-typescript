import { provider as providerUtil } from "starknet";
import type { RpcProvider } from "starknet";

export function wait(delay: number) { // ms
    return new Promise((res) => {
        setTimeout(res, delay);
    });
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
