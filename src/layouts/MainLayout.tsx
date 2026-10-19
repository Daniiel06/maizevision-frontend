import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CloudSun,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Sprout,
  Users,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";

import {
  useAuth,
} from "../features/auth/context/AuthContext";

import "./MainLayout.css";


export default function MainLayout() {
  const {
    usuario,
    cerrarSesion,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    navegacionVisible,
    setNavegacionVisible,
  ] = useState(true);


  const handleLogout = () => {
    cerrarSesion();

    navigate("/login");
  };


  const inicial =
    usuario?.nombres
      ?.charAt(0)
      .toUpperCase() ?? "U";


  return (
    <div
      className={[
        "app-layout",
        navegacionVisible
          ? "nav-visible"
          : "nav-oculta",
      ].join(" ")}
    >

      {/* =====================================================
          NAVEGACIÓN FLOTANTE
      ===================================================== */}

      <div className="floating-navigation-wrapper">

        {/* BOTÓN MOSTRAR / OCULTAR */}

        <button
          type="button"
          className="floating-toggle"
          onClick={() =>
            setNavegacionVisible(
              actual => !actual
            )
          }
          aria-label={
            navegacionVisible
              ? "Ocultar navegación"
              : "Mostrar navegación"
          }
          title={
            navegacionVisible
              ? "Ocultar navegación"
              : "Mostrar navegación"
          }
        >
          {navegacionVisible ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>


        {/* BARRA */}

        <div
          className={[
            "floating-navigation",
            navegacionVisible
              ? "floating-navigation-open"
              : "floating-navigation-closed",
          ].join(" ")}
        >

          {/* MARCA */}

          <div className="floating-brand">

            <strong>
              MaizeVision
            </strong>

            <span>
              Diagnóstico inteligente
            </span>

          </div>


          {/* LINKS */}

          <nav className="floating-nav">


            {usuario?.rol === "EVALUADOR" ? (
              <NavItem to="/jornadas" icono={<CalendarDays size={20}/>} texto="Mis jornadas" />
            ) : (
              <NavItem to="/dashboard" icono={<LayoutDashboard size={20}/>} texto="Dashboard" />
            )}

            <NavItem
              to="/clima"
              icono={
                <CloudSun size={20} />
              }
              texto="Clima"
            />

            <NavItem
              to="/campanias"
              icono={
                <Sprout size={20} />
              }
              texto="Campañas"
            />

            <NavItem
              to="/fundos"
              icono={
                <MapPinned size={20} />
              }
              texto="Fundos"
            />

            <NavItem
              to="/indicadores"
              icono={
                <BarChart3 size={20} />
              }
              texto="Indicadores"
            />

            {usuario?.rol ===
              "ADMINISTRADOR" && (
              <NavItem
                to="/usuarios"
                icono={
                  <Users size={20} />
                }
                texto="Usuarios"
              />
            )}

          </nav>


          {/* USUARIO */}

          <div className="floating-user">

            <div className="floating-user-avatar">
              {inicial}
            </div>


            <div className="floating-user-info">

              <strong>
                {usuario?.nombres}
              </strong>

              <span>
                {usuario?.rol}
              </span>

            </div>


            <button
              type="button"
              className="floating-logout"
              onClick={
                handleLogout
              }
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={19} />
            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div className="main-area">

        <main className="content">

          <Outlet />

        </main>

      </div>

    </div>
  );
}


/* =========================================================
   ITEM DE NAVEGACIÓN
========================================================= */

function NavItem({
  to,
  icono,
  texto,
}: {
  to: string;
  icono: React.ReactNode;
  texto: string;
}) {
  return (
    <NavLink
      to={to}
      className={({
        isActive,
      }) =>
        `floating-nav-link ${
          isActive
            ? "active"
            : ""
        }`
      }
    >

      <span className="floating-nav-icon">
        {icono}
      </span>

      <span className="floating-nav-text">
        {texto}
      </span>

    </NavLink>
  );
}
