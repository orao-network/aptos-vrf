import { AptosAccount, FaucetClient, Network } from "aptos";
import * as dotenv from "dotenv";
import { randomBytes } from "crypto";
import { OraoVrfClient } from "../src";

dotenv.config();

describe("vrf", () => {
    const NODE_URL =
        process.env.APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com";
    const FAUCET_URL =
        process.env.APTOS_FAUCET_URL || "https://faucet.testnet.aptoslabs.com";

    const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

    const oraoVrf = new OraoVrfClient(Network.TESTNET);

    const alice = new AptosAccount();

    before(async () => {
        await faucetClient.fundAccount(alice.address(), 100_000_000);
    });

    it("request", async () => {
        const seed = new Uint8Array(randomBytes(32));
        let txnHash = await oraoVrf.request(alice, seed, {
            expiration_timestamp_secs: "50000000000",
        });
        await oraoVrf.provider.waitForTransaction(txnHash);

        console.log(seed);
        console.log(
            "Your transaction payload is",
            oraoVrf.requestPayload(seed)
        );
        console.log("Your transaction hash is", txnHash);

        const randomness = await oraoVrf.waitFulfilled(alice.address(), seed);
        console.log("Your randomness is", randomness, typeof randomness);
    });
});
