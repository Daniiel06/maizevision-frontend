import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { InicioAtencion } from "./tiempoAtencion";

export default function CronometroAtencion({ inicio, terminadoMs }: { inicio: InicioAtencion; terminadoMs?: number }) {
  const [ahora, setAhora] = useState(() => performance.timeOrigin + performance.now());
  useEffect(() => {
    if (terminadoMs !== undefined) return;
    const timer = window.setInterval(() => setAhora(performance.timeOrigin + performance.now()), 500);
    return () => window.clearInterval(timer);
  }, [terminadoMs]);
  const segundos = Math.floor((terminadoMs ?? Math.max(0, ahora - inicio.inicioMonotono)) / 1000);
  const reloj = Math.floor(segundos / 60).toString().padStart(2, "0") + ":" + (segundos % 60).toString().padStart(2, "0");
  return <div className="atencion-cronometro"><Clock size={20} /><div><strong>{terminadoMs === undefined ? "Tiempo del diagnóstico en curso" : "Tiempo real del diagnóstico"}</strong>
    <span>{terminadoMs === undefined ? "Incluye la foto y la espera hasta ver el resultado." : "Conteo finalizado al mostrar el resultado."}</span></div>
    <output aria-label="Duración del diagnóstico">{reloj}</output></div>;
}
