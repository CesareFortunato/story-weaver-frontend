import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

function PlayPage() {
    const { storyId } = useParams();

    const [currentNode, setCurrentNode] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [isChangingScene, setIsChangingScene] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/stories/${storyId}/start`)
            .then(res => res.json())
            .then(data => {
                setCurrentNode(data.data);
            });
    }, [storyId]);

    function addTokensToInventory(tokens) {
        if (!tokens || tokens.length === 0) {
            return;
        }

        setInventory(prev => {
            const updated = [...prev];

            tokens.forEach(token => {
                const alreadyExists = updated.find(item => item.id === token.id);

                if (!alreadyExists) {
                    updated.push(token);
                }
            });

            return updated;
        });
    }

    function loadNextNode(choice) {
        addTokensToInventory(choice.tokens);

        if (!choice.next_node_id) {
            alert("Questa scelta non porta a nessun nodo");
            return;
        }

        setIsChangingScene(true);

        setTimeout(() => {
            fetch(`${API_BASE_URL}/api/nodes/${choice.next_node_id}`)
                .then(res => res.json())
                .then(data => {
                    setCurrentNode(data.data);
                    setIsChangingScene(false);
                });
        }, 400);
    }

    if (!currentNode) {
        return <p>Loading...</p>;
    }

    const backgroundImage = currentNode.image
        ? `${API_BASE_URL}/storage/${currentNode.image}`
        : null;

    return (
        <div
            className={`game-page ${isChangingScene ? "fade-out" : "fade-in"}`}
            style={{
                backgroundImage: backgroundImage
                    ? `url(${backgroundImage})`
                    : "linear-gradient(135deg, #111, #333)"
            }}
        >
            <div className="game-overlay">

                <div className="inventory">
                    <h2>Inventario</h2>

                    {inventory.length === 0 ? (
                        <p>Nessun token</p>
                    ) : (
                        inventory.map(token => (
                            <div className="token" key={token.id}>
                                {token.image && (
                                    <img
                                        src={`${API_BASE_URL}/storage/${token.image}`}
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
                    <h1>{currentNode.title}</h1>

                    <p className="scene-text">{currentNode.text}</p>

                    <div className="choices">
                        {currentNode.choices.length === 0 ? (
                            <p className="end-message">Fine della storia</p>
                        ) : (
                            currentNode.choices.map(choice => (
                                <button
                                    className="choice-button"
                                    key={choice.id}
                                    onClick={() => loadNextNode(choice)}
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