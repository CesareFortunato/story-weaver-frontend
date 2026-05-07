const API_BASE_URL = "http://127.0.0.1:8000";

export { API_BASE_URL };

export async function apiGet(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                Accept: "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw {
                status: response.status,
                code: data.code || "API_ERROR",
                message: data.message || "Si è verificato un errore.",
            };
        }

        return data.data;
    } catch (error) {
        if (error.code) {
            throw error;
        }

        throw {
            status: 0,
            code: "API_NOT_REACHABLE",
            message: "Backend non raggiungibile. Controlla che Laravel sia avviato.",
        };
    }
}

export function getStories() {
    return apiGet("/api/stories");
}

export function getStoryStart(storyId) {
    return apiGet(`/api/stories/${storyId}/start`);
}

export function getNode(nodeId) {
    return apiGet(`/api/nodes/${nodeId}`);
}