module russian_roulette::roulette {
    use std::signer;
    use std::string;
    use std::vector;
    use aptos_std::simple_map::{Self, SimpleMap};

    use orao_network::vrf_v2;

    //
    // Errors
    //

    const E_NOT_INITIALIZED_STORE: u64 = 1;
    const E_ALREADY_PLAYED: u64 = 2;
    const E_NOT_PLAYED: u64 = 3;
    const E_ALREADY_DEAD: u64 = 4;

    //
    // Data structures
    //

    struct GameStore has key {
        //player's address -> Result
        statistics: SimpleMap<address, Result>,
    }

    struct Result has store {
        win: u64,
        dead: u64,
    }

    fun init_module(sender: &signer) {
        move_to(sender, GameStore {
            statistics: simple_map::create()
        });
    }

    //
    // Entry functions
    //

    public entry fun play(user: &signer, force: vector<u8>, callback_fee_amount: u64) acquires GameStore {
        let user_addr = signer::address_of(user);
        assert!(!is_dead(user_addr), E_ALREADY_DEAD);

        vrf_v2::request_with_callback(
            user,
            force,
            @russian_roulette,
            string::utf8(b"roulette"),
            string::utf8(b"callback"),
            vector[],
            callback_fee_amount
        );
    }

    public entry fun callback(user_addr: address, seed: vector<u8>) acquires GameStore {
        let randomness = vrf_v2::get_randomness(user_addr, seed);

        let game_store = borrow_global_mut<GameStore>(@russian_roulette);
        if (!simple_map::contains_key(&game_store.statistics, &user_addr)) {
            simple_map::add(&mut game_store.statistics, user_addr, Result { win: 0, dead: 0 })
        };
        let result = simple_map::borrow_mut(&mut game_store.statistics, &user_addr);
        if (successfull_outcome(&randomness)) {
            result.win = result.win + 1;
        } else {
            result.dead = 1;
        }
    }

    //
    // Public functions
    //

    public fun rounds(user_addr: address): u64 acquires GameStore {
        let game_store = borrow_global<GameStore>(@russian_roulette);
        if (!simple_map::contains_key(&game_store.statistics, &user_addr)) return 0;
        let result = simple_map::borrow(&game_store.statistics, &user_addr);
        result.win + result.dead
    }

    public fun is_dead(user_addr: address): bool acquires GameStore {
        let game_store = borrow_global<GameStore>(@russian_roulette);
        if (!simple_map::contains_key(&game_store.statistics, &user_addr)) return false;
        simple_map::borrow(&game_store.statistics, &user_addr).dead == 1
    }

    //
    // Private functions
    //

    fun successfull_outcome(rand: &vector<u8>): bool {
        let val: u64 =
            (((*vector::borrow(rand, 0)) as u64) << (8u8 * 0)) +
                (((*vector::borrow(rand, 1)) as u64) << (8u8 * 1)) +
                (((*vector::borrow(rand, 2)) as u64) << (8u8 * 2)) +
                (((*vector::borrow(rand, 3)) as u64) << (8u8 * 3)) +
                (((*vector::borrow(rand, 4)) as u64) << (8u8 * 4)) +
                (((*vector::borrow(rand, 5)) as u64) << (8u8 * 5)) +
                (((*vector::borrow(rand, 6)) as u64) << (8u8 * 6)) +
                (((*vector::borrow(rand, 7)) as u64) << (8u8 * 7));
        // roughly 1/6
        val > 3074457345618258602
    }

    #[test_only]
    public fun init_module_for_test(sender: &signer) {
        init_module(sender);
    }
}