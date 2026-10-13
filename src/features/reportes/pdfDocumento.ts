// PDF A4 con fuentes estándar, tablas paginadas e imágenes JPEG.
// No requiere servicios externos: los textos se codifican como datos, nunca como instrucciones PDF.
const MM = 72 / 25.4;
const asciiWidths = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const encoder = new TextEncoder();
function numero(n: number) { if (!Number.isFinite(n))
    throw new Error("Coordenada PDF inválida."); return n.toFixed(3); }
function normalizar(s: string) { return s.replace(/[–—−]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...").replace(/ /g, " "); }
function hex(s: string) { return "<" + Array.from(normalizar(s)).map(c => { const n = c.charCodeAt(0); return (n >= 32 && n <= 255 ? n : 63).toString(16).padStart(2, "0"); }).join("") + ">"; }
function ancho(s: string, size: number, bold = false) { let unidades = 0; for (const c of normalizar(s).normalize("NFD").replace(/[̀-ͯ]/g, "")) {
    unidades += asciiWidths[c.charCodeAt(0) - 32] ?? 556;
} return unidades / 1000 * size / MM * (bold ? 1.08 : 1); }
function envolver(s: string, width: number, size: number, bold = false) {
    const lineas: string[] = [];
    for (const parrafo of String(s).split(/\r?\n/)) {
        let linea = "";
        for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
            if (ancho(palabra, width ? size : 8, bold) > width) {
                if (linea) {
                    lineas.push(linea);
                    linea = "";
                }
                let fragmento = "";
                for (const letra of palabra) {
                    if (fragmento && ancho(fragmento + letra, size, bold) > width) {
                        lineas.push(fragmento);
                        fragmento = "";
                    }
                    fragmento += letra;
                }
                linea = fragmento;
            }
            else if (linea && ancho(linea + " " + palabra, size, bold) > width) {
                lineas.push(linea);
                linea = palabra;
            }
            else
                linea = linea ? linea + " " + palabra : palabra;
        }
        lineas.push(linea);
    }
    return lineas.length ? lineas : [""];
}
function unir(partes: Uint8Array[]) { const salida = new Uint8Array(partes.reduce((n, p) => n + p.length, 0)); let offset = 0; for (const parte of partes) {
    salida.set(parte, offset);
    offset += parte.length;
} return salida; }
interface Imagen {
    bytes: Uint8Array;
    ancho: number;
    alto: number;
}
export class PdfDocumento {
    private paginas: string[][] = [[]];
    private actual = 0;
    private imagenes: Imagen[] = [];
    readonly anchoPagina = 210;
    readonly altoPagina = 297;
    getNumeroPaginas() { return this.paginas.length; }
    setPagina(p: number) { if (p < 1 || p > this.paginas.length)
        throw new Error("Página PDF inválida."); this.actual = p - 1; }
    nuevaPagina() { this.paginas.push([]); this.actual = this.paginas.length - 1; }
    private comando(valor: string) { this.paginas[this.actual].push(valor); }
    texto(text: string, x: number, y: number, size = 9, bold = false, color: [
        number,
        number,
        number
    ] = [35, 50, 40], alinear: "left" | "right" = "left") {
        if (alinear === "right")
            x -= ancho(text, size, bold);
        this.comando(color.map(c => numero(c / 255)).join(" ") + " rg BT /" + (bold ? "F2" : "F1") + " " + numero(size) + " Tf 1 0 0 1 " + numero(x * MM) + " " + numero((297 - y) * MM) + " Tm " + hex(text) + " Tj ET");
    }
    rect(x: number, y: number, w: number, h: number, color: [
        number,
        number,
        number
    ]) { this.comando(color.map(c => numero(c / 255)).join(" ") + " rg " + [x * MM, (297 - y - h) * MM, w * MM, h * MM].map(numero).join(" ") + " re f"); }
    linea(x1: number, y1: number, x2: number, y2: number) { this.comando("0.82 0.87 0.84 RG 0.4 w " + [x1 * MM, (297 - y1) * MM].map(numero).join(" ") + " m " + [x2 * MM, (297 - y2) * MM].map(numero).join(" ") + " l S"); }
    jpeg(datos: string, anchoPx: number, altoPx: number, x: number, y: number, w: number, h: number) {
        const raw = atob(datos.split(",")[1]);
        const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
        this.imagenes.push({ bytes, ancho: anchoPx, alto: altoPx });
        this.comando("q " + [w * MM, 0, 0, h * MM, x * MM, (297 - y - h) * MM].map(numero).join(" ") + " cm /I" + this.imagenes.length + " Do Q");
    }
    bytes() {
        const objetos: Uint8Array[] = [];
        const reservar = () => { objetos.push(new Uint8Array()); return objetos.length; };
        const poner = (id: number, s: string | Uint8Array) => { objetos[id - 1] = typeof s === "string" ? encoder.encode(s) : s; };
        const catalogo = reservar(), paginas = reservar(), normal = reservar(), negrita = reservar();
        poner(normal, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
        poner(negrita, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
        const idsImagen = this.imagenes.map(im => { const id = reservar(); poner(id, unir([encoder.encode("<< /Type /XObject /Subtype /Image /Width " + im.ancho + " /Height " + im.alto + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + im.bytes.length + " >>\nstream\n"), im.bytes, encoder.encode("\nendstream")])); return id; });
        const idsPaginas = this.paginas.map(comandos => {
            const contenido = reservar(), pagina = reservar();
            const stream = encoder.encode(comandos.join("\n"));
            poner(contenido, unir([encoder.encode("<< /Length " + stream.length + " >>\nstream\n"), stream, encoder.encode("\nendstream")]));
            poner(pagina, "<< /Type /Page /Parent " + paginas + " 0 R /MediaBox [0 0 " + numero(210 * MM) + " " + numero(297 * MM) + "] /Resources << /Font << /F1 " + normal + " 0 R /F2 " + negrita + " 0 R >> /XObject << " + idsImagen.map((id, i) => "/I" + (i + 1) + " " + id + " 0 R").join(" ") + " >> >> /Contents " + contenido + " 0 R >>");
            return pagina;
        });
        poner(paginas, "<< /Type /Pages /Count " + idsPaginas.length + " /Kids [" + idsPaginas.map(id => id + " 0 R").join(" ") + "] >>");
        poner(catalogo, "<< /Type /Catalog /Pages " + paginas + " 0 R >>");
        const partes = [encoder.encode("%PDF-1.4\n")];
        const offsets = [0];
        let offset = partes[0].length;
        objetos.forEach((obj, i) => { offsets.push(offset); const bloque = unir([encoder.encode((i + 1) + " 0 obj\n"), obj, encoder.encode("\nendobj\n")]); partes.push(bloque); offset += bloque.length; });
        partes.push(encoder.encode("xref\n0 " + offsets.length + "\n0000000000 65535 f \n" + offsets.slice(1).map(n => n.toString().padStart(10, "0") + " 00000 n ").join("\n") + "\ntrailer\n<< /Size " + offsets.length + " /Root " + catalogo + " 0 R >>\nstartxref\n" + offset + "\n%%EOF\n"));
        return unir(partes);
    }
    save(nombre: string) { const bytes = this.bytes(); const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
}
export function crearDocumentoPdf(titulo: string, id: string, generado: string, provisional: boolean) {
    const doc = new PdfDocumento();
    let y = 43;
    function cabecera() { doc.rect(0, 0, 210, 8, [30, 83, 58]); doc.texto("MAIZEVISION", 15, 18, 11, true, [30, 83, 58]); doc.texto(titulo, 15, 28, 16, true); doc.texto("ID: " + id, 15, 35, 8, false, [90, 100, 94]); doc.texto(provisional ? "DATOS PROVISIONALES" : "DATOS COMPLETOS AL GENERAR", 195, 18, 7, false, [90, 100, 94], "right"); }
    function nuevaPagina() { doc.nuevaPagina(); y = 43; cabecera(); }
    cabecera();
    function tabla(head: string[], body: (string | number)[][], anchos?: number[]) {
        const columnas = head.length || body[0]?.length || 1;
        const widths = anchos ?? Array.from({ length: columnas }, () => 180 / columnas);
        const size = 8, padding = 3, altoLinea = 4;
        function fila(lineas: string[][], inicio: number, cantidad: number, esHead: boolean, indice: number) {
            const h = Math.max(1, cantidad) * altoLinea + padding * 2;
            let x = 15;
            for (let c = 0; c < columnas; c++) {
                doc.rect(x, y, widths[c], h, esHead ? [30, 83, 58] : indice % 2 === 0 ? [246, 249, 246] : [255, 255, 255]);
                for (let l = 0; l < cantidad; l++) {
                    const t = lineas[c]?.[inicio + l];
                    if (t != null)
                        doc.texto(t, x + padding, y + padding + 3 + l * altoLinea, size, esHead, esHead ? [255, 255, 255] : [35, 50, 40]);
                }
                doc.linea(x, y + h, x + widths[c], y + h);
                x += widths[c];
            }
            y += h;
        }
        const headers = head.map((t, i) => envolver(t, widths[i] - padding * 2, size, true));
        const hLineas = Math.max(1, ...headers.map(t => t.length));
        const dibujarHeader = () => { if (head.length)
            fila(headers, 0, hLineas, true, 0); };
        if (y + (head.length ? hLineas * altoLinea + padding * 2 : 0) + 14 > 270)
            nuevaPagina();
        dibujarHeader();
        body.forEach((row, indice) => {
            const lineas = row.map((t, i) => envolver(String(t), widths[i] - padding * 2, size));
            const maxLineas = Math.max(1, ...lineas.map(t => t.length));
            let inicio = 0;
            // Filas normales se mantienen juntas. Observaciones muy extensas continúan sin cortar texto.
            if (maxLineas * altoLinea + padding * 2 <= 210 && y + maxLineas * altoLinea + padding * 2 > 270) {
                nuevaPagina();
                dibujarHeader();
            }
            while (inicio < maxLineas) {
                let disponibles = Math.floor((270 - y - padding * 2) / altoLinea);
                if (disponibles < 1) {
                    nuevaPagina();
                    dibujarHeader();
                    disponibles = Math.floor((270 - y - padding * 2) / altoLinea);
                }
                const cantidad = Math.min(disponibles, maxLineas - inicio);
                fila(lineas, inicio, cantidad, false, indice);
                inicio += cantidad;
                if (inicio < maxLineas) {
                    nuevaPagina();
                    dibujarHeader();
                }
            }
        });
        y += 8;
    }
    function seccion(t: string) { if (y > 225)
        nuevaPagina(); doc.texto(t, 15, y, 10, true, [30, 83, 58]); y += 6; }
    function imagen(foto: {
        datos: string;
        ancho: number;
        alto: number;
    } | null) { if (y + 87 > 270)
        nuevaPagina(); seccion("Fotografía del diagnóstico"); if (foto) {
        const escala = Math.min(180 / foto.ancho, 70 / foto.alto), w = foto.ancho * escala, h = foto.alto * escala;
        doc.jpeg(foto.datos, foto.ancho, foto.alto, 15 + (180 - w) / 2, y, w, h);
        y += h + 8;
    }
    else
        tabla([], [["Fotografía no disponible al generar este reporte."]]); }
    function finalizar() { if (y + 26 > 270) nuevaPagina(); doc.texto("Constancia de revisión",15,y,10,true,[30,83,58]); y += 6; tabla([], [["Responsable: _________________________", "Especialista: _________________________"]]); const total = doc.getNumeroPaginas(); for (let p = 1; p <= total; p++) {
        doc.setPagina(p);
        doc.linea(15, 278, 195, 278);
        doc.texto("Generado: " + new Date(generado).toLocaleString("es-PE", { timeZone: "America/Lima" }) + " (Perú)", 15, 283, 7, false, [95, 105, 99]);
        doc.texto("Página " + p + " de " + total, 195, 283, 7, false, [95, 105, 99], "right");
        doc.texto("Copia de los datos al generar. Una revisión posterior puede modificar los resultados.", 15, 288, 7, false, [95, 105, 99]);
    } return doc; }
    return { doc, tabla, seccion, imagen, finalizar };
}
