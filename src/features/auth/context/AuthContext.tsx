import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface UsuarioSesion {
  idUsuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
}

interface AuthContextType {
  usuario: UsuarioSesion | null;
  token: string | null;
  autenticado: boolean;
  iniciarSesion: (
    token: string,
    usuario: UsuarioSesion
  ) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("maizevision_token")
  );

  const [usuario, setUsuario] =
    useState<UsuarioSesion | null>(() => {
      try {
        const value = JSON.parse(localStorage.getItem("maizevision_usuario") ?? "null");
        return value && typeof value.idUsuario === "string" && typeof value.nombres === "string" &&
          ["ADMINISTRADOR", "SUPERVISOR", "EVALUADOR"].includes(value.rol) ? value : null;
      } catch { return null; }
    });


  const iniciarSesion = (
    nuevoToken: string,
    nuevoUsuario: UsuarioSesion
  ) => {
    localStorage.setItem(
      "maizevision_token",
      nuevoToken
    );

    localStorage.setItem(
      "maizevision_usuario",
      JSON.stringify(nuevoUsuario)
    );

    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("maizevision_token");
    localStorage.removeItem("maizevision_usuario");

    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        autenticado: !!token && !!usuario,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return context;
}