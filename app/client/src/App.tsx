import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./page/AuthPage";
import MainLayout from "./layout/MainLayout";
import LobbyPage from "./page/LobbyPage";
import MatchPage from "./page/MatchPage";

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
        path="/room/:matchId"
        element={
          <MainLayout>
            <MatchPage />
          </MainLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
