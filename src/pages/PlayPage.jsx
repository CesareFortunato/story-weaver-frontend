import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function PlayPage() {

    const { storyId } = useParams();

    const [currentNode, setCurrentNode] = useState(null);

    const [inventory, setInventory] = useState([]);

    // LOAD START NODE
    useEffect(() => {

        fetch(`http://127.0.0.1:8000/api/stories/${storyId}/start`)
            .then(res => res.json())
            .then(data => {
                setCurrentNode(data.data);
            });

    }, [storyId]);

    // LOAD NEXT NODE
    function loadNextNode(choice) {

        // AGGIUNGO TOKEN INVENTARIO
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

        // SE NON C'È DESTINAZIONE
        if (!choice.next_node_id) {
            alert("Questa scelta non porta a nessun nodo");
            return;
        }

        // FETCH NEXT NODE
        fetch(`http://127.0.0.1:8000/api/nodes/${choice.next_node_id}`)
            .then(res => res.json())
            .then(data => {
                setCurrentNode(data.data);
            });
    }

    if (!currentNode) {
        return <p>Loading...</p>;
    }

    return (
        <div>

            {/* INVENTARIO */}
            <div style={{
                border: "1px solid white",
                padding: "10px",
                marginBottom: "20px"
            }}>

                <h2>Inventario</h2>

                {inventory.length === 0 ? (
                    <p>Nessun token raccolto</p>
                ) : (
                    inventory.map(token => (
                        <div key={token.id}>

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

            {/* NODO */}
            <h1>{currentNode.title}</h1>

            <p>{currentNode.text}</p>

            {currentNode.image && (
                <img
                    src={`http://127.0.0.1:8000/storage/${currentNode.image}`}
                    width="400"
                />
            )}

            <hr />

            {/* SCELTE */}
            <h2>Scelte</h2>

            {currentNode.choices.length === 0 ? (
                <p>Fine della storia</p>
            ) : (
                currentNode.choices.map(choice => (

                    <div key={choice.id} style={{ marginBottom: "10px" }}>

                        <button
                            onClick={() => loadNextNode(choice)}
                        >
                            {choice.text}
                        </button>

                    </div>

                ))
            )}

        </div>
    );
}

export default PlayPage;