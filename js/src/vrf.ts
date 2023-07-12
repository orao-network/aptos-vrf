import {
    AptosAccount,
    AptosClient,
    getAddressFromAccountOrAddress,
    HexString,
    MaybeHexString,
    OptionalTransactionArgs,
    TransactionBuilderABI
} from "aptos";
import {ORAO_ADDRESS, VRF_ABIS} from ".";

/**
 * Class for working with the ORAO Vrf module, such as requesting randomness and
 * getting fulfilled randomness.
 */
export class OraoVrfClient {
    aptosClient: AptosClient;
    transactionBuilder: TransactionBuilderABI;

    /**
     * Creates new OraoVrfClient instance
     * @param nodeUrl string
     */
    constructor(nodeUrl: string) {
        this.aptosClient = new AptosClient(nodeUrl);
        this.transactionBuilder = new TransactionBuilderABI(VRF_ABIS.map((abi) => new HexString(abi).toUint8Array()));
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
            type: 'entry_function_payload',
            function: `${ORAO_ADDRESS}::vrf::request`,
            type_arguments: [],
            arguments: [seed], 
        }
    }
    
    /**
     * Generate, sign, and submit a transaction to the Aptos blockchain API to
     * request randomness.
     *
     * @param user Account requesting the randomness
     * @param seed Uint8Array
     * @param extraArgs Extra args for building the transaction or configuring how
     * the client should submit and wait for the transaction
     * @returns The hash of the transaction submitted to the API
     */
    async request(
        user: AptosAccount,
        seed: Uint8Array,
        extraArgs?: OptionalTransactionArgs
    ): Promise<string> {
        const payload = this.transactionBuilder.buildTransactionPayload(
            `${ORAO_ADDRESS}::vrf::request`,
            [],
            [seed]
        );

        return this.aptosClient.generateSignSubmitTransaction(user, payload, extraArgs);
    }

    async waitFulfilled(owner: MaybeHexString, seed: Uint8Array): Promise<Uint8Array> {
        return new Promise(async (resolve, reject) => {
            while (true) {
                try {
                    const randomness = await this.getRandomness(owner, Buffer.from(seed).toString("hex"))
                    if (randomness != '0x') {
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

    /**
     * Get the randomness for the requested seed.
     *
     * @param account Account
     * @param seed string
     * @returns Promise that resolves to the randomness.
     */
    async getRandomness(
        account: AptosAccount | MaybeHexString,
        seed: string
    ): Promise<any> {
        const accountAddress = getAddressFromAccountOrAddress(account);
        const randomnessStoreResource = await this.aptosClient.getAccountResource(
            accountAddress,
            `${ORAO_ADDRESS}::vrf::RandomnessStore`
        );

        return await this.aptosClient.getTableItem(
            (randomnessStoreResource.data as any).data.handle,
            {
                key_type: `vector<u8>`,
                value_type: `vector<u8>`,
                key: seed,
            }
        );
    }
}