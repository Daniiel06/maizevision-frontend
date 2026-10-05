import { useState } from "react";

import {
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sprout,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { login } from "../api/authApi";

import { useAuth } from "../context/AuthContext";

import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const { iniciarSesion } = useAuth();

  const [correo, setCorreo] = useState("");

  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [error, setError] = useState("");

  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setCargando(true);

    try {
      const response = await login({
        correo,
        password,
      });

      iniciarSesion(response.token, {
        idUsuario: response.idUsuario,

        nombres: response.nombres,

        apellidos: response.apellidos,

        correo: response.correo,

        rol: response.rol,
      });

      navigate("/dashboard");
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-decoration login-decoration-one" />

      <div className="login-decoration login-decoration-two" />

      <div className="login-shell">
        {/* ===============================================
            MARCA SUPERIOR
        =============================================== */}

        <div className="login-brand">
          <strong>MaizeVision</strong>

          <span>Diagnóstico inteligente de plagas foliares</span>
        </div>

        {/* ===============================================
            PANEL
        =============================================== */}

        <section className="login-panel">
          {/* =============================================
              COLUMNA IZQUIERDA
          ============================================= */}

          <div className="login-presentation">
            <div>
              <span className="login-eyebrow">
                <Sprout size={15} />
                Agricultura inteligente
              </span>

              <h1>
                Diagnóstico más
                <span> preciso para tus cultivos.</span>
              </h1>

              <p>
                MaizeVision utiliza inteligencia artificial para apoyar el
                reconocimiento de problemas foliares en cultivos de maíz.
              </p>
            </div>

            <div className="login-illustration">
              <div className="login-illustration-ring ring-one" />

              <div className="login-illustration-ring ring-two" />

              <div className="login-leaf-card">
                <Leaf size={72} />
              </div>
            </div>

            <div className="login-benefits">
              <div className="login-benefit">
                <div>
                  <ShieldCheck size={18} />
                </div>

                <span>Apoyo al diagnóstico fitosanitario</span>
              </div>

              <div className="login-benefit">
                <div>
                  <Sprout size={18} />
                </div>

                <span>Monitoreo organizado por cultivo</span>
              </div>
            </div>
          </div>

          {/* =============================================
              FORMULARIO
          ============================================= */}

          <div className="login-form-area">
            <div className="login-form-header">
              <span>BIENVENIDO</span>

              <h2>Iniciar sesión</h2>

              <p>Ingresa tus credenciales para acceder a MaizeVision.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {/* CORREO */}

              <div className="login-field">
                <label htmlFor="correo">Correo electrónico</label>

                <div className="login-input-wrapper">
                  <Mail size={19} className="login-input-icon" />

                  <input
                    id="correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    autoComplete="email"
                    placeholder="nombre@correo.com"
                    disabled={cargando}
                    required
                  />
                </div>
              </div>

              {/* CONTRASEÑA */}

              <div className="login-field">
                <label htmlFor="password">Contraseña</label>

                <div className="login-input-wrapper">
                  <LockKeyhole size={19} className="login-input-icon" />

                  <input
                    id="password"
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    disabled={cargando}
                    required
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setMostrarPassword((actual) => !actual)}
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* ERROR */}

              {error && <div className="login-error">{error}</div>}

              {/* BOTÓN */}

              <button
                className="login-submit"
                type="submit"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span className="login-spinner" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar al sistema"
                )}
              </button>
            </form>

            <div className="login-footer">
              <span>MaizeVision</span>

              <i />

              <span>Moche · 2026</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
