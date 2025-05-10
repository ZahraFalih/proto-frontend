// API Configuration
export const API_CONFIG = {
    METHOD: 'https',
    URL_BASE: 'husseinhh.pythonanywhere.com',
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
    return `${API_CONFIG.METHOD}://${API_CONFIG.URL_BASE}${endpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
    // Auth endpoints
    AUTH: {
        LOGIN: '/auth/login/',
        SIGNUP: '/auth/signup/',
        LOGOUT: '/auth/logout/',
        CHANGE_EMAIL: '/auth/change-email/',
        CHANGE_PASSWORD: '/auth/change-password/',
    },
    
    // Onboarding endpoints
    ONBOARD: {
        USER: '/onboard/user-onboard/',
        BUSINESS: '/onboard/business-onboard/',
        PAGE: '/onboard/page-onboard/',
        UPLOAD_SCREENSHOT: '/onboard/upload-screenshot/',
        PAGES: (id, type) => `/onboard/pages/${id}/${encodeURIComponent(type)}/`,
    },
    
    // Upload endpoints
    UPLOAD: {
        CREATE: '/upload/create/',
        SHOW: (fileId) => `/upload/show/${fileId}/`,
    },
    
    // Toolkit endpoints
    TOOLKIT: {
        USER_PAGES: '/toolkit/user-pages/',
        WEB_METRICS: {
            ROLE_MODEL: (pageId, timestamp) => `/toolkit/web-metrics/role-model/?page_id=${pageId}&_t=${timestamp}`,
            BUSINESS: (pageId, timestamp) => `/toolkit/web-metrics/business/?page_id=${pageId}&_t=${timestamp}`,
        },
    },
    
    // AI endpoints
    AI: {
        EVALUATE: {
            WEB_METRICS: (pageId) => `/ask-ai/evaluate-web-metrics/?page_id=${pageId}`,
            UI: (pageId, timestamp) => `/ask-ai/evaluate-ui/?page_id=${pageId}&_t=${timestamp}`,
            UBA: (pageId, timestamp) => `/ask-ai/evaluate-uba/?page_id=${pageId}&_t=${timestamp}`,
        },
        WEB_SEARCH: (pageId, timestamp) => `/ask-ai/web-search/?page_id=${pageId}&_t=${timestamp}`,
        FORMULATE_UBA: (pageId, timestamp) => `/ask-ai/formulate-uba-answer/?page_id=${pageId}&_t=${timestamp}`,
        CHAT: '/ask-ai/chat/',
    },
}; 