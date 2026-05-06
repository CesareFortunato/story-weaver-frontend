import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function PlayPage() {
    const { storyId } = useParams();

    const [currentNode, setCurrentNode] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [isChangingScene, setIsChangingScene] = useState(false);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/stories/${storyId}/start`)
            .then(res => res.json())
            .then(data => {
                setCurrentNode(data.data);
            });
    }, [storyId]);

    function loadNextNode(choice) {
        if (choice.tokens.length > 0) {
            setInventory(prev => {
                const updated = [...prev];

                choice.tokens.forEach(token => {
                    const alreadyExists = updated.find(t => t.id === token.id);

                    if (!alreadyExists) {
                        updated.push(token);
                    }
                });

                return updated;
            });
        }

        if (!choice.next_node_id) {
            alert("Questa scelta non porta a nessun nodo");
            return;
        }

        setIsChangingScene(true);

        setTimeout(() => {
            fetch(`http://127.0.0.1:8000/api/nodes/${choice.next_node_id}`)
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

    return (
        <div className={`game-page ${isChangingScene ? "fade-out" : "fade-in"}`}>

            <div className="inventory">
                <h2>Inventario</h2>

                {inventory.length === 0 ? (
                    <p>Nessun token raccolto</p>
                ) : (
                    inventory.map(token => (
                        <div className="token" key={token.id}>
                            {token.image && (
                                <img
                                    src={`http://127.0.0.1:8000/storage/${token.image}`}
                                    width="40"
                                />
                            )}

                            <span>{token.name}</span>
                        </div>
                    ))
                )}
            </div>

            <h1>{currentNode.title}</h1>

            <p>{currentNode.text}</p>

            {currentNode.image && (
                <img
                    className="scene-image"
                    src={`http://127.0.0.1:8000/storage/${currentNode.image}`}
                    alt={currentNode.title}
                />
            )}

            <hr />

            <h2>Scelte</h2>

            {currentNode.choices.length === 0 ? (
                <p>Fine della storia</p>
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
    );
}

export default PlayPage;