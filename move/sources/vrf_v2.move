module orao_network::vrf_v2 {
    use std::signer;
    use aptos_std::table::{Self, Table};
    use aptos_std::type_info::{Self, TypeInfo};
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event::{Self, EventHandle};

    use orao_network::orao_coin::OraoCoin;
    use orao_network::vrf;

    //
    // Errors
    //

    const E_NOT_AUTHORIZED: u64 = 101;
    const E_NOT_INITIALIZED_STORE: u64 = 102;
    const E_ALREADY_INITIALIZED_STORE: u64 = 103;
    const E_INVALID_COIN: u64 = 104;
    const E_INSUFFICIENT_BALANCE: u64 = 105;

    //
    // Data structures
    //

    struct TreasuryAccountCapability has key { signer_cap: SignerCapability }

    struct TreasuryKey has copy, drop, store {
        user_addr: address,
        coin_type: TypeInfo,
    }

    struct TreasuryStore has key {
        data: Table<TreasuryKey, u64>,
    }

    struct NetworkFeeStore has key {
        orao: u64,
        apt: u64,
    }

    struct EventsStore has key {
        deposit_events: EventHandle<DepositEvent>,
        withdraw_events: EventHandle<WithdrawEvent>,
    }

    fun init_module(sender: &signer) {
        assert!(!exists<TreasuryStore>(@orao_network), E_ALREADY_INITIALIZED_STORE);

        let (_, resource_signer_cap) = account::create_resource_account(sender, b"TREASURY");
        move_to(sender, TreasuryAccountCapability {
            signer_cap: resource_signer_cap
        });

        move_to<TreasuryStore>(
            sender,
            TreasuryStore {
                data: table::new(),
            }
        );

        move_to(sender, NetworkFeeStore {
            orao: 0,
            apt: 0,
        });

        move_to<EventsStore>(
            sender,
            EventsStore {
                deposit_events: account::new_event_handle(sender),
                withdraw_events: account::new_event_handle(sender),
            }
        );
    }

    inline fun get_treasury_signer(): signer acquires TreasuryAccountCapability {
        assert!(exists<TreasuryStore>(@orao_network), E_NOT_INITIALIZED_STORE);

        account::create_signer_with_capability(
            &borrow_global<TreasuryAccountCapability>(@orao_network).signer_cap
        )
    }

    //
    // Entry functions
    //

    public entry fun deposit<CoinType>(
        user: &signer,
        amount: u64
    ) acquires TreasuryStore, EventsStore, TreasuryAccountCapability {
        let coins = coin::withdraw<CoinType>(user, amount);
        deposit_coins(signer::address_of(user), coins);
    }

    public entry fun deposit_for_user<CoinType>(
        user: &signer,
        user_addr: address,
        amount: u64
    ) acquires TreasuryStore, EventsStore, TreasuryAccountCapability {
        let coins = coin::withdraw<CoinType>(user, amount);
        deposit_coins(user_addr, coins);
    }

    public entry fun withdraw<CoinType>(
        user: &signer,
        amount: u64
    ) acquires TreasuryStore, EventsStore, TreasuryAccountCapability {
        coin::deposit(signer::address_of(user), withdraw_coins<CoinType>(user, amount));
    }

    public entry fun request(
        user: &signer,
        seed: vector<u8>
    ) acquires TreasuryStore, NetworkFeeStore, TreasuryAccountCapability, EventsStore {
        let (orao_fee, apt_fee) = get_network_fee();

        let user_addr = signer::address_of(user);
        let authority_addr = @orao_network;
        if (get_balance<OraoCoin>(user_addr) >= orao_fee) {
            let coin_type = type_info::type_of<OraoCoin>();
            withdraw_internal(signer::address_of(user), coin_type, orao_fee);
            deposit_internal(authority_addr, coin_type, orao_fee);
        } else if (get_balance<AptosCoin>(user_addr) >= apt_fee) {
            let coin_type = type_info::type_of<AptosCoin>();
            withdraw_internal(signer::address_of(user), coin_type, apt_fee);
            deposit_internal(authority_addr, coin_type, apt_fee);
        } else {
            if (coin::is_account_registered<OraoCoin>(user_addr) && coin::balance<OraoCoin>(user_addr) >= orao_fee) {
                deposit_for_user<OraoCoin>(user, authority_addr, orao_fee);
            }else {
                deposit_for_user<AptosCoin>(user, authority_addr, apt_fee);
            }
        };

        vrf::request_internal(user, seed);
    }

    //
    // Public functions
    //

    public fun deposit_coins<CoinType>(
        user_addr: address,
        coins: Coin<CoinType>
    ) acquires TreasuryStore, EventsStore, TreasuryAccountCapability {
        let amount = coin::value(&coins);
        let treasury_address = get_treasury_address();
        if (!coin::is_account_registered<CoinType>(treasury_address)) {
            coin::register<CoinType>(&get_treasury_signer());
        };
        coin::deposit(treasury_address, coins);

        let coin_type = type_info::type_of<CoinType>();
        deposit_internal(user_addr, coin_type, amount);

        let event_store = borrow_global_mut<EventsStore>(@orao_network);
        event::emit_event(
            &mut event_store.deposit_events,
            DepositEvent { user_addr, coin_type, amount }
        );
    }

    public fun withdraw_coins<CoinType>(
        user: &signer,
        amount: u64,
    ): Coin<CoinType> acquires TreasuryStore, EventsStore, TreasuryAccountCapability {
        let user_addr = signer::address_of(user);
        let coin_type = type_info::type_of<CoinType>();
        withdraw_internal(user_addr, coin_type, amount);

        let event_store = borrow_global_mut<EventsStore>(@orao_network);
        event::emit_event(
            &mut event_store.withdraw_events,
            WithdrawEvent { user_addr, coin_type, amount }
        );

        coin::withdraw<CoinType>(&get_treasury_signer(), amount)
    }

    #[view]
    public fun get_treasury_address(): address acquires TreasuryAccountCapability {
        signer::address_of(&get_treasury_signer())
    }

    #[view]
    public fun get_balance<CoinType>(user_addr: address): u64 acquires TreasuryStore {
        let coin_type = type_info::type_of<CoinType>();
        let balance_store = borrow_global_mut<TreasuryStore>(@orao_network);
        *table::borrow_with_default(
            &mut balance_store.data,
            TreasuryKey { user_addr, coin_type },
            &0u64
        )
    }

    #[view]
    public fun get_network_fee(): (u64, u64) acquires NetworkFeeStore {
        assert!(exists<NetworkFeeStore>(@orao_network), E_NOT_INITIALIZED_STORE);

        let network_fee_store = borrow_global_mut<NetworkFeeStore>(@orao_network);
        (network_fee_store.orao, network_fee_store.apt)
    }

    #[view]
    public fun get_randomness(account_addr: address, seed: vector<u8>): vector<u8> {
        vrf::get_randomness(account_addr, seed)
    }

    //
    // Private functions
    //

    fun deposit_internal(user_addr: address, coin_type: TypeInfo, amount: u64) acquires TreasuryStore {
        assert!(exists<TreasuryStore>(@orao_network), E_NOT_INITIALIZED_STORE);

        let balance_store = borrow_global_mut<TreasuryStore>(@orao_network);
        let balance = table::borrow_mut_with_default(
            &mut balance_store.data,
            TreasuryKey { user_addr, coin_type },
            0
        );
        *balance = *balance + amount;
    }

    fun withdraw_internal(user_addr: address, coin_type: TypeInfo, amount: u64) acquires TreasuryStore {
        assert!(exists<TreasuryStore>(@orao_network), E_NOT_INITIALIZED_STORE);

        let balance_store = borrow_global_mut<TreasuryStore>(@orao_network);
        let balance = table::borrow_mut_with_default(
            &mut balance_store.data,
            TreasuryKey { user_addr, coin_type },
            0
        );

        assert!(*balance >= amount, E_INSUFFICIENT_BALANCE);

        *balance = *balance - amount;
    }

    //
    // Events
    //

    struct DepositEvent has drop, store {
        user_addr: address,
        coin_type: TypeInfo,
        amount: u64,
    }

    struct WithdrawEvent has drop, store {
        user_addr: address,
        coin_type: TypeInfo,
        amount: u64,
    }
}
