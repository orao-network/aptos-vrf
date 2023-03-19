use anyhow::Result;
use aptos_sdk::{
    crypto::ed25519::Ed25519PrivateKey,
    types::{account_address::AccountAddress, AccountKey, LocalAccount},
};

pub fn get_local_account(private_key_hex: &str) -> Result<LocalAccount> {
    let decoded = hex::decode(private_key_hex.replace("0x", ""))?;
    let private_key = Ed25519PrivateKey::try_from(decoded.as_slice())?;
    let key = AccountKey::from_private_key(private_key);
    let address = key.authentication_key().derived_address();
    let account = LocalAccount::new(address, key, 0);
    Ok(account)
}

pub fn get_address(address_hex: &str) -> Result<AccountAddress> {
    let address = AccountAddress::from_hex_literal(&address_hex)?;
    Ok(address)
}

pub const DEFAULT_NODE_URL: &str = "https://fullnode.devnet.aptoslabs.com";
