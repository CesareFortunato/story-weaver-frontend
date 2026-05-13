import { createBrowserRouter } from "react-router-dom";

// Import delle pagine principali dell'applicazione.
import HomePage from "../pages/HomePage";
import PlayPage from "../pages/PlayPage";

// Configurazione del router React.
// createBrowserRouter gestisce il routing lato frontend.
const router = createBrowserRouter([

  // =====================================================
  // HOMEPAGE
  // =====================================================

  {
    // Pagina iniziale dell'app.
    path: "/",

    // Componente renderizzato sulla route "/".
    element: <HomePage />,
  },


  // =====================================================
  // PLAY STORY
  // =====================================================

  {
    // Route per avviare una storia partendo dal nodo iniziale.
    // :storyId è un parametro dinamico.
    path: "/play/:storyId",

    // Viene caricata la pagina di gioco.
    element: <PlayPage />,
  },


  // =====================================================
  // PLAY SPECIFIC NODE
  // =====================================================

  {
    // Route speciale usata dal backend/admin panel
    // per avviare direttamente un nodo specifico.
    // Utile per testing e debug narrativo.
    path: "/play-node/:nodeId",

    // Usa sempre lo stesso componente di gioco.
    element: <PlayPage />,
  },
]);

// Esporta il router per essere usato nell'app React.
export default router;