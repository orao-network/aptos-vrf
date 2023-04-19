use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::{Context, Result};
use aptos_sdk::bcs;
use aptos_sdk::move_types::identifier::Identifier;
use aptos_sdk::move_types::language_storage::ModuleId;
use aptos_sdk::rest_client::{Client, PendingTransaction};
use aptos_sdk::transaction_builder::TransactionBuilder;
use aptos_sdk::types::account_address::AccountAddress;
use aptos_sdk::types::chain_id::ChainId;
use aptos_sdk::types::LocalAccount;
use aptos_sdk::types::transaction::{EntryFunction, TransactionPayload};
use serde::{Deserialize, Serialize};
use url::Url;

use crate::utils::get_address;

#[derive(Debug, Serialize, Deserialize)]
pub struct Table {
    pub handle: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RandomnessStore {
    pub data: Table,
}

#[derive(Debug)]
pub struct OraoVrf {
    pub api_client: Client,
    vrf_address: AccountAddress,
}

impl OraoVrf {
    pub fn new(node_url: String) -> Self {
        Self {
            api_client: Client::new(Url::from_str(&node_url).unwrap()),
            vrf_address: AccountAddress::from_hex_literal(
                "0xab81318c79a3b65a1f23354494793fcc6c4fa44a69d0c0e656b7b1454ddd1bbf"
            ).unwrap(),
        }
    }

    pub async fn request(
        &self,
        user_account: &mut LocalAccount,
        seed: Vec<u8>,
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
            TransactionPayload::EntryFunction(EntryFunction::new(
                ModuleId::new(self.vrf_address, Identifier::new("vrf").unwrap()),
                Identifier::new("request").unwrap(),
                vec![],
                vec![
                    bcs::to_bytes(&seed).unwrap(),
                ],
            )),
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
            .context("Failed to submit request transaction")?
            .into_inner())
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
