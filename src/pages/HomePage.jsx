import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function HomePage() {

    const [stories, setStories] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/stories")
            .then(res => res.json())
            .then(data => {
                setStories(data.data);
            });
    }, []);

    return (
        <div>

            <h1>StoryWeaver</h1>

            <h2>Storie disponibili</h2>

            {stories.map(story => (
                <div key={story.id}>

                    <h3>{story.title}</h3>

                    <p>{story.description}</p>

                    <Link to={`/play/${story.id}`}>
                        Gioca
                    </Link>

                    <hr />

                </div>
            ))}

        </div>
    );
}

export default HomePage;