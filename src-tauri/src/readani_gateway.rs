use crate::storekit::get_readani_subscription_status;
use chrono::Utc;
use reqwest::StatusCode;
use serde::Deserialize;
use serde_json::Value;
use std::time::Duration;

const DEFAULT_READANI_GATEWAY_BASE_URL: &str = "https://gallantguo.com";
const READANI_GATEWAY_BASE_URL_ENV: &str = "READANI_GATEWAY_BASE_URL";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReadaniChatResponse {
    output_text: String,
}

#[derive(Debug, Deserialize)]
struct ReadaniModelsResponse {
    models: Vec<ReadaniModel>,
}

#[derive(Debug, Deserialize)]
struct ReadaniModel {
    id: String,
}

fn configured_gateway_base_url() -> String {
    std::env::var(READANI_GATEWAY_BASE_URL_ENV)
        .ok()
        .or_else(|| option_env!("READANI_GATEWAY_BASE_URL").map(ToString::to_string))
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_READANI_GATEWAY_BASE_URL.to_string())
}

fn readani_chat_url(base_url: &str) -> Result<String, String> {
    readani_api_url(base_url, "chat")
}

fn readani_models_url(base_url: &str) -> Result<String, String> {
    readani_api_url(base_url, "models")
}

fn readani_api_url(base_url: &str, endpoint: &str) -> Result<String, String> {
    let base_url = base_url.trim().trim_end_matches('/');
    if base_url.is_empty() {
        return Err("readani gateway base URL is missing.".to_string());
    }
    Ok(format!("{base_url}/api/readani/{endpoint}"))
}

fn build_http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(90))
        .build()
        .map_err(|error| format!("Failed to prepare the readani gateway client: {error}"))
}

fn current_transaction_jws() -> Result<String, String> {
    let status = get_readani_subscription_status()?;
    if !status.is_active {
        return Err(status
            .message
            .unwrap_or_else(|| "An active readani subscription is required.".to_string()));
    }

    status
        .transaction_jws
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "StoreKit did not return subscription proof.".to_string())
}

fn fallback_idempotency_key() -> String {
    format!("readani-{}", Utc::now().timestamp_millis())
}

fn build_readani_chat_payload(
    model: &str,
    transaction_jws: &str,
    system_prompt: &str,
    user_prompt: &str,
) -> Value {
    serde_json::json!({
        "subscriptionProof": {
            "transactionJws": transaction_jws
        },
        "model": model,
        "stream": false,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_prompt }
        ],
        "metadata": {
            "feature": "translation"
        }
    })
}

fn build_readani_models_payload(transaction_jws: &str) -> Value {
    serde_json::json!({
        "subscriptionProof": {
            "transactionJws": transaction_jws
        }
    })
}

fn parse_readani_chat_response(body: &str) -> Result<String, String> {
    let parsed: ReadaniChatResponse = serde_json::from_str(body).map_err(|error| {
        format!("readani gateway returned unreadable JSON: {error} (body: {body})")
    })?;

    Ok(parsed.output_text)
}

fn summarize_readani_gateway_error(body: &str) -> String {
    let trimmed = body.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    if let Ok(value) = serde_json::from_str::<Value>(trimmed) {
        for pointer in ["/error/message", "/message", "/error"] {
            if let Some(message) = value.pointer(pointer).and_then(Value::as_str) {
                let message = message.trim();
                if !message.is_empty() {
                    return message.to_string();
                }
            }
        }
    }

    trimmed.chars().take(280).collect()
}

fn gateway_error(status: StatusCode, body: &str) -> String {
    let detail = summarize_readani_gateway_error(body);
    if detail.is_empty() {
        format!("readani gateway error: {status}")
    } else {
        format!("readani gateway error: {status} {detail}")
    }
}

pub async fn request_readani_chat_completion(
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    request_id: Option<&str>,
) -> Result<String, String> {
    let transaction_jws = current_transaction_jws()?;
    let client = build_http_client()?;
    let payload = build_readani_chat_payload(model, &transaction_jws, system_prompt, user_prompt);
    let idempotency_key = request_id
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
        .unwrap_or_else(fallback_idempotency_key);

    let response = client
        .post(readani_chat_url(&configured_gateway_base_url())?)
        .header("Content-Type", "application/json")
        .header("Idempotency-Key", idempotency_key)
        .json(&payload)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("readani gateway response read failed: {error}"))?;

    if !status.is_success() {
        return Err(gateway_error(status, &body));
    }

    parse_readani_chat_response(&body)
}

pub async fn list_readani_models() -> Result<Vec<String>, String> {
    let transaction_jws = current_transaction_jws()?;
    let client = build_http_client()?;
    let payload = build_readani_models_payload(&transaction_jws);
    let response = client
        .post(readani_models_url(&configured_gateway_base_url())?)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("readani gateway response read failed: {error}"))?;

    if !status.is_success() {
        return Err(gateway_error(status, &body));
    }

    let parsed: ReadaniModelsResponse = serde_json::from_str(&body).map_err(|error| {
        format!("readani gateway returned unreadable model JSON: {error} (body: {body})")
    })?;

    Ok(parsed.models.into_iter().map(|model| model.id).collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_chat_url_from_base_url() {
        assert_eq!(
            readani_chat_url("https://gallantguo.com").unwrap(),
            "https://gallantguo.com/api/readani/chat"
        );
        assert_eq!(
            readani_chat_url("https://gallantguo.com/").unwrap(),
            "https://gallantguo.com/api/readani/chat"
        );
    }

    #[test]
    fn builds_readani_chat_payload_with_subscription_proof() {
        let payload = build_readani_chat_payload(
            "general-fast",
            "transaction.jws",
            "Translate as JSON.",
            "[]",
        );

        assert_eq!(payload["subscriptionProof"]["transactionJws"], "transaction.jws");
        assert_eq!(payload["model"], "general-fast");
        assert_eq!(payload["stream"], false);
        assert_eq!(payload["metadata"]["feature"], "translation");
        assert_eq!(payload["messages"][0]["role"], "system");
        assert_eq!(payload["messages"][1]["role"], "user");
    }

    #[test]
    fn parses_gateway_output_text() {
        let body = r#"{
          "id": "chat_1",
          "requestId": "readani_req_1",
          "model": "general-fast",
          "outputText": "[{\"sid\":\"s1\",\"translation\":\"你好\"}]",
          "finishReason": "stop",
          "usage": { "inputTokens": 1, "outputTokens": 1, "totalTokens": 2 }
        }"#;

        assert_eq!(
            parse_readani_chat_response(body).unwrap(),
            r#"[{"sid":"s1","translation":"你好"}]"#
        );
    }

    #[test]
    fn summarizes_gateway_error_body() {
        let body = r#"{"error":{"code":"forbidden","message":"Subscription expired"}}"#;
        assert_eq!(summarize_readani_gateway_error(body), "Subscription expired");
    }
}
