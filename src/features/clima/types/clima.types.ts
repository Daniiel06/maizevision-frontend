export interface ClimaActual {
  fechaHora: string | null;
  temperaturaC: number | null;
  sensacionTermicaC: number | null;
  humedadRelativa: number | null;
  precipitacionMm: number | null;
  velocidadVientoKmh: number | null;
  codigoClima: number | null;
  descripcionClima: string;
}

export interface PronosticoDia {
  fecha: string;
  temperaturaMaxC: number | null;
  temperaturaMinC: number | null;
  humedadPromedio: number | null;
  probabilidadPrecipitacion: number | null;
  precipitacionMm: number | null;
  vientoMaxKmh: number | null;
  codigoClima: number | null;
  descripcionClima: string;
}

export interface ClimaFundo {
  idFundo: string;
  fundo: string;
  ubicacion: string | null;
  latitud: number;
  longitud: number;
  fuente: string;
  zonaHoraria: string | null;
  actual: ClimaActual;
  pronostico: PronosticoDia[];
}