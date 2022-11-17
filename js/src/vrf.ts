import { AptosAccount, AptosClient, HexString, MaybeHexString } from "aptos";
import { NetworkData, ORAO_ADDRESS, PetraWallet, PontemWallet, RequestData, TransactionPayload } from ".";
import { randomBytes } from "crypto"

export class OraoVrf {
    private client: AptosClient;

    constructor(nodeUrl: string) {
        this.client = new AptosClient(nodeUrl);
    }

    async request(
        seed?: Uint8Array
    ): Promise<RequestBuilder> {
        const data = await this.getNetworkData();
        if (!data) {
            throw new Error("Network is not initialized.");
        }
        const coinType = data["coin_type"];
        if (!seed) {
            if (typeof window === 'undefined') { // node
                seed = new Uint8Array(randomBytes(32))
            } else { // browser
                seed = new Uint8Array(32);
                crypto.getRandomValues(seed);
            }
        }
        const payload: TransactionPayload = {
            arguments: [
                seed
            ],
            function: `${ORAO_ADDRESS}::vrf::request`,
            type: "entry_function_payload",
            type_arguments: [coinType]
        }
        return new RequestBuilder(this.client, payload)
    }

    async waitFulfilled(owner: MaybeHexString, seed: Uint8Array): Promise<Uint8Array> {
        return new Promise(async (resolve, reject) => {
            while (true) {
                try {
                    const randomness = await this.getRandomness(owner, Buffer.from(seed).toString("hex"))
                    if (randomness.length) {
                        resolve(randomness)
                        break;
                    }
                } catch (e) {
                    reject(e);
                    break;
                }
                await new Promise(f => setTimeout(f, 1000));
            }
        })
    }

    async getNetworkData() {
        const resources = await this.client.getAccountResources(ORAO_ADDRESS);
        const data = resources.find(
            (resource) => resource["type"] == `${ORAO_ADDRESS}::vrf::Vrf`
        );
        return data ? (data["data"] as NetworkData) : undefined;
    }

    async getRandomness(owner: MaybeHexString, seed: string) {
        const data = await this.getRequestData(owner);
        const handle = data!["seeds"]["handle"];
        const res: string = await this.client.getTableItem(handle, {
            key_type: `vector<u8>`,
            value_type: "vector<u8>",
            key: seed,
        });
        return (new HexString(res)).toUint8Array();
    }

    async getRequestData(addr: MaybeHexString) {
        const resources = await this.client.getAccountResources(addr);
        const data = resources.find(
            (resource) =>
                resource["type"] == `${ORAO_ADDRESS}::vrf::RandomnessData`
        );
        return data ? (data["data"] as RequestData) : undefined;
    }
}

export class RequestBuilder {
    private client: AptosClient;
    private payload: TransactionPayload;

    constructor(client: AptosClient, payload: TransactionPayload) {
        this.client = client;
        this.payload = payload
    }

    async signAndSend(signer: AptosAccount | PetraWallet | PontemWallet): Promise<[Uint8Array, string]> {
        if ("signAndSubmitTransaction" in signer) { // petra wallet
            const pendingTxn = await signer.signAndSubmitTransaction(this.payload)

            await this.client.waitForTransactionWithResult(pendingTxn.hash, { checkSuccess: true })
            
            const seedHex: string = pendingTxn.payload.arguments[0]
            return [new Uint8Array(Buffer.from(seedHex.substring(2), "hex")), pendingTxn.hash]
        } else if ("signAndSubmit" in signer) { // pontem wallet
            const pendingTxn = await signer.signAndSubmit(this.payload)
            await this.client.waitForTransactionWithResult(pendingTxn.result.hash, { checkSuccess: true })
            
            const seed: Uint8Array = pendingTxn.payload.arguments[0]
            return [seed, pendingTxn.result.hash]
        } else if (signer instanceof AptosAccount) { // local wallet
            const rawTxn = await this.client.generateTransaction(signer.address(), this.payload)
            const signedTxn = await this.client.signTransaction(signer, rawTxn)
            const pendingTxn = await this.client.submitTransaction(signedTxn)

            await this.client.waitForTransactionWithResult(pendingTxn.hash, { checkSuccess: true })

            const seedHex: string = (pendingTxn.payload as any).arguments[0];
            return [new Uint8Array(Buffer.from(seedHex.substring(2), "hex")), pendingTxn.hash]
        } else {
            throw new Error("failed to sign and send")
        }
    }
}
