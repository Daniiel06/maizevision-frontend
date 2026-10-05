export interface Fundo {
  idFundo: string;
  nombre: string;
  descripcion: string | null;
  ubicacionReferencia: string | null;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
  fechaRegistro: string;
  fechaModificacion: string | null;
}

export interface GuardarFundoRequest {
  nombre: string;
  descripcion: string | null;
  ubicacionReferencia: string | null;
  latitud: number | null;
  longitud: number | null;
}

export interface ResultadoUbicacion {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  pais: string;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  textoCompleto: string;
}