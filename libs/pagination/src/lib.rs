use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PaginationMeta {
    pub total: u64,
    pub per_page: u32,
    pub current_page: u32,
    pub last_page: u32,
    pub first_page: u32,
    pub first_page_url: String,
    pub last_page_url: String,
    pub next_page_url: Option<String>,
    pub previous_page_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PaginatedResponse<T> {
    pub meta: PaginationMeta,
    pub data: T,
}

#[derive(Debug, Clone, Copy)]
pub struct PaginationParams {
    pub page: u32,
    pub per_page: u32,
}

impl PaginationParams {
    pub fn new(page: u32, per_page: u32) -> Self {
        Self {
            page: page.max(1),
            per_page: per_page.clamp(1, 100),
        }
    }

    pub fn offset(&self) -> u64 {
        ((self.page - 1) * self.per_page) as u64
    }

    pub fn limit(&self) -> u32 {
        self.per_page
    }
}

pub struct PaginationBuilder {
    base_url: String,
}

impl PaginationBuilder {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into(),
        }
    }

    pub fn build<T>(&self, data: T, params: PaginationParams, total: u64) -> PaginatedResponse<T> {
        let last_page = ((total as f64) / (params.per_page as f64)).ceil() as u32;
        let last_page = last_page.max(1);

        PaginatedResponse {
            meta: PaginationMeta {
                total,
                per_page: params.per_page,
                current_page: params.page,
                last_page,
                first_page: 1,
                first_page_url: format!("{}?page=1", self.base_url),
                last_page_url: format!("{}?page={}", self.base_url, last_page),
                next_page_url: if params.page < last_page {
                    Some(format!("{}?page={}", self.base_url, params.page + 1))
                } else {
                    None
                },
                previous_page_url: if params.page > 1 {
                    Some(format!("{}?page={}", self.base_url, params.page - 1))
                } else {
                    None
                },
            },
            data,
        }
    }
}
