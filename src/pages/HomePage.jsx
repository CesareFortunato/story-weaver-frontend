import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStories } from "../api/storyApi";

function HomePage() {
    // Stato che contiene la lista delle storie recuperate dal backend.
    const [stories, setStories] = useState([]);

    // Stato per gestire il caricamento iniziale.
    const [loading, setLoading] = useState(true);

    // Stato per gestire eventuali errori nella chiamata API.
    const [error, setError] = useState(null);

    // Al primo render della pagina recupera le storie dal backend.
    useEffect(() => {
        getStories()
            .then(data => {
                // Salva le storie ricevute nello stato.
                setStories(data);

                // Pulisce eventuali errori precedenti.
                setError(null);
            })
            .catch(error => {
                // Salva l'errore per mostrarlo nell'interfaccia.
                setError(error);
            })
            .finally(() => {
                // In ogni caso termina lo stato di caricamento.
                setLoading(false);
            });
    }, []);

    return (
        <main className="home-page">

            {/* Sezione introduttiva della homepage */}
            <section className="hero">
                <p className="eyebrow">Interactive dark stories</p>

                <h1>StoryWeaver</h1>

                <p className="hero-text">
                    Scegli una storia, esplora i nodi, raccogli token e scopri dove ti porta il racconto.
                </p>
            </section>

            {/* Sezione elenco storie */}
            <section className="stories-section">
                <div className="section-header">
                    <h2>Storie disponibili</h2>

                    {/* Mostra il numero di storie recuperate */}
                    <p>{stories.length} storie trovate</p>
                </div>

                {/* Stato di caricamento */}
                {loading && (
                    <div className="state-card">
                        <div className="loader"></div>
                        <p>Caricamento storie...</p>
                    </div>
                )}

                {/* Stato di errore */}
                {!loading && error && (
                    <div className="state-card error-card">
                        <h3>Qualcosa non va</h3>
                        <p>{error.message}</p>
                    </div>
                )}

                {/* Stato vuoto se non ci sono storie */}
                {!loading && !error && stories.length === 0 && (
                    <div className="state-card">
                        <h3>Nessuna storia disponibile</h3>
                        <p>Crea una storia dal backend per iniziare.</p>
                    </div>
                )}

                {/* Lista delle storie disponibili */}
                {!loading && !error && stories.length > 0 && (
                    <div className="stories-grid">
                        {stories.map(story => (
                            <article className="story-card" key={story.id}>
                                <div>
                                    <p className="story-id">Story #{story.id}</p>

                                    <h3>{story.title}</h3>

                                    <p>{story.description || "Nessuna descrizione disponibile."}</p>
                                </div>

                                {/* Link per iniziare la storia selezionata */}
                                <Link
                                    className="play-button"
                                    to={`/play/${story.id}`}
                                    onClick={() => {
                                        // Quando si avvia una nuova storia,
                                        // pulisce eventuali dati salvati da una partita precedente.
                                        localStorage.removeItem("storyweaver_inventory");
                                        localStorage.removeItem("storyweaver_current_node_id");
                                    }}
                                >
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