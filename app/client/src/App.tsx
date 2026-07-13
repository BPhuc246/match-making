import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./page/AuthPage";
import MainLayout from "./layout/MainLayout";
import LobbyPage from "./page/LobbyPage";
import RoomPage from "./page/RoomPage";

const App = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <MainLayout>
            <LobbyPage />
          </MainLayout>
        }
      />
      <Route
        path="/room/:roomId"
        element={
          <MainLayout>
            <RoomPage />
          </MainLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
