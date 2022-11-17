import { AptosAccount, FaucetClient } from "aptos";
import dotenv from "dotenv";
import { OraoVrf } from "../src";

dotenv.config();

describe("vrf", () => {
    const NODE_URL =
        process.env.APTOS_NODE_URL || "https://fullnode.devnet.aptoslabs.com";
    const FAUCET_URL =
        process.env.APTOS_FAUCET_URL || "https://faucet.devnet.aptoslabs.com";

    const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

    const oraoVrf = new OraoVrf(NODE_URL);
    
    const alice = new AptosAccount();

    before(async () => {
        await faucetClient.fundAccount(alice.address(), 100_000_000);
    });

    it("request", async () => {
        const builder = await oraoVrf.request()
        const [seed, tx] = await builder.signAndSend(alice)
        console.log(seed)

        console.log("Your transaction hash is", tx);

        const randomness = await oraoVrf.waitFulfilled(alice.address(), seed);
        console.log("Your randomness is", randomness)
    });
});
