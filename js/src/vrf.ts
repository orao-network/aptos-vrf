import {
    AptosAccount,
    getAddressFromAccountOrAddress,
    MaybeHexString,
    Network,
    Provider,
    Types,
} from "aptos";
import { ORAO_ADDRESS } from ".";

/**
 * Class for working with the ORAO Vrf module, such as requesting randomness and
 * getting fulfilled randomness.
 */
export class OraoVrfClient {
    provider: Provider;

    /**
     * Creates new OraoVrfClient instance
     * @param network string
     */
    constructor(network: Network) {
        this.provider = new Provider(network);
    }

    protected async submitTransaction(
        account: AptosAccount,
        payload: Types.EntryFunctionPayload,
        options?: Partial<Types.SubmitTransactionRequest>
    ): Promise<string> {
        const rawTxn = await this.provider.generateTransaction(
            account.address(),
            payload,
            options
        );

        return await this.provider.signAndSubmitTransaction(account, rawTxn);
    }

    /**
     * Generate a transaction data to the Aptos blockchain API to
     * request randomness.
     *
     * @param seed Uint8Array
     * @returns transaction data
     */
    requestData(seed: Uint8Array) {
        return {
            data: {
                function: `${ORAO_ADDRESS}::vrf::request` as any,
                typeArguments: [],
                functionArguments: [seed],
            },
        };
    }

    /**
     * Generate a transaction payload to the Aptos blockchain API to
     * request randomness.
     *
     * @param seed Uint8Array
     * @returns payload
     */
    requestPayload(seed: Uint8Array) {
        return {
            type: "entry_function_payload",
            function: `${ORAO_ADDRESS}::vrf::request`,
            type_arguments: [],
            arguments: [seed],
        };
    }

    /**
     * Generate, sign, and submit a transaction to the Aptos blockchain API to
     * request randomness.
     *
     * @param user Account requesting the randomness
     * @param seed Uint8Array
     * @param options Options allow to overwrite default transaction options.
     * @returns The hash of the transaction submitted to the API
     */
    async request(
        user: AptosAccount,
        seed: Uint8Array,
        options?: Partial<Types.SubmitTransactionRequest>
    ): Promise<string> {
        return this.submitTransaction(user, this.requestPayload(seed), options);
    }

    async waitFulfilled(
        owner: MaybeHexString,
        seed: Uint8Array
    ): Promise<Uint8Array> {
        return new Promise(async (resolve, reject) => {
            while (true) {
                try {
                    const randomness = await this.getRandomness(
                        owner,
                        Buffer.from(seed).toString("hex")
                    );
                    if (randomness != "0x") {
                        resolve(randomness);
                        break;
                    }
                } catch (e) {
                    reject(e);
                    break;
                }
                await new Promise((f) => setTimeout(f, 1000));
            }
        });
    }

    /**
     * Get the randomness for the requested seed.
     *
     * @param account Account
     * @param seed string
     * @returns Promise that resolves to the randomness.
     */
    async getRandomness(
        account: AptosAccount | MaybeHexString,
        seed: MaybeHexString
    ): Promise<any> {
        const accountAddress = getAddressFromAccountOrAddress(account);
        const randomnessStoreResource = await this.provider.getAccountResource(
            accountAddress,
            `${ORAO_ADDRESS}::vrf::RandomnessStore`
        );

        return await this.provider.getTableItem(
            (randomnessStoreResource.data as any).data.handle,
            {
                key_type: `vector<u8>`,
                value_type: `vector<u8>`,
                key: seed,
            }
        );
    }
}
