#[test_only]
module russian_roulette::roulette_tests {
    use std::bcs;
    use std::signer;
    use aptos_std::aptos_hash;
    use aptos_framework::account;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::coin;
    use aptos_framework::genesis;

    use orao_network::vrf_v2;

    use russian_roulette::roulette;

    #[test(creator = @russian_roulette, user = @0xFB, source = @aptos_framework)]
    fun tets_play(creator: signer, user: signer, source: signer) {
        genesis::setup();

        account::create_account_for_test(signer::address_of(&creator));
        account::create_account_for_test(signer::address_of(&user));

        let (aptos_coin_burn_cap, aptos_coin_mint_cap) = aptos_coin::initialize_for_test_without_aggregator_factory(
            &source
        );
        let coins = coin::mint(100000, &aptos_coin_mint_cap);
        coin::register<AptosCoin>(&user);
        coin::deposit(signer::address_of(&user), coins);

        let orao_network = account::create_account_for_test(@orao_network);
        vrf_v2::init_module_for_test(&orao_network);

        roulette::init_module_for_test(&creator);

        let force = aptos_hash::keccak256(bcs::to_bytes<address>(&@0xFB));
        roulette::play(&user, force, 100);

        coin::destroy_mint_cap<AptosCoin>(aptos_coin_mint_cap);
        coin::destroy_burn_cap<AptosCoin>(aptos_coin_burn_cap);
    }
}
