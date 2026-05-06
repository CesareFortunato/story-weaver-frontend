import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/HomePage";
import PlayPage from "../pages/PlayPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/play/:storyId",
    element: <PlayPage />,
  },
]);

export default router;