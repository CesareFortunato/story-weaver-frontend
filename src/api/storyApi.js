// URL base del backend Laravel.
// Tutte le chiamate API partiranno da questo indirizzo.
const API_BASE_URL = "http://127.0.0.1:8000";

// Esporta la costante così può essere usata in altri file.
export { API_BASE_URL };


// =====================================================
// FUNZIONE GENERICA PER CHIAMATE API GET
// =====================================================

export async function apiGet(endpoint) {

    try {

        // Esegue una richiesta GET verso il backend Laravel.
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {

            // Header per indicare che vogliamo ricevere JSON.
            headers: {
                Accept: "application/json",
            },
        });

        // Converte la risposta in oggetto JavaScript.
        const data = await response.json();

        // Controlla se la risposta contiene errori:
        // - response.ok = false => errore HTTP
        // - success === false => errore gestito dal backend
        if (!response.ok || data.success === false) {

            // Lancia un oggetto errore personalizzato.
            throw {
                status: response.status,
                code: data.code || "API_ERROR",
                message: data.message || "Si è verificato un errore.",
            };
        }

        // Restituisce solo il contenuto utile della risposta.
        return data.data;

    } catch (error) {

        // Se l'errore arriva già dal backend,
        // lo rilanciamo senza modificarlo.
        if (error.code) {
            throw error;
        }

        // Errore generico:
        // backend spento, fetch fallita, rete assente, ecc.
        throw {
            status: 0,
            code: "API_NOT_REACHABLE",
            message: "Backend non raggiungibile. Controlla che Laravel sia avviato.",
        };
    }
}


// =====================================================
// STORIES API
// =====================================================

// Recupera tutte le stories disponibili.
export function getStories() {
    return apiGet("/api/stories");
}


// =====================================================
// START NODE API
// =====================================================

// Recupera il nodo iniziale di una specifica storia.
export function getStoryStart(storyId) {
    return apiGet(`/api/stories/${storyId}/start`);
}


// =====================================================
// NODE API
// =====================================================

// Recupera il dettaglio completo di un nodo.
export function getNode(nodeId) {
    return apiGet(`/api/nodes/${nodeId}`);
}