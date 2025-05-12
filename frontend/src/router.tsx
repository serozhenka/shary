import { createBrowserRouter } from "react-router-dom";
import Landing from "./pages/Landing";
import RoomPage from "./pages/RoomPage";
import RoomsList from "./pages/RoomsList";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/rooms",
    element: <RoomsList />,
  },
  {
    path: "/rooms/:id",
    element: <RoomPage />,
  },
]);
