import { useEffect, useState } from "react";

import { API_BASE_URL, getNode, getStoryStart } from "../api/storyApi";
import { Link, useParams, useSearchParams } from "react-router-dom";

// Chiavi usate per salvare inventario, nodo corrente e storia corrente nel localStorage.
const INVENTORY_STORAGE_KEY = "storyweaver_inventory";
const CURRENT_NODE_STORAGE_KEY = "storyweaver_current_node_id";
const CURRENT_STORY_STORAGE_KEY = "storyweaver_current_story_id";


function PlayPage() {
    // Recupera i parametri dinamici dalla rotta.
    const { storyId, nodeId } = useParams();

    const [searchParams] = useSearchParams();

    const isFreshPlaytest = searchParams.get("fresh") === "1";

    // Stato della storia corrente e del nodo attualmente visualizzato.
    const [currentStory, setCurrentStory] = useState(null);
    const [currentNode, setCurrentNode] = useState(null);

    // Tiene memoria dell'id storia anche quando si entra da /play-node/:nodeId.
    const [activeStoryId, setActiveStoryId] = useState(() => {
        return storyId || localStorage.getItem(CURRENT_STORY_STORAGE_KEY);
    });

    // Inventario inizializzato leggendo eventuali token salvati nel localStorage.
    const [inventory, setInventory] = useState(() => {
        const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);

        if (!savedInventory) {
            return [];
        }

        try {
            return JSON.parse(savedInventory);
        } catch {
            return [];
        }
    });

    // Stati UI principali.
    const [isChangingScene, setIsChangingScene] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collectedTokens, setCollectedTokens] = useState([]);
    const [displayedText, setDisplayedText] = useState("");
    const [isTextComplete, setIsTextComplete] = useState(false);
    const [selectedChoiceId, setSelectedChoiceId] = useState(null);

    // Stati per la gestione dell'audio ambientale.
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [audio, setAudio] = useState(null);

    // Token selezionato nell'inventario per aprire la modale.
    const [selectedToken, setSelectedToken] = useState(null);

    // Carica il nodo da mostrare:
    // - se arriva nodeId dalla rotta, usa quello
    // - altrimenti prova a riprendere il nodo salvato
    // - se non esiste, parte dal nodo iniziale della storia
    useEffect(() => {
        setLoading(true);
        setError(null);

        const savedNodeId = isFreshPlaytest
            ? null
            : localStorage.getItem(CURRENT_NODE_STORAGE_KEY);

        const request = nodeId
            ? getNode(nodeId)
            : savedNodeId
                ? getNode(savedNodeId)
                : getStoryStart(storyId);

        if (isFreshPlaytest) {
            localStorage.removeItem(INVENTORY_STORAGE_KEY);
            localStorage.removeItem(CURRENT_NODE_STORAGE_KEY);
            localStorage.removeItem(CURRENT_STORY_STORAGE_KEY);
        }

        request
            .then(data => {
                // Alcune API restituiscono direttamente il nodo,
                // altre restituiscono { story, node }.
                const node = data.node || data;

                setCurrentNode(node);

                // Se la risposta include i dati della storia, li salva.
                if (data.story) {
                    setCurrentStory(data.story);
                    setActiveStoryId(data.story.id);
                    localStorage.setItem(CURRENT_STORY_STORAGE_KEY, data.story.id);
                }

                // Se il nodo contiene story_id, lo usa come fallback robusto.
                if (node.story_id) {
                    setActiveStoryId(node.story_id);
                    localStorage.setItem(CURRENT_STORY_STORAGE_KEY, node.story_id);
                }

                // Se arrivo da /play/:storyId, salvo anche quello.
                if (storyId) {
                    setActiveStoryId(storyId);
                    localStorage.setItem(CURRENT_STORY_STORAGE_KEY, storyId);
                }

                // Salva il nodo corrente per poter continuare la partita.
                localStorage.setItem(CURRENT_NODE_STORAGE_KEY, node.id);
            })
            .catch(error => {
                setError(error);
                setCurrentNode(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [storyId, nodeId, isFreshPlaytest]);

    // Prepara l'audio ambientale della storia, se configurato nel backend.
    useEffect(() => {
        if (!currentStory?.ambient_audio_url) {
            setAudio(null);
            setIsMusicPlaying(false);
            return;
        }

        const ambientAudio = new Audio(`${API_BASE_URL}${currentStory.ambient_audio_url}`);

        // Loop continuo e volume controllato.
        ambientAudio.loop = true;
        ambientAudio.volume = 0.35;

        setAudio(ambientAudio);

        // Cleanup: ferma l'audio quando cambia storia o si smonta il componente.
        return () => {
            ambientAudio.pause();
            ambientAudio.currentTime = 0;
        };
    }, [currentStory]);

    // Effetto macchina da scrivere sul testo del nodo.
    useEffect(() => {
        if (!currentNode?.text) {
            return;
        }

        setDisplayedText("");
        setIsTextComplete(false);

        let index = 0;

        const interval = setInterval(() => {
            setDisplayedText(currentNode.text.slice(0, index + 1));
            index++;

            if (index >= currentNode.text.length) {
                clearInterval(interval);
                setIsTextComplete(true);
            }
        }, 24);

        return () => clearInterval(interval);
    }, [currentNode]);

    // Ogni volta che cambia l'inventario, lo salva nel localStorage.
    useEffect(() => {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    }, [inventory]);

    // Attiva o disattiva la musica ambientale.
    function toggleMusic() {
        if (!audio) {
            setError({
                code: "AUDIO_NOT_AVAILABLE",
                message: "Questa storia non ha un audio ambientale configurato.",
            });
            return;
        }

        if (isMusicPlaying) {
            audio.pause();
            setIsMusicPlaying(false);
            return;
        }

        audio.play()
            .then(() => {
                setIsMusicPlaying(true);
            })
            .catch(() => {
                setError({
                    code: "AUDIO_NOT_AVAILABLE",
                    message: "Audio non disponibile o file mancante.",
                });
            });
    }

    // Aggiunge all'inventario i token ottenuti da una scelta.
    function addTokensToInventory(tokens) {
        if (!tokens || tokens.length === 0) {
            return;
        }

        const newTokens = [];

        setInventory(prev => {
            const updated = [...prev];

            tokens.forEach(token => {
                // Evita duplicati controllando l'id del token.
                const alreadyExists = updated.find(item => item.id === token.id);

                if (!alreadyExists) {
                    updated.push(token);
                    newTokens.push(token);
                }
            });

            return updated;
        });

        // Mostra un toast temporaneo con i nuovi token raccolti.
        if (newTokens.length > 0) {
            setCollectedTokens(newTokens);

            setTimeout(() => {
                setCollectedTokens([]);
            }, 2200);
        }
    }

    // Gestisce il click su una scelta e carica il nodo successivo.
    function loadNextNode(choice) {
        setSelectedChoiceId(choice.id);

        // Prima di cambiare scena assegna eventuali token.
        addTokensToInventory(choice.tokens);

        // Se la scelta non ha destinazione, mostra errore.
        if (!choice.next_node_id) {
            setError({
                code: "CHOICE_WITHOUT_NEXT_NODE",
                message: "Questa scelta non porta ancora a nessun nodo.",
            });
            return;
        }

        setIsChangingScene(true);
        setError(null);

        // Piccolo delay per permettere l'effetto di transizione.
        setTimeout(() => {
            getNode(choice.next_node_id)
                .then(node => {
                    setCurrentNode(node);
                    setSelectedChoiceId(null);

                    // Mantiene aggiornato l'id storia anche durante la navigazione tra nodi.
                    if (node.story_id) {
                        setActiveStoryId(node.story_id);
                        localStorage.setItem(CURRENT_STORY_STORAGE_KEY, node.story_id);
                    }

                    // Aggiorna il nodo corrente salvato.
                    localStorage.setItem(CURRENT_NODE_STORAGE_KEY, node.id);
                })
                .catch(error => {
                    setError(error);
                })
                .finally(() => {
                    setIsChangingScene(false);
                });
        }, 400);
    }

    // Reset completo della partita.
    function resetPlaySession() {
        localStorage.removeItem(INVENTORY_STORAGE_KEY);
        localStorage.removeItem(CURRENT_NODE_STORAGE_KEY);
        localStorage.removeItem(CURRENT_STORY_STORAGE_KEY);
    }

    // Stato di caricamento iniziale.
    if (loading) {
        return (
            <main className="play-state-page">
                <div className="state-card">
                    <div className="loader"></div>

                    <p>Caricamento scena...</p>

                    <Link className="secondary-link" to="/">
                        Torna alla home
                    </Link>
                </div>
            </main>
        );
    }

    // Stato di errore bloccante, quando non è stato caricato nessun nodo.
    if (error && !currentNode) {
        return (
            <main className="play-state-page">
                <div className="state-card error-card">
                    <h1>Impossibile avviare la storia</h1>

                    <p>{error.message}</p>

                    {error.code && (
                        <p className="error-code">Codice: {error.code}</p>
                    )}

                    <Link className="play-button" to="/">
                        Torna alla home
                    </Link>
                </div>
            </main>
        );
    }

    // Imposta l'immagine di sfondo della scena se presente.
    const backgroundImage = currentNode?.image_url
        ? `${API_BASE_URL}${currentNode.image_url}`
        : null;

    // Id storia usato dal pulsante "Rigioca".
    const replayStoryId = activeStoryId || storyId || currentStory?.id || currentNode?.story_id;

    return (
        <div
            className={`game-page ${isChangingScene ? "fade-out" : "fade-in"}`}
            style={{
                backgroundImage: backgroundImage
                    ? `url(${backgroundImage})`
                    : "linear-gradient(135deg, #111, #333)",
            }}
        >
            <div className="game-overlay">

                {/* Link per tornare alla home */}
                <Link className="home-button" to="/">
                    ← Home
                </Link>

                {/* Pulsante audio ambientale */}
                <button className="music-button" onClick={toggleMusic}>
                    {isMusicPlaying ? "🔊 Audio ON" : "🔈 Audio OFF"}
                </button>

                {/* Toast mostrato quando vengono raccolti nuovi token */}
                {collectedTokens.length > 0 && (
                    <div className="token-toast">
                        <strong>Token raccolto</strong>

                        {collectedTokens.map(token => (
                            <div className="token-toast-item" key={token.id}>
                                {token.image_url && (
                                    <img
                                        src={`${API_BASE_URL}${token.image_url}`}
                                        alt={token.name}
                                    />
                                )}

                                <span>{token.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inventario del giocatore */}
                <div className="inventory">
                    <h2>Inventario</h2>

                    {inventory.length === 0 ? (
                        <p>Nessun token</p>
                    ) : (
                        inventory.map(token => (
                            <button
                                className="token"
                                key={token.id}
                                onClick={() => setSelectedToken(token)}
                            >
                                {token.image_url && (
                                    <img
                                        src={`${API_BASE_URL}${token.image_url}`}
                                        width="36"
                                        alt={token.name}
                                    />
                                )}

                                <span>{token.name}</span>
                            </button>
                        ))
                    )}
                </div>

                {/* Modale dettaglio token selezionato */}
                {selectedToken && (
                    <div className="token-modal-backdrop" onClick={() => setSelectedToken(null)}>
                        <div className="token-modal" onClick={event => event.stopPropagation()}>

                            <button
                                className="token-modal-close"
                                onClick={() => setSelectedToken(null)}
                            >
                                ×
                            </button>

                            {selectedToken.image_url && (
                                <img
                                    className="token-modal-image"
                                    src={`${API_BASE_URL}${selectedToken.image_url}`}
                                    alt={selectedToken.name}
                                />
                            )}

                            <p className="token-modal-label">Token</p>

                            <h2>{selectedToken.name}</h2>

                            <p className="token-modal-description">
                                {selectedToken.description || "Nessuna descrizione disponibile."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Box principale della scena */}
                <div className="scene-box">

                    {/* Errore non bloccante, ad esempio scelta senza destinazione */}
                    {error && (
                        <div className="inline-error">
                            {error.message}
                        </div>
                    )}

                    <h1>{currentNode.title || "Nodo senza titolo"}</h1>

                    {/* Testo della scena con effetto typing */}
                    <p className="scene-text">
                        {displayedText}
                        {!isTextComplete && <span className="text-cursor">|</span>}
                    </p>

                    {/* Scelte oppure schermata finale */}
                    <div className="choices">
                        {currentNode.choices.length === 0 ? (

                            // Se il nodo non ha scelte, viene considerato finale.
                            <div className="ending-box">
                                <p className="ending-label">Finale raggiunto</p>

                                <h2>{currentNode.title || "Fine della storia"}</h2>

                                <p className="ending-text">
                                    La tua storia termina qui. Le scelte compiute hanno lasciato un segno nel mondo.
                                </p>

                                {/* Riepilogo token raccolti durante la partita */}
                                {inventory.length > 0 && (
                                    <div className="ending-inventory">
                                        <h3>Token raccolti</h3>

                                        <div className="ending-token-list">
                                            {inventory.map(token => (
                                                <div className="ending-token" key={token.id}>
                                                    {token.image_url && (
                                                        <img
                                                            src={`${API_BASE_URL}${token.image_url}`}
                                                            alt={token.name}
                                                        />
                                                    )}

                                                    <span>{token.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Azioni finali */}
                                <div className="ending-actions">
                                    <Link
                                        className="play-button"
                                        to="/"
                                        onClick={resetPlaySession}
                                    >
                                        Torna alla home
                                    </Link>

                                    {replayStoryId && (
                                        <Link
                                            className="secondary-ending-button"
                                            to={`/play/${replayStoryId}`}
                                            onClick={resetPlaySession}
                                        >
                                            Rigioca
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ) : (

                            // Lista delle scelte disponibili.
                            currentNode.choices.map(choice => (
                                <button
                                    className={`choice-button ${selectedChoiceId === choice.id ? "selected" : ""}`}
                                    key={choice.id}
                                    onClick={() => loadNextNode(choice)}

                                    // Le scelte sono disabilitate durante il cambio scena
                                    // o finché il testo non è stato mostrato tutto.
                                    disabled={isChangingScene || !isTextComplete}
                                >
                                    {choice.text}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlayPage;