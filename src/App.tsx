import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./features/auth/pages/LoginPage";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import { AuthProvider } from "./features/auth/context/AuthContext";

import DashboardPage from "./features/dashboard/pages/DashboardPage";
import CampaniasPage from "./features/campanias/pages/CampaniasPage";
import FundosPage from "./features/fundos/pages/FundosPage";
import ClimaPage from "./features/clima/pages/ClimaPage";
import UsuariosPage from "./features/usuarios/pages/UsuariosPage";
import MapaLotePage from "./features/mapa/pages/MapaLotePage";
import InspeccionPage from "./features/inspecciones/pages/InspeccionPage";
import IndicadoresPage from "./features/indicadores/pages/IndicadoresPage";

import GruposPage from "./features/grupos/GruposPage";

import JornadasPage from "./features/jornadas/JornadasPage";

import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Login público */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/clima" element={<ClimaPage />} />

              <Route path="/campanias" element={<CampaniasPage />} />

              <Route path="/fundos" element={<FundosPage />} />

              <Route path="/usuarios" element={<UsuariosPage />} />

              <Route path="/indicadores" element={<IndicadoresPage />} />

              {/* El mapa sigue existiendo,
                  pero ya no aparece directamente
                  en la barra lateral. */}

              <Route path="/grupos" element={<GruposPage key="grupos-general" />} />
              <Route path="/lotes/:idLote/grupos" element={<GruposPage key="grupos-lote" />} />
              <Route path="/grupos/:idGrupo" element={<GruposPage key="grupo-detalle" />} />
              <Route path="/lotes/:idLote/jornadas" element={<JornadasPage key="lista-jornadas" />} />
              <Route path="/jornadas/:idJornada" element={<JornadasPage key="detalle-jornada" />} />
              <Route path="/mapa/:idLote" element={<MapaLotePage />} />

              <Route
                path="/inspecciones/:idInspeccion"
                element={<InspeccionPage />}
              />
            </Route>
          </Route>

          {/* Ruta inicial */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Rutas desconocidas */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
