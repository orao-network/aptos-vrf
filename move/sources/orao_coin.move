module orao_network::orao_coin {
    use aptos_framework::managed_coin;

    struct OraoCoin {}

    fun init_module(sender: &signer) {
        managed_coin::initialize<OraoCoin>(
            sender,
            b"Orao Coin",
            b"ORAO",
            6,
            false,
        );

        managed_coin::register<OraoCoin>(sender);
    }

    public entry fun mint(sender: &signer, dst_addr: address, amt: u64) {
        managed_coin::mint<OraoCoin>(sender, dst_addr, amt);
    }

    public entry fun burn(sender: &signer, amt: u64) {
        managed_coin::burn<OraoCoin>(sender, amt);
    }

    public entry fun register(sender: &signer) {
        managed_coin::register<OraoCoin>(sender);
    }

    #[test_only]
    public fun init_coin(creator: &signer) {
        init_module(creator);
    }
}