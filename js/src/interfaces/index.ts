declare global {
    interface Window {
        aptos?: PetraWallet,
        pontem?: PontemWallet,
    }
}

export interface TransactionPayload {
    arguments: Array<any>;
    function: string;
    type: string;
    type_arguments: string[];
}

export interface PendingTransaction {
    hash: string;
    sender: string;
    sequence_number: string;
    max_gas_amount: string;
    gas_unit_price: string;
    expiration_timestamp_secs: string;
    payload: TransactionPayload;
    signature: Signature;
}

export interface Signature {
    public_key: string;
    signature: string;
    type: string;
}

export type AddressInfo = {
    address: string,
    publicKey: string,
}

export interface PetraWallet {
    connect: () => Promise<AddressInfo>,
    isConnected: () => Promise<boolean>,
    disconnect: () => Promise<void>,
    account: () => Promise<AddressInfo>,
    network: () => Promise<string>,
    signAndSubmitTransaction: (txn: TransactionPayload) => Promise<PendingTransaction>,
}

export interface PontemResponse {
    payload: TransactionPayload,
    result: PendingTransaction,
}

export interface PontemWallet {
    connect: () => Promise<any>,
    isConnected: () => Promise<any>,
    disconnect: () => Promise<any>,
    account: () => Promise<string>,
    network: () => Promise<NetworkInfo>,
    signAndSubmit: (txn: TransactionPayload) => Promise<PontemResponse>,
}

export type NetworkInfo = {
    api: string,
    chainId: string,
    name: string,
}

export interface RequestData {
    seeds: {
        handle: string;
    };
    responses: {
        inner: {
            handle: string;
        };
        length: string;
    };
}

interface EventHandle {
    counter: string;
    guid: {
        id: {
            addr: string;
            creation_num: string;
        };
    };
}

export interface NetworkData {
    authority: string;
    coin_type: string;
    fee: string;
    fulfillment_authorities: string[];
    fulfill_events: EventHandle;
    request_events: EventHandle;
    response_events: EventHandle;
    treasury: string;
}