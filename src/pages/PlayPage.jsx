import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function PlayPage() {

    const { storyId } = useParams();

    const [currentNode, setCurrentNode] = useState(null);

    useEffect(() => {

        fetch(`http://127.0.0.1:8000/api/stories/${storyId}/start`)
            .then(res => res.json())
            .then(data => {
                setCurrentNode(data.data);
            });

    }, [storyId]);

    if (!currentNode) {
        return <p>Loading...</p>;
    }

    return (
        <div>

            <h1>{currentNode.title}</h1>

            <p>{currentNode.text}</p>

            {currentNode.image && (
                <img
                    src={`http://127.0.0.1:8000/storage/${currentNode.image}`}
                    width="400"
                />
            )}

            <hr />

            <h2>Scelte</h2>

            {currentNode.choices.map(choice => (

                <button
                    key={choice.id}
                    onClick={() => loadNextNode(choice.next_node_id)}
                >
                    {choice.text}
                </button>

            ))}

        </div>
    );
}

export default PlayPage;