import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Landing from "./pages/Landing";
import RoomPage from "./pages/RoomPage";
import RoomsList from "./pages/RoomsList";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/rooms",
    element: (
      <ProtectedRoute>
        <RoomsList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/rooms/:id",
    element: (
      <ProtectedRoute>
        <RoomPage />
      </ProtectedRoute>
    ),
  },
]);
