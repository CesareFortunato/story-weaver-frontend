import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStories } from "../api/storyApi";

function HomePage() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getStories()
            .then(data => {
                setStories(data);
                setError(null);
            })
            .catch(error => {
                setError(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <main className="home-page">
            <section className="hero">
                <p className="eyebrow">Interactive dark stories</p>
                <h1>StoryWeaver</h1>
                <p className="hero-text">
                    Scegli una storia, esplora i nodi, raccogli token e scopri dove ti porta il racconto.
                </p>
            </section>

            <section className="stories-section">
                <div className="section-header">
                    <h2>Storie disponibili</h2>
                    <p>{stories.length} storie trovate</p>
                </div>

                {loading && (
                    <div className="state-card">
                        <div className="loader"></div>
                        <p>Caricamento storie...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="state-card error-card">
                        <h3>Qualcosa non va</h3>
                        <p>{error.message}</p>
                    </div>
                )}

                {!loading && !error && stories.length === 0 && (
                    <div className="state-card">
                        <h3>Nessuna storia disponibile</h3>
                        <p>Crea una storia dal backend per iniziare.</p>
                    </div>
                )}

                {!loading && !error && stories.length > 0 && (
                    <div className="stories-grid">
                        {stories.map(story => (
                            <article className="story-card" key={story.id}>
                                <div>
                                    <p className="story-id">Story #{story.id}</p>
                                    <h3>{story.title}</h3>
                                    <p>{story.description || "Nessuna descrizione disponibile."}</p>
                                </div>

                                <Link className="play-button" to={`/play/${story.id}`}>
                                    Gioca
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default HomePage;