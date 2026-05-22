use serde::{Deserialize, Serialize};
use std::collections::HashSet;

const STOREKIT_PRODUCT_IDS_ENV: &str = "READANI_STOREKIT_PRODUCT_IDS";
const DEFAULT_STOREKIT_PRODUCT_IDS: &str = "readani.polyglot.monthly";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ReadaniSubscriptionStatus {
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_price: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_jws: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

impl ReadaniSubscriptionStatus {
    #[cfg_attr(target_os = "macos", allow(dead_code))]
    fn inactive(message: impl Into<String>) -> Self {
        Self {
            is_active: false,
            product_id: None,
            display_name: None,
            display_price: None,
            expires_at: None,
            transaction_jws: None,
            message: Some(message.into()),
        }
    }
}

pub fn normalize_storekit_product_ids(raw: &str) -> Vec<String> {
    let parsed_items = serde_json::from_str::<Vec<String>>(raw)
        .unwrap_or_else(|_| raw.split(',').map(ToString::to_string).collect());
    let mut seen = HashSet::new();
    let mut product_ids = Vec::new();

    for item in parsed_items {
        let trimmed = item.trim();
        if trimmed.is_empty() || !seen.insert(trimmed.to_string()) {
            continue;
        }
        product_ids.push(trimmed.to_string());
    }

    product_ids
}

fn configured_storekit_product_ids() -> Vec<String> {
    let raw = std::env::var(STOREKIT_PRODUCT_IDS_ENV)
        .ok()
        .or_else(|| option_env!("READANI_STOREKIT_PRODUCT_IDS").map(ToString::to_string))
        .unwrap_or_else(|| DEFAULT_STOREKIT_PRODUCT_IDS.to_string());

    normalize_storekit_product_ids(&raw)
}

fn require_product_ids() -> Result<Vec<String>, String> {
    let product_ids = configured_storekit_product_ids();
    if product_ids.is_empty() {
        return Err(format!("{STOREKIT_PRODUCT_IDS_ENV} is not configured."));
    }
    Ok(product_ids)
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_readani_subscription_status() -> Result<ReadaniSubscriptionStatus, String> {
    get_subscription_status_for_product_ids(require_product_ids()?)
}

#[tauri::command(rename_all = "camelCase")]
pub fn purchase_readani_subscription() -> Result<ReadaniSubscriptionStatus, String> {
    purchase_subscription_for_product_ids(require_product_ids()?)
}

#[tauri::command(rename_all = "camelCase")]
pub fn restore_readani_subscription() -> Result<ReadaniSubscriptionStatus, String> {
    restore_subscription_for_product_ids(require_product_ids()?)
}

#[cfg(target_os = "macos")]
mod platform {
    use super::ReadaniSubscriptionStatus;
    use std::ffi::{CStr, CString};
    use std::os::raw::c_char;

    extern "C" {
        fn readani_storekit_current_entitlement(product_ids_json: *const c_char) -> *mut c_char;
        fn readani_storekit_purchase(product_ids_json: *const c_char) -> *mut c_char;
        fn readani_storekit_restore(product_ids_json: *const c_char) -> *mut c_char;
        fn readani_storekit_free_string(value: *mut c_char);
    }

    type BridgeCall = unsafe extern "C" fn(*const c_char) -> *mut c_char;

    fn call_storekit_bridge(
        product_ids: Vec<String>,
        bridge_call: BridgeCall,
    ) -> Result<ReadaniSubscriptionStatus, String> {
        let payload = serde_json::to_string(&product_ids).map_err(|error| error.to_string())?;
        let payload = CString::new(payload).map_err(|error| error.to_string())?;
        let response_ptr = unsafe { bridge_call(payload.as_ptr()) };

        if response_ptr.is_null() {
            return Err("StoreKit bridge returned no response.".to_string());
        }

        let response = unsafe { CStr::from_ptr(response_ptr) }
            .to_string_lossy()
            .into_owned();
        unsafe {
            readani_storekit_free_string(response_ptr);
        }

        serde_json::from_str::<ReadaniSubscriptionStatus>(&response)
            .map_err(|error| format!("StoreKit bridge returned unreadable JSON: {error}"))
    }

    pub fn get_subscription_status_for_product_ids(
        product_ids: Vec<String>,
    ) -> Result<ReadaniSubscriptionStatus, String> {
        call_storekit_bridge(product_ids, readani_storekit_current_entitlement)
    }

    pub fn purchase_subscription_for_product_ids(
        product_ids: Vec<String>,
    ) -> Result<ReadaniSubscriptionStatus, String> {
        call_storekit_bridge(product_ids, readani_storekit_purchase)
    }

    pub fn restore_subscription_for_product_ids(
        product_ids: Vec<String>,
    ) -> Result<ReadaniSubscriptionStatus, String> {
        call_storekit_bridge(product_ids, readani_storekit_restore)
    }
}

#[cfg(not(target_os = "macos"))]
mod platform {
    use super::ReadaniSubscriptionStatus;

    pub fn get_subscription_status_for_product_ids(
        _product_ids: Vec<String>,
    ) -> Result<ReadaniSubscriptionStatus, String> {
        Ok(ReadaniSubscriptionStatus::inactive(
            "StoreKit is only available on macOS.",
        ))
    }

    pub fn purchase_subscription_for_product_ids(
        _product_ids: Vec<String>,
    ) -> Result<ReadaniSubscriptionStatus, String> {
        Ok(ReadaniSubscriptionStatus::inactive(
            "StoreKit purchases are only available on macOS.",
        ))
    }

    pub fn restore_subscription_for_product_ids(
        _product_ids: Vec<String>,
    ) -> Result<ReadaniSubscriptionStatus, String> {
        Ok(ReadaniSubscriptionStatus::inactive(
            "StoreKit restore is only available on macOS.",
        ))
    }
}

pub use platform::{
    get_subscription_status_for_product_ids, purchase_subscription_for_product_ids,
    restore_subscription_for_product_ids,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_storekit_product_ids_from_comma_separated_env() {
        assert_eq!(
            normalize_storekit_product_ids(" readani.monthly , readani.yearly ,, "),
            vec!["readani.monthly".to_string(), "readani.yearly".to_string()]
        );
    }

    #[test]
    fn normalizes_storekit_product_ids_from_json_env() {
        assert_eq!(
            normalize_storekit_product_ids(r#"["readani.monthly"," readani.yearly "]"#),
            vec!["readani.monthly".to_string(), "readani.yearly".to_string()]
        );
    }

    #[test]
    fn subscription_status_serializes_product_display_metadata() {
        let status = ReadaniSubscriptionStatus {
            is_active: false,
            product_id: Some("readani.polyglot.monthly".to_string()),
            display_name: Some("Polyglot".to_string()),
            display_price: Some("$4.99".to_string()),
            expires_at: None,
            transaction_jws: None,
            message: Some("No active readani subscription was found.".to_string()),
        };

        let json = serde_json::to_value(status).expect("status JSON");

        assert_eq!(json["productId"], "readani.polyglot.monthly");
        assert_eq!(json["displayName"], "Polyglot");
        assert_eq!(json["displayPrice"], "$4.99");
    }

    #[cfg(not(target_os = "macos"))]
    #[test]
    fn reports_storekit_unavailable_outside_macos() {
        let status = get_subscription_status_for_product_ids(vec!["readani.monthly".to_string()])
            .expect("status response");

        assert!(!status.is_active);
        assert_eq!(status.message.as_deref(), Some("StoreKit is only available on macOS."));
    }
}
