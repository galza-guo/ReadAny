use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub const PAGE_PROMPT_VERSION: &str = "page-v1";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedPageTranslation {
    pub page: u32,
    pub translated_text: String,
    pub source_hash: String,
    pub provider_id: String,
    pub model: String,
    pub language: String,
    pub prompt_version: String,
    pub cached_at: DateTime<Utc>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct PageTranslationCache {
    pub entries: HashMap<String, CachedPageTranslation>,
}

pub fn page_cache_key(
    doc_id: &str,
    page: u32,
    source_hash: &str,
    provider_id: &str,
    model: &str,
    language: &str,
    prompt_version: &str,
) -> String {
    format!("{doc_id}|{page}|{source_hash}|{provider_id}|{model}|{language}|{prompt_version}")
}

fn cache_entry_matches_scope(
    key: &str,
    entry: &CachedPageTranslation,
    doc_id: &str,
    provider_id: &str,
    model: &str,
    language: &str,
    prompt_version: &str,
) -> bool {
    key.starts_with(&format!("{doc_id}|"))
        && entry.provider_id == provider_id
        && entry.model == model
        && entry.language == language
        && entry.prompt_version == prompt_version
}

pub fn list_cached_pages(
    cache: &PageTranslationCache,
    doc_id: &str,
    provider_id: &str,
    model: &str,
    language: &str,
    prompt_version: &str,
) -> Vec<u32> {
    let mut pages: Vec<u32> = cache
        .entries
        .iter()
        .filter(|(key, entry)| {
            cache_entry_matches_scope(
                key,
                entry,
                doc_id,
                provider_id,
                model,
                language,
                prompt_version,
            )
        })
        .map(|(_, entry)| entry.page)
        .collect();

    pages.sort_unstable();
    pages.dedup();
    pages
}

pub fn clear_cached_page(
    cache: &mut PageTranslationCache,
    doc_id: &str,
    page: u32,
    provider_id: &str,
    model: &str,
    language: &str,
    prompt_version: &str,
) -> usize {
    let before = cache.entries.len();
    cache.entries.retain(|key, entry| {
        !cache_entry_matches_scope(
            key,
            entry,
            doc_id,
            provider_id,
            model,
            language,
            prompt_version,
        ) || entry.page != page
    });
    before.saturating_sub(cache.entries.len())
}

pub fn clear_cached_pages_for_document(
    cache: &mut PageTranslationCache,
    doc_id: &str,
    provider_id: &str,
    model: &str,
    language: &str,
    prompt_version: &str,
) -> usize {
    let before = cache.entries.len();
    cache.entries.retain(|key, entry| {
        !cache_entry_matches_scope(
            key,
            entry,
            doc_id,
            provider_id,
            model,
            language,
            prompt_version,
        )
    });
    before.saturating_sub(cache.entries.len())
}

#[cfg(test)]
mod tests {
    use super::{
        clear_cached_page, clear_cached_pages_for_document, list_cached_pages, page_cache_key,
        CachedPageTranslation, PageTranslationCache,
    };
    use chrono::Utc;
    use std::collections::HashMap;

    fn build_cache() -> PageTranslationCache {
        let mut entries = HashMap::new();

        let matching_entry = |page: u32, source_hash: &str| CachedPageTranslation {
            page,
            translated_text: format!("translated-{page}"),
            source_hash: source_hash.to_string(),
            provider_id: "openrouter".to_string(),
            model: "m1".to_string(),
            language: "zh-CN".to_string(),
            prompt_version: "v1".to_string(),
            cached_at: Utc::now(),
        };

        entries.insert(
            page_cache_key("doc-a", 1, "hash-1", "openrouter", "m1", "zh-CN", "v1"),
            matching_entry(1, "hash-1"),
        );
        entries.insert(
            page_cache_key("doc-a", 2, "hash-2", "openrouter", "m1", "zh-CN", "v1"),
            matching_entry(2, "hash-2"),
        );
        entries.insert(
            page_cache_key("doc-b", 1, "hash-3", "openrouter", "m1", "zh-CN", "v1"),
            CachedPageTranslation {
                page: 1,
                translated_text: "other-doc".to_string(),
                source_hash: "hash-3".to_string(),
                provider_id: "openrouter".to_string(),
                model: "m1".to_string(),
                language: "zh-CN".to_string(),
                prompt_version: "v1".to_string(),
                cached_at: Utc::now(),
            },
        );
        entries.insert(
            page_cache_key("doc-a", 1, "hash-4", "openrouter", "m2", "zh-CN", "v1"),
            CachedPageTranslation {
                page: 1,
                translated_text: "other-model".to_string(),
                source_hash: "hash-4".to_string(),
                provider_id: "openrouter".to_string(),
                model: "m2".to_string(),
                language: "zh-CN".to_string(),
                prompt_version: "v1".to_string(),
                cached_at: Utc::now(),
            },
        );

        PageTranslationCache { entries }
    }

    #[test]
    fn page_cache_key_changes_when_provider_or_prompt_version_changes() {
        let a = page_cache_key("doc", 12, "hash", "openrouter", "m1", "zh-CN", "v1");
        let b = page_cache_key("doc", 12, "hash", "custom", "m1", "zh-CN", "v1");
        let c = page_cache_key("doc", 12, "hash", "openrouter", "m1", "zh-CN", "v2");
        assert_ne!(a, b);
        assert_ne!(a, c);
    }

    #[test]
    fn lists_cached_pages_for_one_document_and_settings_tuple() {
        let cache = build_cache();

        assert_eq!(
            list_cached_pages(&cache, "doc-a", "openrouter", "m1", "zh-CN", "v1"),
            vec![1, 2]
        );
    }

    #[test]
    fn clears_only_the_requested_cached_page() {
        let mut cache = build_cache();

        assert_eq!(
            clear_cached_page(&mut cache, "doc-a", 1, "openrouter", "m1", "zh-CN", "v1"),
            1
        );
        assert_eq!(
            list_cached_pages(&cache, "doc-a", "openrouter", "m1", "zh-CN", "v1"),
            vec![2]
        );
    }

    #[test]
    fn clears_all_matching_cached_pages_without_touching_other_documents_or_models() {
        let mut cache = build_cache();

        assert_eq!(
            clear_cached_pages_for_document(
                &mut cache,
                "doc-a",
                "openrouter",
                "m1",
                "zh-CN",
                "v1"
            ),
            2
        );
        assert_eq!(
            list_cached_pages(&cache, "doc-a", "openrouter", "m1", "zh-CN", "v1"),
            Vec::<u32>::new()
        );
        assert_eq!(
            list_cached_pages(&cache, "doc-b", "openrouter", "m1", "zh-CN", "v1"),
            vec![1]
        );
        assert_eq!(
            list_cached_pages(&cache, "doc-a", "openrouter", "m2", "zh-CN", "v1"),
            vec![1]
        );
    }
}
