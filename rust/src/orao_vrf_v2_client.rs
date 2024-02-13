use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::{Context, Result};
use aptos_sdk::bcs;
use aptos_sdk::crypto::_once_cell::sync::Lazy;
use aptos_sdk::move_types::identifier::Identifier;
use aptos_sdk::move_types::language_storage::{ModuleId, TypeTag};
use aptos_sdk::rest_client::aptos_api_types::{EntryFunctionId, MoveType, ViewRequest};
use aptos_sdk::rest_client::{Client, PendingTransaction};
use aptos_sdk::transaction_builder::TransactionBuilder;
use aptos_sdk::types::account_address::AccountAddress;
use aptos_sdk::types::chain_id::ChainId;
use aptos_sdk::types::transaction::{EntryFunction, TransactionPayload};
use aptos_sdk::types::LocalAccount;
use serde::{Deserialize, Serialize};
use url::Url;

use crate::utils::get_address;

static VFR_ADDRESS: &str = "0xab81318c79a3b65a1f23354494793fcc6c4fa44a69d0c0e656b7b1454ddd1bbf";
static VRF_V2_GET_BALANCE: Lazy<EntryFunctionId> = Lazy::new(|| {
    format!("{VFR_ADDRESS}::vrf_v2::get_balance")
        .parse()
        .unwrap()
});

#[derive(Debug, Serialize, Deserialize)]
pub struct Table {
    pub handle: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RandomnessStore {
    pub data: Table,
}

#[derive(Debug)]
pub struct OraoVrfV2 {
    pub api_client: Client,
    vrf_address: AccountAddress,
}

impl OraoVrfV2 {
    pub fn new(node_url: String) -> Self {
        Self {
            api_client: Client::new(Url::from_str(&node_url).unwrap()),
            vrf_address: AccountAddress::from_hex_literal(VFR_ADDRESS).unwrap(),
        }
    }

    async fn submit_tx(
        &self,
        user_account: &mut LocalAccount,
        entry_function: EntryFunction,
        options: Option<TransactionOptions>,
    ) -> Result<PendingTransaction> {
        let options = options.unwrap_or_default();

        let chain_id = self
            .api_client
            .get_index()
            .await
            .context("Failed to get chain ID")?
            .inner()
            .chain_id;
        let transaction_builder = TransactionBuilder::new(
            TransactionPayload::EntryFunction(entry_function),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs()
                + options.timeout_secs,
            ChainId::new(chain_id),
        )
        .sender(user_account.address())
        .sequence_number(user_account.sequence_number())
        .max_gas_amount(options.max_gas_amount)
        .gas_unit_price(options.gas_unit_price);
        let signed_txn = user_account.sign_with_transaction_builder(transaction_builder);

        Ok(self
            .api_client
            .submit(&signed_txn)
            .await
            .context("Failed to submit transaction")?
            .into_inner())
    }

    pub async fn request(
        &self,
        user_account: &mut LocalAccount,
        seed: Vec<u8>,
        options: Option<TransactionOptions>,
    ) -> Result<PendingTransaction> {
        self.submit_tx(
            user_account,
            EntryFunction::new(
                ModuleId::new(self.vrf_address, Identifier::new("vrf_v2").unwrap()),
                Identifier::new("request").unwrap(),
                vec![],
                vec![bcs::to_bytes(&seed).unwrap()],
            ),
            options,
        )
        .await
    }

    pub async fn get_randomness(
        &self,
        account_addr: AccountAddress,
        seed: String,
    ) -> Result<String> {
        let resource_type = self.vrf_address.to_hex_literal() + "::vrf::RandomnessStore";
        let response = self
            .api_client
            .get_resource::<RandomnessStore>(account_addr, &resource_type)
            .await
            .context("Failed to get randomness store")?;
        let randomness_store = response.into_inner();
        let table_handle = get_address(&randomness_store.data.handle)?;
        let key_type = "vector<u8>";
        let value_type = "vector<u8>";
        let randomness = self
            .api_client
            .get_table_item(table_handle, key_type, value_type, seed)
            .await
            .context("Failed to get randomness")?;
        let randomness_inner = randomness.into_inner();
        let randomness = randomness_inner.as_str().unwrap();
        Ok(randomness.to_string())
    }

    pub async fn deposit(
        &self,
        user_account: &mut LocalAccount,
        coin_type: String,
        amount: u64,
        options: Option<TransactionOptions>,
    ) -> Result<PendingTransaction> {
        self.submit_tx(
            user_account,
            EntryFunction::new(
                ModuleId::new(self.vrf_address, Identifier::new("vrf_v2").unwrap()),
                Identifier::new("deposit").unwrap(),
                vec![TypeTag::from_str(coin_type.as_ref()).unwrap()],
                vec![bcs::to_bytes(&amount).unwrap()],
            ),
            options,
        )
        .await
    }

    pub async fn deposit_for_user(
        &self,
        user_account: &mut LocalAccount,
        coin_type: String,
        dst_address: AccountAddress,
        amount: u64,
        options: Option<TransactionOptions>,
    ) -> Result<PendingTransaction> {
        self.submit_tx(
            user_account,
            EntryFunction::new(
                ModuleId::new(self.vrf_address, Identifier::new("vrf_v2").unwrap()),
                Identifier::new("deposit_for_user").unwrap(),
                vec![TypeTag::from_str(coin_type.as_ref()).unwrap()],
                vec![
                    bcs::to_bytes(&dst_address).unwrap(),
                    bcs::to_bytes(&amount).unwrap(),
                ],
            ),
            options,
        )
        .await
    }

    pub async fn withdraw(
        &self,
        user_account: &mut LocalAccount,
        coin_type: String,
        amount: u64,
        options: Option<TransactionOptions>,
    ) -> Result<PendingTransaction> {
        self.submit_tx(
            user_account,
            EntryFunction::new(
                ModuleId::new(self.vrf_address, Identifier::new("vrf_v2").unwrap()),
                Identifier::new("withdraw").unwrap(),
                vec![TypeTag::from_str(coin_type.as_ref()).unwrap()],
                vec![bcs::to_bytes(&amount).unwrap()],
            ),
            options,
        )
        .await
    }

    pub async fn get_balance(
        &self,
        coin_type: String,
        user_address: AccountAddress,
    ) -> Result<u64> {
        Ok(self
            .api_client
            .view(
                &ViewRequest {
                    function: VRF_V2_GET_BALANCE.clone(),
                    type_arguments: vec![MoveType::from_str(coin_type.as_str()).unwrap()],
                    arguments: vec![serde_json::Value::String(user_address.to_string())],
                },
                None,
            )
            .await?
            .into_inner()
            .get(0)
            .and_then(|v| v.as_u64().map(|s| s.to_owned()))
            .unwrap_or(0))
    }
}

pub struct TransactionOptions {
    pub max_gas_amount: u64,
    pub gas_unit_price: u64,
    /// This is the number of seconds from now you're willing to wait for the
    /// transaction to be committed.
    pub timeout_secs: u64,
}

impl Default for TransactionOptions {
    fn default() -> Self {
        Self {
            max_gas_amount: 5_000,
            gas_unit_price: 100,
            timeout_secs: 10,
        }
    }
}
