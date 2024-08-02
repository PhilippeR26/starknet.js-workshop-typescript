// util.ts

/**
 * Receives a hex address, converts it to bigint, converts it back to hex.
 * This is done to strip leading zeros.
 * @param address a hex string representation of an address
 * @returns an adapted hex string representation of the address
 */
export function adaptAddress(address: string) {
    return "0x" + BigInt(address).toString(16);
}

/**
 * Receives a varname of the .env file. If not present, an error is generated.
 * @param varName a string containing the name of the variable expected in .env file.
 * @returns a string with the content of the var.
 */
export function ensureEnvVar(varName: string): string {
    if (!process.env[varName]) {
        throw new Error(`Env var ${varName} not set or empty`);
    }
    return process.env[varName] as string;
}
 