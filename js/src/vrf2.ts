import { AptosAccount, MaybeHexString, Types } from "aptos";
import { ORAO_ADDRESS, OraoVrfClient } from ".";

/**
 * Class for working with the ORAO Vrf module, such as requesting randomness and
 * getting fulfilled randomness.
 */
export class OraoVrfV2Client extends OraoVrfClient {
    /**
     * Generate randomness request transaction data ready be submitted by the aptos API / client / wallet
     *
     * @param seed Uint8Array
     * @returns transaction data
     */
    requestData(seed: Uint8Array) {
        return {
            data: {
                function: `${ORAO_ADDRESS}::vrf_v2::request` as any,
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
            function: `${ORAO_ADDRESS}::vrf_v2::request`,
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

    /**
     * Generate randomness request with callback transaction data ready to be submitted by the aptos API / client / wallet
     *
     * @param seed Uint8Array
     * @param callbackModuleAddress string
     * @param callbackModuleName string
     * @param callbackFunction string
     * @param typeArgs string[] allows users of the SDK to specify any additional type information required by their
     *    custom callback functions when requesting randomness with a callback.
     * @param feeAmount
     * @returns transaction data
     */
    requestWithCallbackData(
        seed: Uint8Array,
        callbackModuleAddress: string,
        callbackModuleName: string,
        callbackFunction: string,
        typeArgs: string[],
        feeAmount: Types.U64
    ) {
        return {
            data: {
                function:
                    `${ORAO_ADDRESS}::vrf_v2::request_with_callback` as any,
                typeArguments: [],
                functionArguments: [
                    seed,
                    callbackModuleAddress,
                    callbackModuleName,
                    callbackFunction,
                    typeArgs,
                    feeAmount,
                ],
            },
        };
    }

    /**
     * Generate a transaction payload to the Aptos blockchain API to
     * request randomness with callback.
     *
     * @param seed Uint8Array
     * @param callbackModuleAddress string
     * @param callbackModuleName string
     * @param callbackFunction string
     * @param typeArgs string[] allows users of the SDK to specify any additional type information required by their
     *    custom callback functions when requesting randomness with a callback.
     * @param feeAmount
     * @returns payload
     */
    requestWithCallbackPayload(
        seed: Uint8Array,
        callbackModuleAddress: string,
        callbackModuleName: string,
        callbackFunction: string,
        typeArgs: string[],
        feeAmount: Types.U64
    ) {
        return {
            type: "entry_function_payload",
            function: `${ORAO_ADDRESS}::vrf_v2::request_with_callback`,
            type_arguments: [],
            arguments: [
                seed,
                callbackModuleAddress,
                callbackModuleName,
                callbackFunction,
                typeArgs,
                feeAmount,
            ],
        };
    }

    /**
     * Generate, sign, and submit a transaction to the Aptos blockchain API to
     * request randomness with callback.
     *
     * @param user Account requesting the randomness
     * @param seed Uint8Array
     * @param callbackModuleAddress string
     * @param callbackModuleName string
     * @param callbackFunction string
     * @param typeArgs string[] allows users of the SDK to specify any additional type information required by their
     *    custom callback functions when requesting randomness with a callback.
     * @param feeAmount
     * @param options Options allow to overwrite default transaction options.
     * @returns The hash of the transaction submitted to the API
     */
    async requestWithCallback(
        user: AptosAccount,
        seed: Uint8Array,
        callbackModuleAddress: string,
        callbackModuleName: string,
        callbackFunction: string,
        typeArgs: string[],
        feeAmount: Types.U64,
        options?: Partial<Types.SubmitTransactionRequest>
    ): Promise<string> {
        return this.submitTransaction(
            user,
            this.requestWithCallbackPayload(
                seed,
                callbackModuleAddress,
                callbackModuleName,
                callbackFunction,
                typeArgs,
                feeAmount
            ),
            options
        );
    }

    /**
     * Generate a transaction data to the Aptos blockchain API to
     * deposit coins.
     *
     * @param coinType
     * @param amount
     * @returns transaction data
     */
    depositData(coinType: string, amount: Types.U64) {
        return {
            data: {
                function: `${ORAO_ADDRESS}::vrf_v2::deposit` as any,
                typeArguments: [coinType],
                functionArguments: [amount],
            },
        };
    }

    /**
     * Generate a transaction payload to the Aptos blockchain API to
     * deposit coins.
     *
     * @param coinType
     * @param amount
     * @returns payload
     */
    depositPayload(coinType: string, amount: Types.U64) {
        return {
            type: "entry_function_payload",
            function: `${ORAO_ADDRESS}::vrf_v2::deposit`,
            type_arguments: [coinType],
            arguments: [amount],
        };
    }

    /**
     * Generate, sign, and submit a transaction to the Aptos blockchain API to
     * deposit coins.
     *
     * @param user Account requesting the randomness
     * @param coinType
     * @param amount
     * @param options Options allow to overwrite default transaction options.
     * @returns The hash of the transaction submitted to the API
     */
    async deposit(
        user: AptosAccount,
        coinType: string,
        amount: Types.U64,
        options?: Partial<Types.SubmitTransactionRequest>
    ): Promise<string> {
        return this.submitTransaction(
            user,
            this.depositPayload(coinType, amount),
            options
        );
    }

    /**
     * Generate a transaction data to the Aptos blockchain API to
     * withdraw coins.
     *
     * @param coinType
     * @param amount
     * @returns transaction data
     */
    withdrawData(coinType: string, amount: Types.U64) {
        return {
            data: {
                function: `${ORAO_ADDRESS}::vrf_v2::withdraw` as any,
                typeArguments: [coinType],
                functionArguments: [amount],
            },
        };
    }

    /**
     * Generate a transaction payload to the Aptos blockchain API to
     * withdraw coins.
     *
     * @param coinType
     * @param amount
     * @returns payload
     */
    withdrawPayload(coinType: string, amount: Types.U64) {
        return {
            type: "entry_function_payload",
            function: `${ORAO_ADDRESS}::vrf_v2::withdraw`,
            type_arguments: [coinType],
            arguments: [amount],
        };
    }

    /**
     * Generate, sign, and submit a transaction to the Aptos blockchain API to
     * withdraw coins.
     *
     * @param user Account requesting the randomness
     * @param coinType
     * @param amount
     * @param options Options allow to overwrite default transaction options.
     * @returns The hash of the transaction submitted to the API
     */
    async withdraw(
        user: AptosAccount,
        coinType: string,
        amount: Types.U64,
        options?: Partial<Types.SubmitTransactionRequest>
    ): Promise<string> {
        return this.submitTransaction(
            user,
            this.withdrawPayload(coinType, amount),
            options
        );
    }

    /**
     * Get the coin balance of user in treasury.
     * @param coinType
     * @param userAddress
     * @returns Promise that resolves to the balance.
     */
    async getBalance(
        coinType: string,
        userAddress: MaybeHexString
    ): Promise<string> {
        const data: any = await this.provider.view({
            function: `${ORAO_ADDRESS}::vrf_v2::get_balance`,
            type_arguments: [coinType],
            arguments: [userAddress],
        });
        return data[0] as string;
    }
}
