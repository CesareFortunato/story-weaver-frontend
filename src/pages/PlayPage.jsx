import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL, getNode, getStoryStartNode } from "../api/storyApi";

const INVENTORY_STORAGE_KEY = "storyweaver_inventory";
const CURRENT_NODE_STORAGE_KEY = "storyweaver_current_node_id";

function PlayPage() {
    const { storyId, nodeId } = useParams();

    const [currentNode, setCurrentNode] = useState(null);
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

    const [isChangingScene, setIsChangingScene] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collectedTokens, setCollectedTokens] = useState([]);
    const [displayedText, setDisplayedText] = useState("");
    const [isTextComplete, setIsTextComplete] = useState(false);
    const [selectedChoiceId, setSelectedChoiceId] = useState(null);

    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [audio] = useState(() => {
        const ambientAudio = new Audio("/audio/ambient-loop.mp3");
        ambientAudio.loop = true;
        ambientAudio.volume = 0.35;
        return ambientAudio;
    });

    useEffect(() => {
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, [audio]);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const savedNodeId = localStorage.getItem(CURRENT_NODE_STORAGE_KEY);

        const request = nodeId
            ? getNode(nodeId)
            : savedNodeId
                ? getNode(savedNodeId)
                : getStoryStartNode(storyId);

        request
            .then(node => {
                setCurrentNode(node);
                localStorage.setItem(CURRENT_NODE_STORAGE_KEY, node.id);
            })
            .catch(error => {
                setError(error);
                setCurrentNode(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [storyId, nodeId]);



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

    useEffect(() => {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    }, [inventory]);

    function toggleMusic() {
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

    function addTokensToInventory(tokens) {
        if (!tokens || tokens.length === 0) {
            return;
        }

        const newTokens = [];

        setInventory(prev => {
            const updated = [...prev];

            tokens.forEach(token => {
                const alreadyExists = updated.find(item => item.id === token.id);

                if (!alreadyExists) {
                    updated.push(token);
                    newTokens.push(token);
                }
            });

            return updated;
        });

        if (newTokens.length > 0) {
            setCollectedTokens(newTokens);

            setTimeout(() => {
                setCollectedTokens([]);
            }, 2200);
        }
    }

    function loadNextNode(choice) {
        setSelectedChoiceId(choice.id);
        addTokensToInventory(choice.tokens);

        if (!choice.next_node_id) {
            setError({
                code: "CHOICE_WITHOUT_NEXT_NODE",
                message: "Questa scelta non porta ancora a nessun nodo.",
            });
            return;
        }

        setIsChangingScene(true);
        setError(null);

        setTimeout(() => {
            getNode(choice.next_node_id)
                .then(node => {
                    setCurrentNode(node);
                    setSelectedChoiceId(null);
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

    const backgroundImage = currentNode?.image_url
        ? `${API_BASE_URL}${currentNode.image_url}`
        : null;

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
                <Link className="home-button" to="/">
                    ← Home
                </Link>
                <button className="music-button" onClick={toggleMusic}>
                    {isMusicPlaying ? "🔊 Audio ON" : "🔈 Audio OFF"}
                </button>

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

                <div className="inventory">
                    <h2>Inventario</h2>

                    {inventory.length === 0 ? (
                        <p>Nessun token</p>
                    ) : (
                        inventory.map(token => (
                            <div className="token" key={token.id}>
                                {token.image_url && (
                                    <img
                                        src={`${API_BASE_URL}${token.image_url}`}
                                        width="36"
                                        alt={token.name}
                                    />
                                )}

                                <span>{token.name}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="scene-box">
                    {error && (
                        <div className="inline-error">
                            {error.message}
                        </div>
                    )}

                    <h1>{currentNode.title || "Nodo senza titolo"}</h1>

                    <p className="scene-text">
                        {displayedText}
                        {!isTextComplete && <span className="text-cursor">|</span>}
                    </p>

                    <div className="choices">
                        {currentNode.choices.length === 0 ? (
                            <div className="ending-box">
                                <p className="ending-label">Finale raggiunto</p>

                                <h2>{currentNode.title || "Fine della storia"}</h2>

                                <p className="ending-text">
                                    La tua storia termina qui. Le scelte compiute hanno lasciato un segno nel mondo.
                                </p>

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

                                <div className="ending-actions">
                                    <Link
                                        className="play-button"
                                        to="/"
                                        onClick={() => {
                                            localStorage.removeItem(INVENTORY_STORAGE_KEY);
                                            localStorage.removeItem(CURRENT_NODE_STORAGE_KEY);
                                        }}
                                    >
                                        Torna alla home
                                    </Link>

                                    <Link
                                        className="secondary-ending-button"
                                        to={`/play/${storyId || currentNode.story_id}`}
                                        onClick={() => {
                                            localStorage.removeItem(INVENTORY_STORAGE_KEY);
                                            localStorage.removeItem(CURRENT_NODE_STORAGE_KEY);
                                        }}
                                    >
                                        Rigioca
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            currentNode.choices.map(choice => (
                                <button
                                    className={`choice-button ${selectedChoiceId === choice.id ? "selected" : ""}`}
                                    key={choice.id}
                                    onClick={() => loadNextNode(choice)}
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