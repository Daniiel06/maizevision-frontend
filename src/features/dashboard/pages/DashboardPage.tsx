import { Activity, MapPinned, ScanSearch, Sprout } from "lucide-react";

import { useEffect, useState } from "react";

import { useAuth } from "../../auth/context/AuthContext";

import { obtenerResumenDashboard } from "../api/dashboardApi";

import type { DashboardResumen } from "../types/dashboard.types";

import "./DashboardPage.css";

export default function DashboardPage() {
  const { usuario } = useAuth();

  const [resumen, setResumen] = useState<DashboardResumen | null>(null);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const data = await obtenerResumenDashboard();

        setResumen(data);
      } catch {
        setError("No se pudo cargar el resumen del sistema.");
      } finally {
        setCargando(false);
      }
    };

    cargarResumen();
  }, []);

  if (cargando) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loader" />

        <span>Cargando panel...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-kicker">
            <i />
            Panel principal
          </span>

          <h1>Bienvenido, {usuario?.nombres}.</h1>

          <p>Resumen general del sistema MaizeVision.</p>
        </div>

        {/* DECORACIÓN VEGETAL */}

        <svg
          className="dashboard-hero-mark"
          viewBox="0 0 130 175"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M65 166V47"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <path
            d="M65 138C25 142 19 106 13 88c31 2 51 15 52 50ZM65 122c40 3 51-30 53-53-31 5-48 20-53 53Z"
            fill="currentColor"
            fillOpacity=".35"
            stroke="currentColor"
            strokeWidth="2"
          />

          <path
            d="M65 84c-22-4-29-20-29-42 17 4 27 18 29 42Zm0-14c19-2 29-17 29-35-18 5-27 18-29 35Z"
            fill="currentColor"
            fillOpacity=".5"
            stroke="currentColor"
            strokeWidth="2"
          />

          <path
            d="M65 51c-11-15-11-28 0-42 11 14 11 27 0 42Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </section>

      {/* =====================================================
          TITULO SECCIÓN
      ===================================================== */}

      <section className="dashboard-section-heading">
        <div>
          <h2>Vista general</h2>

          <p>Estado actual de los registros del sistema.</p>
        </div>

        <span className="dashboard-section-tag">Resumen del sistema</span>
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && <div className="dashboard-error">{error}</div>}

      {/* =====================================================
          MÉTRICAS
      ===================================================== */}

      <section className="dashboard-grid">
        <DashboardMetric
          titulo="Campañas activas"
          valor={resumen?.campaniasActivas ?? 0}
          icono={<Sprout />}
          clase="metric-campanias"
        />

        <DashboardMetric
          titulo="Lotes registrados"
          valor={resumen?.lotesRegistrados ?? 0}
          icono={<MapPinned />}
          clase="metric-lotes"
        />

        <DashboardMetric
          titulo="Plantas registradas"
          valor={resumen?.plantasRegistradas ?? 0}
          icono={<Activity />}
          clase="metric-plantas"
        />

        <DashboardMetric
          titulo="Diagnósticos realizados"
          valor={resumen?.diagnosticosRealizados ?? 0}
          icono={<ScanSearch />}
          clase="metric-diagnosticos"
        />
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="dashboard-footer">
        MaizeVision · Diagnóstico inteligente de plagas foliares
      </footer>
    </div>
  );
}

/* =========================================================
   MÉTRICA
========================================================= */

function DashboardMetric({
  titulo,
  valor,
  icono,
  clase,
}: {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
  clase: string;
}) {
  return (
    <article className={`dashboard-metric ${clase}`}>
      <div className="dashboard-metric-icon">{icono}</div>

      <span className="dashboard-metric-corner">
        <i />
      </span>

      <p className="dashboard-metric-label">{titulo}</p>

      <p className="dashboard-metric-value">{formatearNumero(valor)}</p>
    </article>
  );
}

/* =========================================================
   FORMATO
========================================================= */

function formatearNumero(valor: number) {
  return Number(valor ?? 0).toLocaleString("es-PE", {
    maximumFractionDigits: 0,
  });
}
