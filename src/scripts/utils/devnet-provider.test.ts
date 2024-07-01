import { DevnetProvider, BalanceUnit, MintResponse } from "starknet-devnet";

describe("DevnetProvider", ()=> {
    const devnetProvider = new DevnetProvider();

    beforeEach( async  ()=> {
        await devnetProvider.restart();
    });

    test("should have a healthcheck endpoint", async ()=> {
        //const devnetProvider = new DevnetProvider();
        const isAlive = await devnetProvider.isAlive();
        console.log({isAlive});
        expect(isAlive).toBe(true);
    });

    test("should have predeployed accounts", async function () {
        const accounts = await devnetProvider.getPredeployedAccounts();
        expect(accounts.length>0).toBe(true);
    });

    function assertMintResp(resp: MintResponse, expectedAmount: number, expectedUnit: BalanceUnit) {
        expect(resp.tx_hash).toMatch(/^0x[0-9a-fA-F]+/);
        expect(resp.new_balance).toEqual(BigInt(expectedAmount));
        expect(resp.unit).toEqual(expectedUnit);
    }

    describe("minting", function () {
        const DUMMY_ADDRESS = "0x1";
        const DUMMY_AMOUNT = 20;

        test("works for WEI", async function () {
            const devnetProvider = new DevnetProvider();
            const mintResp = await devnetProvider.mint(DUMMY_ADDRESS, DUMMY_AMOUNT, "WEI");
            assertMintResp(mintResp, DUMMY_AMOUNT, "WEI");
        });

        test("works for FRI", async function () {
            const devnetProvider = new DevnetProvider();
            const mintResp = await devnetProvider.mint(DUMMY_ADDRESS, DUMMY_AMOUNT, "FRI");
            assertMintResp(mintResp, DUMMY_AMOUNT, "FRI");
        });

        test("works without specifying the unit", async function () {
            const devnetProvider = new DevnetProvider();
            const mintResp = await devnetProvider.mint(DUMMY_ADDRESS, DUMMY_AMOUNT);
            assertMintResp(mintResp, DUMMY_AMOUNT, "WEI");
        });
    });
});
