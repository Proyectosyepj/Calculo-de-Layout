/**
 * ============================================================================
 * ALPHA BLOCK - SISTEMA DE INGENIERÍA DE DISTRIBUCIÓN DE PLANTA
 * Métodos: ELDEP (Guerchet + Flujo Carga-Distancia) y CORELAP (REL + TCR + PR)
 * ============================================================================
 */
'use strict';

/* ============================================================================
   0. CONFIGURACIÓN Y UTILIDADES
   ============================================================================ */
// Los 3 GIF de la ingeniera (carpeta assets/images/)
const IMAGENES = {
  explicando: 'assets/images/ingeniero_pixel_explicando.gif',   // inicio del tutorial y cada explicación
  calculando: 'assets/images/ingeniero_pixel_calculando.gif',   // mientras se hacen los cálculos
  imprimiendo: 'assets/images/ingeniero_pixel_imprimiendo.gif'  // mientras se imprime el diseño (PDF / PNG)
};
// Duración de las transiciones de sonido (milisegundos)
const FUNDIDO_SALIDA = 700;
const FUNDIDO_ENTRADA = 1400;

const $ = (id) => document.getElementById(id);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = (n) => Number(Number(n).toFixed(2));
const CODIGOS = ['A', 'E', 'I', 'O', 'U', 'X'];
const COLORES_REL = { A: '#ef4444', E: '#f97316', I: '#eab308', O: '#22c55e', U: '#94a3b8', X: '#a855f7' };
const NOMBRES_REL = { A: 'Absolutamente necesario', E: 'Especialmente importante', I: 'Importante', O: 'Cercanía ordinaria', U: 'Sin importancia', X: 'No deseable' };
const NOMBRES_CORTOS = { A: 'A · Indispensable', E: 'E · Muy importante', I: 'I · Importante', O: 'O · Normal', U: 'U · No importa', X: 'X · Evitar' };
const NOMBRES_UBICACION = { norte: 'pared norte', sur: 'pared sur', oeste: 'pared oeste', este: 'pared este', centro: 'centro' };

const memoria = {
  leer(clave) { try { return JSON.parse(localStorage.getItem(clave)); } catch (_) { return null; } },
  guardar(clave, v) { try { localStorage.setItem(clave, JSON.stringify(v)); } catch (_) {} },
  borrar(clave) { try { localStorage.removeItem(clave); } catch (_) {} }
};

let temporizadorAviso = null;
function avisar(mensaje, esError = false) {
  const caja = $('aviso');
  caja.textContent = mensaje;
  caja.classList.remove('oculto');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => caja.classList.add('oculto'), 4200);
  if (esError) audio.efecto('error');
}

/* ============================================================================
   1. GESTOR DE AUDIO CON TRANSICIONES SUAVES
   - Cada apartado tiene una pista. Al cambiar, la anterior se desvanece y
     DESPUÉS entra la nueva (no se enciman). Al volver, empieza desde cero.
   - Pantallas que comparten pista (tutorial, menú y opciones) no la reinician.
   - Los efectos no detienen la música; solo la atenúan suavemente.
   ============================================================================ */
class GestorAudio {
  constructor() {
    const base = 'assets/audio/';
    this.archivos = {
      introduccion: 'introduccion.mp3', boton: 'sonido_boton.mp3',
      tutorial: 'sonido_tutorial.mp3', menu: 'menu.mp3',
      ambiente_eldep: 'ambiente_eldep.mp3', ambiente_corelap: 'ambiente_corelap.mp3',
      confirmacion: 'sonido_confirmacion.mp3', error: 'sonido_error.mp3', completado: 'sonido_completado.mp3'
    };
    this.pistas = {};
    this.fundidos = {};
    Object.entries(this.archivos).forEach(([clave, archivo]) => {
      const a = new Audio(base + archivo);
      a.preload = 'auto';
      a.loop = clave === 'menu' || clave.startsWith('ambiente_');   // el sonido del tutorial suena una sola vez
      this.pistas[clave] = a;
    });
    this.prefs = Object.assign({ general: true, ambiente: true, efectos: true, volumen: 0.65 }, memoria.leer('alphablock_audio_prefs'));
    this.ambiente = null;     // pista del apartado actual
    this.efectoActual = null;
    this.atenuado = false;
    this.espera = null;       // entrada pendiente de la siguiente pista

    ['confirmacion', 'error', 'completado'].forEach((clave) => {
      this.pistas[clave].addEventListener('ended', () => this.terminarEfecto(clave));
    });
    // Al terminar el sonido del tutorial, se detiene y pasa a sonar el del menú
    this.pistas.tutorial.addEventListener('ended', () => { if (this.ambiente === 'tutorial') this.cambiarApartado('menu'); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(this.espera);
        Object.keys(this.pistas).forEach((c) => (this.pistas[c].loop || c === 'tutorial' ? this.pausar(c) : this.detener(c)));
        this.efectoActual = null;
        this.atenuado = false;
      } else this.entrar();
    });
  }

  volumenAmbiente() { return Math.min(1, this.prefs.volumen * (this.ambiente === 'tutorial' ? 0.8 : 0.45) * (this.atenuado ? 0.35 : 1)); }
  ajustar(a, v) { a.volume = Math.min(1, Math.max(0, v)); }

  /** Lleva el volumen de una pista hasta "destino" de forma gradual. */
  fundir(clave, destino, ms, alTerminar) {
    const a = this.pistas[clave];
    clearInterval(this.fundidos[clave]);
    const inicio = a.volume, t0 = performance.now();
    this.fundidos[clave] = setInterval(() => {
      const t = Math.min(1, (performance.now() - t0) / ms);
      this.ajustar(a, inicio + (destino - inicio) * t);
      if (t === 1) { clearInterval(this.fundidos[clave]); if (alTerminar) alTerminar(); }
    }, 30);
  }

  pausar(clave) { clearInterval(this.fundidos[clave]); this.pistas[clave].pause(); }

  detener(clave) {
    this.pausar(clave);
    try { this.pistas[clave].currentTime = 0; } catch (_) {}
  }

  desvanecer(clave, ms = FUNDIDO_SALIDA) {
    if (!this.pistas[clave].paused) this.fundir(clave, 0, ms, () => this.detener(clave));
  }

  reproducir(clave, alFallar) {
    const p = this.pistas[clave].play();
    if (p) p.catch(() => { if (alFallar) alFallar(); });
  }

  /** Inicia (o recupera) con entrada gradual la pista del apartado actual. */
  entrar() {
    const clave = this.ambiente;
    if (!clave || document.hidden || !this.prefs.general || !this.prefs.ambiente) return;
    const a = this.pistas[clave];
    if (a.paused) { this.ajustar(a, 0); this.reproducir(clave); }
    this.fundir(clave, this.volumenAmbiente(), FUNDIDO_ENTRADA);
  }

  cambiarApartado(claveAmbiente) {
    if (claveAmbiente === this.ambiente) return;   // misma pista: continúa sin cortes
    clearTimeout(this.espera);
    this.ambiente = claveAmbiente;
    $('nombre-pista').textContent = claveAmbiente ? this.archivos[claveAmbiente] : 'Ninguna';
    const salientes = Object.keys(this.pistas).filter((c) => (c === 'introduccion' || c === 'tutorial' || this.pistas[c].loop) && !this.pistas[c].paused);
    salientes.forEach((c) => this.desvanecer(c));
    this.espera = setTimeout(() => {
      this.detener(claveAmbiente);                  // siempre desde el segundo 0
      this.entrar();
    }, salientes.length ? FUNDIDO_SALIDA + 60 : 0);
  }

  efecto(clave) {
    if (!this.prefs.general || !this.prefs.efectos) return;
    const a = this.pistas[clave];
    if (clave === 'boton') {                        // el clic nunca se corta a sí mismo
      if (!a.paused || this.efectoActual) return;
      this.ajustar(a, this.prefs.volumen * 0.6);
      this.reproducir(clave);
      return;
    }
    this.desvanecer('boton', 120);
    if (this.efectoActual && this.efectoActual !== clave) this.desvanecer(this.efectoActual, 180);
    this.detener(clave);
    this.efectoActual = clave;
    this.atenuar(true);
    this.ajustar(a, this.prefs.volumen * 0.8);
    this.reproducir(clave, () => this.terminarEfecto(clave));
  }

  atenuar(si) {
    this.atenuado = si;
    if (this.ambiente && !this.pistas[this.ambiente].paused) this.fundir(this.ambiente, this.volumenAmbiente(), si ? 250 : 900);
  }

  terminarEfecto(clave) {
    if (this.efectoActual !== clave) return;
    this.efectoActual = null;
    this.atenuar(false);
  }

  introduccion() {
    this.ambiente = null;
    if (!this.prefs.general) return;
    const a = this.pistas.introduccion;
    this.detener('introduccion');
    this.ajustar(a, this.prefs.volumen);
    this.reproducir('introduccion');
  }

  aplicarPreferencias() {
    memoria.guardar('alphablock_audio_prefs', this.prefs);
    if (!this.prefs.general) { Object.keys(this.pistas).forEach((c) => this.desvanecer(c, 300)); this.efectoActual = null; this.atenuado = false; return; }
    if (!this.prefs.efectos) { ['boton', 'confirmacion', 'error', 'completado'].forEach((c) => this.desvanecer(c, 200)); this.efectoActual = null; this.atenuado = false; }
    if (!this.ambiente) return;
    if (!this.prefs.ambiente) this.desvanecer(this.ambiente, 400);
    else if (this.pistas[this.ambiente].paused) this.entrar();
    else { clearInterval(this.fundidos[this.ambiente]); this.ajustar(this.pistas[this.ambiente], this.volumenAmbiente()); }
  }
}
let audio = null;

/* ============================================================================
   2. ESTADO DEL PROYECTO
   ============================================================================ */
const Estado = {
  general: { nombre: 'Proyecto Sin Nombre', descripcion: '', unidad: 'm', largoPlanta: 30, anchoPlanta: 20, coeficienteK: 1, anchoPasillo: 2.5 },
  departamentos: [], obstaculos: [], flujos: {}, relaciones: {},
  pesosREL: { A: 6, E: 5, I: 4, O: 3, U: 2, X: 1 },
  equiposTemporales: [],
  resultados: { eldep: null, corelap: null }
};
const Nav = { pantalla: 'inicio', metodo: 'eldep', paso: 0, sub: 'nave', opcion: 'inicio' };
let graficaAreas = null;

function guardarProyecto() {
  const { general, departamentos, obstaculos, flujos, relaciones, pesosREL } = Estado;
  memoria.guardar('alphablock_proyecto_actual', { general, departamentos, obstaculos, flujos, relaciones, pesosREL });
}

/** Todo cambio de datos invalida los resultados para no mostrar cálculos viejos. */
function datosCambiados() {
  Estado.resultados = { eldep: null, corelap: null };
  guardarProyecto();
  renderizarDatos();
}

function cargarProyecto() {
  const d = memoria.leer('alphablock_proyecto_actual');
  if (!d || !d.general) { cargarCasoEjemplo(); return; }
  Object.assign(Estado.general, d.general);
  Estado.departamentos = d.departamentos || [];
  Estado.obstaculos = d.obstaculos || [];
  Estado.flujos = d.flujos || {};
  Estado.relaciones = d.relaciones || {};
  Object.assign(Estado.pesosREL, d.pesosREL || {});
}

function cargarCasoEjemplo() {
  Estado.general = {
    nombre: 'Planta Metalmecánica Alpha',
    descripcion: 'Fabricación de estructuras metálicas: recepción, corte CNC, ensamble, pintura y embarque.',
    unidad: 'm', largoPlanta: 32, anchoPlanta: 20, coeficienteK: 1, anchoPasillo: 2.5
  };
  const dep = (id, codigo, nombre, actividad, trabajadores, areaAlmacen, color, eq, zonaFija = 'libre') =>
    ({ id, codigo, nombre, actividad, trabajadores, areaAlmacen, color, zonaFija, relacionMax: 2.5,
       equipos: [{ nombre: eq[0], cantidad: eq[1], largo: eq[2], ancho: eq[3], lados: eq[4] }] });
  Estado.departamentos = [
    dep('dep_1', 'REC', 'Recepción y Almacén MP', 'Recepción y Almacén', 3, 18, '#2563eb', ['Rack Industrial', 4, 2.5, 1.2, 1], 'oeste'),
    dep('dep_2', 'COR', 'Corte y Maquinado CNC', 'Corte y Maquinado', 4, 8, '#0891b2', ['Cortadora Láser CNC', 2, 4, 2.2, 2]),
    dep('dep_3', 'ENS', 'Ensamble y Soldadura', 'Ensamble y Soldadura', 6, 10, '#059669', ['Mesa de Soldadura', 4, 2.4, 1.5, 3]),
    dep('dep_4', 'PIN', 'Cabina de Pintura', 'Pintura y Acabados', 2, 6, '#d97706', ['Cabina Electrostática', 1, 5, 3, 2]),
    dep('dep_5', 'EMB', 'Calidad y Embarque', 'Empaque y Embarque', 3, 14, '#7c3aed', ['Mesa de Inspección y Báscula', 2, 2.5, 1.5, 2], 'este')
  ];
  Estado.obstaculos = [
    { id: 'obs_1', tipo: 'acceso', nombre: 'Portón Carga', x: 0, y: 2, largo: 1, ancho: 4 },
    { id: 'obs_2', tipo: 'acceso', nombre: 'Andén Salida', x: 31, y: 14, largo: 1, ancho: 4 }
  ];
  Estado.flujos = { 'dep_1->dep_2': 45, 'dep_2->dep_3': 40, 'dep_3->dep_4': 35, 'dep_4->dep_5': 35, 'dep_1->dep_3': 10 };
  Estado.relaciones = { 'dep_1|dep_2': 'A', 'dep_2|dep_3': 'A', 'dep_3|dep_4': 'E', 'dep_4|dep_5': 'A', 'dep_2|dep_4': 'X', 'dep_1|dep_5': 'U' };
  Estado.pesosREL = { A: 6, E: 5, I: 4, O: 3, U: 2, X: 1 };
  Estado.resultados = { eldep: null, corelap: null };
  guardarProyecto();
}

/* ============================================================================
   3. MOTOR DE CÁLCULO
   ============================================================================ */
const obtenerFlujo = (a, b) => Number(Estado.flujos[`${a}->${b}`] || 0);
const obtenerREL = (a, b) => Estado.relaciones[`${a}|${b}`] || Estado.relaciones[`${b}|${a}`] || 'U';

function superficiesGuerchet(depto, K) {
  let Se = 0, Sg = 0, Sv = 0;
  depto.equipos.forEach((e) => {
    const se = e.largo * e.ancho, sg = se * e.lados;
    Se += se * e.cantidad; Sg += sg * e.cantidad; Sv += (se + sg) * K * e.cantidad;
  });
  const almacen = depto.areaAlmacen || 0;
  return { Se: r2(Se), Sg: r2(Sg), Sv: r2(Sv), almacen: r2(almacen), ST: r2(Se + Sg + Sv + almacen) };
}
const conAreas = () => Estado.departamentos.map((d) => ({ ...d, areas: superficiesGuerchet(d, Estado.general.coeficienteK) }));
const areaRequerida = () => r2(conAreas().reduce((s, d) => s + d.areas.ST, 0));

const nuevoBloque = (d, x, y, largo, ancho) => ({
  id: d.id, codigo: d.codigo, nombre: d.nombre, color: d.color, orden: d.orden,
  x, y, largo, ancho, areaRequerida: d.areas.ST, areaAsignada: r2(largo * ancho)
});

/** Indicadores medidos sobre la geometría REAL; se aplican igual a ambos métodos. */
function evaluarDistribucion(bloques) {
  const tol = 0.05, pasillo = Estado.general.anchoPasillo;
  const contiguos = (a, b) => {
    const solapeX = Math.min(a.x + a.largo, b.x + b.largo) - Math.max(a.x, b.x);
    const solapeY = Math.min(a.y + a.ancho, b.y + b.ancho) - Math.max(a.y, b.y);
    return (Math.abs(solapeX) <= tol && solapeY > tol) || (Math.abs(solapeY) <= tol && solapeX > tol);
  };
  let z = 0, aeTotal = 0, aeOk = 0, conflictosX = 0;
  const pares = [];
  bloques.forEach((a, i) => bloques.forEach((b, j) => {
    if (i === j) return;
    const dist = Math.abs(a.x + a.largo / 2 - b.x - b.largo / 2) + Math.abs(a.y + a.ancho / 2 - b.y - b.ancho / 2);
    const f = obtenerFlujo(a.id, b.id);
    if (f > 0) { z += f * dist; pares.push({ de: a.codigo, a: b.codigo, f, d: r2(dist), fd: r2(f * dist) }); }
    if (j > i) {
      const cod = obtenerREL(a.id, b.id), junto = contiguos(a, b);
      if (cod === 'A' || cod === 'E') { aeTotal++; if (junto) aeOk++; }
      if (cod === 'X' && junto) conflictosX++;
    }
  }));

  const avisos = [];
  const { largoPlanta: L, anchoPlanta: W, unidad: u } = Estado.general;
  bloques.forEach((b) => {
    const d = Estado.departamentos.find((x) => x.id === b.id);
    const prop = Math.max(b.largo, b.ancho) / Math.max(0.001, Math.min(b.largo, b.ancho));
    if (prop > d.relacionMax + 0.01) avisos.push(`${b.codigo}: proporción ${prop.toFixed(1)}:1 supera el máximo ${d.relacionMax}:1.`);
    const cumple = { libre: true, oeste: b.x <= tol, este: b.x + b.largo >= L - tol, norte: b.y <= tol, sur: b.y + b.ancho >= W - tol }[d.zonaFija];
    if (!cumple) avisos.push(`${b.codigo}: no toca el borde ${d.zonaFija} solicitado.`);
    if (b.areaAsignada < b.areaRequerida - 0.5) avisos.push(`${b.codigo}: recibe ${b.areaAsignada} ${u}² de ${b.areaRequerida} ${u}² requeridos.`);
    Estado.obstaculos.forEach((o) => {
      if (o.x < b.x + b.largo - tol && o.x + o.largo > b.x + tol && o.y < b.y + b.ancho - tol && o.y + o.ancho > b.y + tol)
        avisos.push(`${b.codigo}: se traslapa con "${o.nombre}".`);
    });
  });
  const requerida = areaRequerida(), disponible = r2(L * W);
  if (requerida > disponible - (pasillo > 0 ? pasillo * L : 0)) avisos.unshift('El área requerida no cabe en el área útil (considerando el pasillo).');
  return {
    z: r2(z), pares, aeTotal, aeOk, conflictosX, avisos, requerida, disponible,
    ocupacion: Number((requerida / disponible * 100).toFixed(1))
  };
}

const pesoZona = (d) => ({ oeste: -1, este: 1 }[d.zonaFija] || 0);

function calcularELDEP() {
  const { largoPlanta: L, anchoPlanta: W, anchoPasillo: P } = Estado.general;
  const deptos = conAreas();
  deptos.forEach((d) => {
    d.salida = deptos.reduce((s, o) => s + obtenerFlujo(d.id, o.id), 0);
    d.entrada = deptos.reduce((s, o) => s + obtenerFlujo(o.id, d.id), 0);
    d.flujoTotal = d.salida + d.entrada;
  });

  // 1. Secuencia por cadena de flujo: inicia en el área fija al oeste o, si no hay, en el mayor origen neto
  const restantes = [...deptos].sort((a, b) => (b.salida - b.entrada) - (a.salida - a.entrada) || b.flujoTotal - a.flujoTotal);
  const inicio = Math.max(0, restantes.findIndex((d) => d.zonaFija === 'oeste'));
  const secuencia = restantes.splice(inicio, 1);
  const enlace = (a, b) => obtenerFlujo(a.id, b.id) + obtenerFlujo(b.id, a.id);
  while (restantes.length) {
    const ultimo = secuencia[secuencia.length - 1];
    const conColocados = (d) => secuencia.reduce((s, o) => s + enlace(d, o), 0);
    restantes.sort((a, b) => (a.zonaFija === 'este') - (b.zonaFija === 'este') || enlace(ultimo, b) - enlace(ultimo, a) || conColocados(b) - conColocados(a) || b.flujoTotal - a.flujoTotal);
    secuencia.push(restantes.shift());
  }
  secuencia.forEach((d, i) => { d.orden = i + 1; });

  const hayPasillo = P > 0 && deptos.length >= 4 && W > P * 2.5;
  const anchoUtil = hayPasillo ? W - P : W;
  const total = deptos.reduce((s, d) => s + d.areas.ST, 0);
  const factor = Math.min(1, (L * anchoUtil) / total);
  const areaBanda = (b) => b.reduce((s, d) => s + d.areas.ST * factor, 0);

  // 2. Geometría de una alternativa (una o dos bandas separadas por el pasillo)
  const construir = (bandas) => {
    // La altura de cada banda nunca permite que los bloques salgan de la nave
    const minimos = bandas.map((b) => areaBanda(b) / L);
    let alturas = minimos.map((m) => Math.max(m, anchoUtil / bandas.length * 0.65));
    const suma = alturas.reduce((x, y) => x + y, 0);
    if (suma > anchoUtil) {
      const sumaMin = minimos.reduce((x, y) => x + y, 0);
      const libre = Math.max(0, anchoUtil - sumaMin), extra = suma - sumaMin;
      alturas = alturas.map((h, i) => minimos[i] + (extra > 0 ? (h - minimos[i]) * libre / extra : 0));
    }
    const bloques = [];
    let y = 0;
    bandas.forEach((lista, i) => {
      const h = alturas[i];
      let x = 0;
      lista.forEach((d, j) => {
        const largo = d.areas.ST * factor / h;
        const alEste = d.zonaFija === 'este' && j === lista.length - 1;
        bloques.push(nuevoBloque(d, alEste ? L - largo : x, y, largo, h));
        x += largo;
      });
      y += h + P * (hayPasillo ? 1 : 0);
    });
    return { bloques, pasillo: hayPasillo ? { y: alturas[0], alto: P } : null };
  };

  // 3. Se prueban los cortes y sentidos posibles de la secuencia y se elige el mejor
  const ordenarZona = (lista) => [...lista].sort((a, b) => pesoZona(a) - pesoZona(b));
  const alternativas = [];
  if (!hayPasillo) alternativas.push([ordenarZona(secuencia)]);
  else for (let k = 1; k < secuencia.length; k++) {
    const arriba = secuencia.slice(0, k), abajo = secuencia.slice(k);
    [[arriba, abajo], [abajo, arriba]].forEach(([n, s]) => {
      [n, [...n].reverse()].forEach((fn) => [s, [...s].reverse()].forEach((fs) => alternativas.push([ordenarZona(fn), ordenarZona(fs)])));
    });
  }
  let mejor = null;
  alternativas.forEach((bandas) => {
    const g = construir(bandas), ev = evaluarDistribucion(g.bloques);
    // Primero menos incumplimientos; a igualdad, menor carga-distancia
    if (!mejor || ev.avisos.length < mejor.ev.avisos.length || (ev.avisos.length === mejor.ev.avisos.length && ev.z < mejor.ev.z)) mejor = { ...g, ev };
  });

  return { metodo: 'eldep', calculados: deptos, secuencia, alternativas: alternativas.length, bloques: mejor.bloques, pasillo: mejor.pasillo, ...mejor.ev };
}

function calcularCORELAP() {
  const { largoPlanta: L, anchoPlanta: W } = Estado.general;
  const pesos = Estado.pesosREL;
  const info = conAreas().map((d) => {
    const conteo = { A: 0, E: 0, I: 0, O: 0, U: 0, X: 0 };
    let tcr = 0;
    Estado.departamentos.forEach((o) => {
      if (o.id === d.id) return;
      const c = obtenerREL(d.id, o.id);
      conteo[c]++; tcr += Number(pesos[c]) || 0;
    });
    return { ...d, conteo, tcr };
  });

  const restantes = [...info].sort((a, b) => b.tcr - a.tcr || b.conteo.A - a.conteo.A || b.conteo.E - a.conteo.E || b.areas.ST - a.areas.ST);
  const primero = restantes.shift();
  const ubicados = [{ ...primero, orden: 1, gx: 0, gy: 0 }];
  const bitacora = [{ iteracion: 1, depto: `${primero.codigo} - ${primero.nombre}`, criterio: `Mayor TCR (${primero.tcr}) · Relaciones A: ${primero.conteo.A}`, posicion: 'Núcleo (0, 0)', pr: '—' }];

  while (restantes.length) {
    let mejor = null;
    restantes.forEach((c, idx) => {
      let nivel = 99, motivo = '';
      ubicados.forEach((u) => {
        const cod = obtenerREL(c.id, u.id), n = CODIGOS.indexOf(cod);
        if (n < nivel) { nivel = n; motivo = `Relación ${cod} con ${u.codigo}`; }
      });
      if (!mejor || nivel < mejor.nivel || (nivel === mejor.nivel && c.tcr > restantes[mejor.idx].tcr)) mejor = { idx, nivel, motivo };
    });
    const sel = restantes.splice(mejor.idx, 1)[0];

    const ocupadas = new Set(ubicados.map((u) => `${u.gx},${u.gy}`));
    let pos = null, prMax = -Infinity;
    ubicados.forEach((u) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const gx = u.gx + dx, gy = u.gy + dy;
      if (ocupadas.has(`${gx},${gy}`)) return;
      let pr = 0;
      ubicados.forEach((o) => {
        const ax = Math.abs(gx - o.gx), ay = Math.abs(gy - o.gy);
        const cod = obtenerREL(sel.id, o.id);
        const peso = cod === 'X' ? -20 : Number(pesos[cod]) || 0;
        if (ax + ay === 1) pr += peso;
        else if (ax === 1 && ay === 1) pr += peso * 0.5;
      });
      if (pr > prMax) { prMax = pr; pos = { gx, gy }; }
    }));

    const orden = ubicados.length + 1;
    ubicados.push({ ...sel, orden, ...pos });
    bitacora.push({ iteracion: orden, depto: `${sel.codigo} - ${sel.nombre}`, criterio: `${mejor.motivo} (TCR: ${sel.tcr})`, posicion: `Celda (${pos.gx}, ${pos.gy})`, pr: r2(prMax) });
  }

  // Proyección a la nave: se elige el ancho de conjunto con mejores proporciones
  const filas = [...new Set(ubicados.map((u) => u.gy))].sort((a, b) => a - b)
    .map((gy) => ubicados.filter((u) => u.gy === gy).sort((a, b) => a.gx - b.gx));
  const total = ubicados.reduce((s, u) => s + u.areas.ST, 0);
  const factor = Math.min(1, (L * W) / total);
  const proyectar = (ancho) => {
    const bloques = [];
    let y = 0;
    filas.forEach((fila) => {
      const area = fila.reduce((s, d) => s + d.areas.ST * factor, 0), h = area / ancho;
      let x = 0;
      fila.forEach((d) => { const largo = d.areas.ST * factor / h; bloques.push(nuevoBloque(d, x, y, largo, h)); x += largo; });
      y += h;
    });
    return bloques;
  };
  const anchoMin = Math.min(L, total * factor / W);
  let bloques = null, mejorPuntaje = Infinity;
  for (let i = 0; i <= 80; i++) {
    const prueba = proyectar(anchoMin + (L - anchoMin) * i / 80);
    const puntaje = prueba.reduce((s, b) => s + Math.max(b.largo / b.ancho, b.ancho / b.largo), 0);
    if (puntaje < mejorPuntaje) { mejorPuntaje = puntaje; bloques = prueba; }
  }

  return { metodo: 'corelap', calculados: info, ubicados, bitacora, bloques, pasillo: null, ...evaluarDistribucion(bloques) };
}

function validarDatos(metodo) {
  const g = Estado.general, ds = Estado.departamentos;
  if (!(g.largoPlanta > 0 && g.anchoPlanta > 0)) return 'Las dimensiones de la nave deben ser mayores a cero.';
  if (ds.length < 2) return 'Registre al menos 2 departamentos (paso 1, pestaña B).';
  if (conAreas().some((d) => !(d.areas.ST > 0))) return 'Todos los departamentos deben tener superficie mayor a cero.';
  if (metodo === 'eldep' && !ds.some((a) => ds.some((b) => obtenerFlujo(a.id, b.id) > 0))) return 'Capture al menos un flujo en la matriz Desde–Hacia (pestaña D).';
  return '';
}

function calcular(metodo) {
  const error = validarDatos(metodo);
  if (error) return error;
  Estado.resultados[metodo] = metodo === 'eldep' ? calcularELDEP() : calcularCORELAP();
  return '';
}

/* ============================================================================
   4. CONSTRUCTORES DE TABLAS Y DIAGRAMAS
   ============================================================================ */
const tablaHTML = (cabeza, filas) => `<div class="tabla-scroll"><table class="tabla"><thead><tr>${cabeza.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const tarjetaHTML = (titulo, cuerpo, id = '') => `<div class="tarjeta"${id ? ` id="${id}"` : ''}><h3>${titulo}</h3>${cuerpo}</div>`;

const abrirSVG = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Arial"><rect width="${w}" height="${h}" fill="#0c1016"/>`;

function svgGrafo(res) {
  const w = 480, h = 360, esEldep = res.metodo === 'eldep';
  const lista = res.bloques;
  const nodos = lista.map((b, i) => {
    const a = 2 * Math.PI * i / lista.length - Math.PI / 2;
    return { ...b, nx: w / 2 + 135 * Math.cos(a), ny: h / 2 + 135 * Math.sin(a) };
  });
  const maxF = Math.max(1, ...res.pares.map((p) => p.f));
  let lineas = '';
  nodos.forEach((a, i) => nodos.forEach((b, j) => {
    if (i === j) return;
    const dx = b.nx - a.nx, dy = b.ny - a.ny, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    if (esEldep) {
      const f = obtenerFlujo(a.id, b.id);
      if (!f) return;
      const off = 4, x1 = a.nx + ux * 23 - uy * off, y1 = a.ny + uy * 23 + ux * off;
      const x2 = b.nx - ux * 25 - uy * off, y2 = b.ny - uy * 25 + ux * off;
      const g = 1.5 + 4 * f / maxF;
      lineas += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#22d3ee" stroke-width="${g}"/>`
        + `<polygon points="${x2 + ux * 5},${y2 + uy * 5} ${x2 - ux * 8 - uy * 6},${y2 - uy * 8 + ux * 6} ${x2 - ux * 8 + uy * 6},${y2 - uy * 8 - ux * 6}" fill="#22d3ee"/>`
        + `<text x="${x1 + (x2 - x1) * .38}" y="${y1 + (y2 - y1) * .38 - 4}" fill="#fde68a" font-size="12" font-weight="bold" text-anchor="middle">${f}</text>`;
    } else if (j > i) {
      const cod = obtenerREL(a.id, b.id);
      if (cod === 'U') return;
      const n = { A: 4, E: 3, I: 2, O: 1, X: 1 }[cod];
      for (let k = 0; k < n; k++) {
        const o = (k - (n - 1) / 2) * 4;
        lineas += `<line x1="${a.nx - uy * o}" y1="${a.ny + ux * o}" x2="${b.nx - uy * o}" y2="${b.ny + ux * o}" stroke="${COLORES_REL[cod]}" stroke-width="${cod === 'X' ? 2.5 : 1.8}"${cod === 'X' ? ' stroke-dasharray="7,5"' : ''}/>`;
      }
    }
  }));
  const circulos = nodos.map((n) => `<circle cx="${n.nx}" cy="${n.ny}" r="22" fill="${n.color}" stroke="#fff" stroke-width="2"/><text x="${n.nx}" y="${n.ny + 4}" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">${esc(n.codigo)}</text>`).join('');
  return `${abrirSVG(w, h)}${lineas}${circulos}</svg>`;
}

function svgBloquesUnitarios(res) {
  const w = 480, h = 360, u = res.ubicados;
  const xs = u.map((d) => d.gx), ys = u.map((d) => d.gy);
  const cols = Math.max(...xs) - Math.min(...xs) + 1, filas = Math.max(...ys) - Math.min(...ys) + 1;
  const c = Math.min(90, (w - 30) / cols, (h - 30) / filas);
  const ox = (w - cols * c) / 2, oy = (h - filas * c) / 2;
  const cuadros = u.map((d) => {
    const x = ox + (d.gx - Math.min(...xs)) * c, y = oy + (d.gy - Math.min(...ys)) * c;
    return `<rect x="${x + 1}" y="${y + 1}" width="${c - 2}" height="${c - 2}" rx="4" fill="${d.color}" stroke="#fff" stroke-width="1.5"/><text x="${x + c / 2}" y="${y + c / 2 - 2}" fill="#fff" font-size="${Math.min(14, c / 4)}" font-weight="bold" text-anchor="middle">${esc(d.codigo)}</text><text x="${x + c / 2}" y="${y + c / 2 + 15}" fill="#fff" font-size="${Math.min(11, c / 5)}" text-anchor="middle">#${d.orden}</text>`;
  }).join('');
  return `${abrirSVG(w, h)}${cuadros}</svg>`;
}

/** Dibuja el plano en cualquier canvas (pantalla, PNG o PDF). */
function dibujarPlano(canvas, res, op = { cotas: true, pasillos: true, flujos: true }) {
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  const { largoPlanta: L, anchoPlanta: A, unidad: u, nombre } = Estado.general;
  const m = 80, e = Math.min((W - m * 2) / L, (H - m * 2) / A);
  const ox = (W - L * e) / 2, oy = (H - A * e) / 2;
  ctx.fillStyle = '#090d12'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(148,163,184,.16)'; ctx.lineWidth = 1;
  const paso = Math.max(1, Math.round(L / 16));
  for (let x = 0; x <= L; x += paso) { ctx.beginPath(); ctx.moveTo(ox + x * e, oy); ctx.lineTo(ox + x * e, oy + A * e); ctx.stroke(); }
  for (let y = 0; y <= A; y += paso) { ctx.beginPath(); ctx.moveTo(ox, oy + y * e); ctx.lineTo(ox + L * e, oy + y * e); ctx.stroke(); }

  const texto = (t, x, y, tam = 18, color = '#fff', peso = 'bold') => { ctx.fillStyle = color; ctx.font = `${peso} ${tam}px Segoe UI, Arial`; ctx.textAlign = 'center'; ctx.fillText(t, x, y); };
  texto(`PLANO DE PLANTA: ${nombre.toUpperCase()} (${res.metodo.toUpperCase()})`, W / 2, 34, 22);

  if (res.pasillo && op.pasillos) {
    const py = oy + res.pasillo.y * e, ph = res.pasillo.alto * e;
    ctx.fillStyle = 'rgba(245,158,11,.18)'; ctx.fillRect(ox, py, L * e, ph);
    texto(`PASILLO PRINCIPAL (${res.pasillo.alto} ${u})`, ox + L * e / 2, py + ph / 2 + 6, 16, '#fbbf24');
  }
  res.bloques.forEach((b) => {
    const x = ox + b.x * e, y = oy + b.y * e, w = b.largo * e, h = b.ancho * e;
    ctx.fillStyle = b.color + 'CC'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
  });
  if (op.flujos) {
    res.bloques.forEach((a, i) => res.bloques.slice(i + 1).forEach((b) => {
      let color = null, grosor = 2;
      if (res.metodo === 'eldep') {
        const f = obtenerFlujo(a.id, b.id) + obtenerFlujo(b.id, a.id);
        if (f > 0) { color = 'rgba(34,211,238,.8)'; grosor = Math.min(7, 2 + f / 15); }
      } else {
        const c = obtenerREL(a.id, b.id);
        if (c === 'A' || c === 'E' || c === 'X') { color = COLORES_REL[c]; grosor = c === 'A' ? 4 : 2.5; }
      }
      if (!color) return;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = grosor;
      if (res.metodo === 'corelap' && obtenerREL(a.id, b.id) === 'X') ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(ox + (a.x + a.largo / 2) * e, oy + (a.y + a.ancho / 2) * e);
      ctx.lineTo(ox + (b.x + b.largo / 2) * e, oy + (b.y + b.ancho / 2) * e);
      ctx.stroke(); ctx.restore();
    }));
  }
  Estado.obstaculos.forEach((o) => {
    ctx.fillStyle = { acceso: '#10b981', seguridad: '#f59e0b', columna: '#ef4444' }[o.tipo];
    ctx.fillRect(ox + o.x * e, oy + o.y * e, o.largo * e, o.ancho * e);
    texto(o.nombre, ox + (o.x + o.largo / 2) * e, oy + (o.y + o.ancho / 2) * e + 5, 13);
  });
  // Etiquetas al final para que las líneas no las tapen
  res.bloques.forEach((b) => {
    const cx = ox + (b.x + b.largo / 2) * e, cy = oy + (b.y + b.ancho / 2) * e, w = b.largo * e, h = b.ancho * e;
    if (w < 40 || h < 24) return;
    if (w > 100 && h > 66) {
      ctx.fillStyle = 'rgba(5,8,12,.78)'; ctx.fillRect(cx - 48, cy - 30, 96, 62);
      texto(b.codigo, cx, cy - 10, 20); texto(`${b.largo.toFixed(2)} × ${b.ancho.toFixed(2)}`, cx, cy + 9, 14, '#e2e8f0', 'normal'); texto(`${b.areaAsignada} ${u}²`, cx, cy + 26, 14, '#e2e8f0', 'normal');
    } else texto(b.codigo, cx, cy + 6, 15);
  });
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.strokeRect(ox, oy, L * e, A * e);
  if (op.cotas) {
    texto(`Largo total: ${L} ${u}`, ox + L * e / 2, oy + A * e + 34, 18, '#cbd5e1');
    ctx.save(); ctx.translate(ox - 24, oy + A * e / 2); ctx.rotate(-Math.PI / 2); texto(`Ancho total: ${A} ${u}`, 0, 0, 18, '#cbd5e1'); ctx.restore();
    const tramo = Math.max(1, Math.round(L / 6)), bx = ox, by = H - 20;
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(bx, by, tramo * e, 5); texto(`0 — ${tramo} ${u}`, bx + tramo * e / 2, by - 6, 13);
  }
}

/* ============================================================================
   5. RENDERIZADO DEL PASO 1 (DATOS)
   ============================================================================ */
function renderizarDatos() {
  const g = Estado.general, u = g.unidad;
  $$('.lbl-unidad').forEach((el) => { el.textContent = u; });
  const campos = { 'input-nombre-proyecto': g.nombre, 'input-unidad-medida': u, 'input-largo-planta': g.largoPlanta, 'input-ancho-planta': g.anchoPlanta, 'input-coeficiente-k': Number(g.coeficienteK).toFixed(2), 'input-ancho-pasillo': g.anchoPasillo };
  Object.entries(campos).forEach(([id, v]) => { if (document.activeElement !== $(id)) $(id).value = v; });
  $('metodo-proyecto').textContent = `Proyecto: ${g.nombre}`;
  $('menu-proyecto').textContent = `Proyecto: ${g.nombre}`;

  const disp = g.largoPlanta * g.anchoPlanta, req = areaRequerida(), oc = disp > 0 ? req / disp * 100 : 0;
  $('kpis').innerHTML = [
    ['Área disponible', `${disp.toFixed(2)} ${u}²`, ''], ['Área requerida (Guerchet)', `${req.toFixed(2)} ${u}²`, ''],
    ['Ocupación proyectada', `${oc.toFixed(1)}%`, oc > 100 ? 'texto-error' : oc > 85 ? 'texto-alerta' : 'texto-ok'], ['Departamentos', Estado.departamentos.length, '']
  ].map(([t, v, c]) => `<div class="kpi"><small>${t}</small><strong class="${c}">${v}</strong></div>`).join('');

  const deps = conAreas();
  $('tbody-departamentos').innerHTML = deps.length ? deps.map((d) => `<tr>
      <td><span class="punto-color" style="background:${esc(d.color)}"></span><strong>${esc(d.codigo)}</strong></td>
      <td>${esc(d.nombre)}</td>
      <td>${d.equipos.map((e) => `${e.cantidad}× ${esc(e.nombre)}`).join(', ')}</td>
      <td><strong>${d.areas.ST} ${u}²</strong></td>
      <td><button type="button" class="btn btn-secundario btn-xs" data-editar="${d.id}">Editar</button> <button type="button" class="btn btn-peligro btn-xs" data-eliminar="${d.id}">Eliminar</button></td></tr>`).join('')
    : '<tr><td colspan="5">No hay departamentos. Agregue uno o cargue el caso ejemplo desde Opciones.</td></tr>';

  const sel = $('rest-depto-select'), previo = sel.value;
  sel.innerHTML = deps.map((d) => `<option value="${d.id}">${esc(d.codigo)} - ${esc(d.nombre)}</option>`).join('');
  if (deps.some((d) => d.id === previo)) sel.value = previo;
  sincronizarRestriccion();
  $('lista-restricciones').innerHTML = deps.map((d) => `<li><span><strong>${esc(d.codigo)}:</strong> ${d.zonaFija} · máx. ${d.relacionMax}:1</span></li>`).join('');
  $('lista-obstaculos').innerHTML = Estado.obstaculos.map((o) => `<li><span><strong>${o.tipo}:</strong> ${esc(o.nombre)} ${o.ubicacion ? `(${NOMBRES_UBICACION[o.ubicacion]})` : `(${o.largo}×${o.ancho} en X ${o.x}, Y ${o.y})`}</span><button type="button" class="btn btn-peligro btn-xs" data-quitar-obs="${o.id}">Quitar</button></li>`).join('');

  renderizarMatrices();
}

function sincronizarRestriccion() {
  const d = Estado.departamentos.find((x) => x.id === $('rest-depto-select').value);
  if (d) { $('rest-zona-fija').value = d.zonaFija; $('rest-relacion-max').value = String(d.relacionMax); }
}

function renderizarMatrices() {
  const ds = Estado.departamentos;
  const falta = '<p class="texto-ayuda">Registre al menos 2 departamentos.</p>';
  const cab = ds.map((d) => `<th>${esc(d.codigo)}</th>`).join('');
  $('contenedor-matriz-flujo').innerHTML = ds.length < 2 ? falta : `<table class="tabla"><thead><tr><th>Desde \\ Hacia</th>${cab}</tr></thead><tbody>${ds.map((a) => `<tr><th>${esc(a.codigo)}</th>${ds.map((b) => a.id === b.id ? '<td class="celda-diagonal">—</td>' : `<td><input type="number" min="0" aria-label="Flujo ${esc(a.codigo)} a ${esc(b.codigo)}" data-flujo="${a.id}->${b.id}" value="${obtenerFlujo(a.id, b.id)}"></td>`).join('')}</tr>`).join('')}</tbody></table>`;

  $('escala-rel').innerHTML = CODIGOS.map((c) => `<label style="--c:${COLORES_REL[c]}"><b>${c}</b><span>${NOMBRES_REL[c]}</span><input type="number" data-peso="${c}" value="${Estado.pesosREL[c]}"></label>`).join('');
  renderizarMatrizREL();
}

function renderizarMatrizREL() {
  const ds = Estado.departamentos;
  const cab = ds.map((d) => `<th>${esc(d.codigo)}</th>`).join('');
  $('contenedor-matriz-rel').innerHTML = ds.length < 2 ? '<p class="texto-ayuda">Registre al menos 2 departamentos.</p>' : `<table class="tabla"><thead><tr><th>Depto.</th>${cab}<th>TCR</th></tr></thead><tbody>${ds.map((a, i) => {
    const tcr = ds.reduce((s, b) => s + (a.id === b.id ? 0 : Number(Estado.pesosREL[obtenerREL(a.id, b.id)]) || 0), 0);
    return `<tr><th>${esc(a.codigo)}</th>${ds.map((b, j) => {
      if (i === j) return '<td class="celda-diagonal">■</td>';
      const c = obtenerREL(a.id, b.id);
      return j > i ? `<td><select aria-label="Relación ${esc(a.codigo)} con ${esc(b.codigo)}" data-rel="${a.id}|${b.id}">${CODIGOS.map((k) => `<option value="${k}"${k === c ? ' selected' : ''}>${NOMBRES_CORTOS[k]}</option>`).join('')}</select></td>` : `<td style="color:${COLORES_REL[c]}"><strong>${NOMBRES_CORTOS[c]}</strong></td>`;
    }).join('')}<td><strong>${tcr}</strong></td></tr>`;
  }).join('')}</tbody></table>`;
}

function renderizarEquiposTemporales() {
  $('lista-equipos-temporales').innerHTML = Estado.equiposTemporales.map((e, i) => `<span class="chip"><strong>${e.cantidad}×</strong> ${esc(e.nombre)} (${e.largo}×${e.ancho}, N=${e.lados})<button type="button" data-quitar-eq="${i}" aria-label="Quitar equipo">✕</button></span>`).join('');
}

function limpiarFormularioDepto() {
  $('form-departamento').reset();
  $('edit-depto-id').value = '';
  Estado.equiposTemporales = [];
  renderizarEquiposTemporales();
  $('btn-guardar-depto').textContent = 'Guardar departamento';
  $('btn-cancelar-edicion').classList.add('oculto');
}

/* ============================================================================
   6. PASOS 2, 3 Y 4
   ============================================================================ */
const FORMULAS = {
  eldep: [
    ['Superficie estática', 'Se = Largo × Ancho', 'Área proyectada del equipo.'],
    ['Superficie de gravitación', 'Sg = Se × N', 'N = lados operativos.'],
    ['Superficie de evolución', 'Sv = (Se + Sg) × K', 'K = coeficiente de evolución.'],
    ['Superficie total', 'ST = Σ n(Se + Sg + Sv) + Alm.', 'n = cantidad de equipos.'],
    ['Carga–distancia', 'Z = Σ fᵢⱼ × dᵢⱼ', 'd = |x₁−x₂| + |y₁−y₂| entre centroides.']
  ],
  corelap: [
    ['Cercanía total', 'TCRᵢ = Σ V(rᵢⱼ)', 'V = valor del código REL.'],
    ['Primer departamento', 'máx TCR', 'Desempate: más A, más E, mayor área.'],
    ['Siguientes', 'A > E > I > O > U > X', 'Según su relación con los ya colocados; desempata el TCR.'],
    ['Calificación de colocación', 'PR = Σ V(r) × α', 'α = 1 lado compartido; 0.5 esquina. En PR, X = −20.'],
    ['Superficie por departamento', 'Guerchet', 'ST define el tamaño final del bloque.']
  ]
};

function renderizarCalculo() {
  const m = Nav.metodo, res = Estado.resultados[m], u = Estado.general.unidad, K = Estado.general.coeficienteK;
  $('formulas').innerHTML = FORMULAS[m].map(([t, f, n]) => `<div class="formula"><b>${t}</b><code>${f}</code><small>${n}</small></div>`).join('');
  $('btn-calcular').textContent = `▶ Calcular método ${m.toUpperCase()}`;
  $('estado-calculo').textContent = res ? 'Cálculo actualizado. Continúe con los diagramas.' : (validarDatos(m) || 'Datos listos. Presione calcular para desbloquear los diagramas.');
  const cont = $('resultados-calculo');
  if (!res) { cont.innerHTML = ''; return; }

  const guerchet = tarjetaHTML('Memoria de Guerchet (sustitución de valores)', `<div class="memoria">${res.calculados.map((d) => `<div class="paso-calculo"><strong>${esc(d.codigo)} — ${esc(d.nombre)}</strong>${d.equipos.map((e) => `<br>${e.cantidad} × ${esc(e.nombre)}: <code>Se = ${e.largo} × ${e.ancho} = ${r2(e.largo * e.ancho)}</code>; <code>Sg = ${r2(e.largo * e.ancho)} × ${e.lados} = ${r2(e.largo * e.ancho * e.lados)}</code>`).join('')}<br>Subtotales: Se = ${d.areas.Se}; Sg = ${d.areas.Sg}; <code>Sv = (${d.areas.Se} + ${d.areas.Sg}) × ${K} = ${d.areas.Sv}</code><br><code>ST = ${d.areas.Se} + ${d.areas.Sg} + ${d.areas.Sv} + ${d.areas.almacen} = <strong>${d.areas.ST} ${u}²</strong></code></div>`).join('')}</div>`);

  if (m === 'eldep') {
    cont.innerHTML = guerchet
      + tarjetaHTML('Secuencia por cadena de flujo', tablaHTML(['Orden', 'Departamento', 'Salidas', 'Entradas', 'Flujo total'], res.secuencia.map((d) => [d.orden, `${esc(d.codigo)} — ${esc(d.nombre)}`, d.salida, d.entrada, d.flujoTotal])) + `<p class="texto-ayuda">Se evaluaron ${res.alternativas} alternativas de acomodo; se eligió la de menos incumplimientos y, en empate, menor Z.</p>`)
      + tarjetaHTML(`Función carga–distancia: Z = ${res.z} cargas·${u}`, tablaHTML(['Origen', 'Destino', 'Flujo f', `Distancia d (${u})`, 'f × d'], res.pares.map((p) => [esc(p.de), esc(p.a), p.f, p.d, p.fd])));
  } else {
    cont.innerHTML = tarjetaHTML('Total Closeness Rating (TCR)', tablaHTML(['Departamento', ...CODIGOS, 'Sustitución', 'TCR'], res.calculados.map((d) => [esc(d.codigo), ...CODIGOS.map((c) => d.conteo[c]), CODIGOS.filter((c) => d.conteo[c]).map((c) => `${d.conteo[c]}(${Estado.pesosREL[c]})`).join(' + '), `<strong>${d.tcr}</strong>`])))
      + tarjetaHTML('Iteraciones de selección y colocación', `<div class="memoria">${res.bitacora.map((it) => `<div class="paso-calculo"><strong>Iteración ${it.iteracion}: ${esc(it.depto)}</strong><br>${esc(it.criterio)}<br>Posición: <code>${it.posicion}</code> · PR = <strong>${it.pr}</strong></div>`).join('')}</div>`)
      + guerchet;
  }
}

function renderizarDiagramas() {
  const m = Nav.metodo, res = Estado.resultados[m];
  const cont = $('contenedor-diagramas');
  if (graficaAreas) { graficaAreas.destroy(); graficaAreas = null; }
  if (!res) return;
  const diagrama = (id, titulo, svg, pie) => tarjetaHTML(titulo, `<div class="diagrama">${svg}</div><p class="texto-ayuda">${pie}</p>`, id);
  const areas = tarjetaHTML('Superficies por departamento (Se, Sg, Sv)', '<div class="grafica"><canvas id="grafica-areas"></canvas></div><p class="texto-ayuda">Compara el espacio de los equipos con las holguras de operación.</p>', 'diag-areas');
  cont.innerHTML = m === 'eldep'
    ? diagrama('diag-principal', 'Diagrama de flujo de materiales', svgGrafo(res), 'La flecha indica el sentido; el grosor y el número, la intensidad.') + areas
    : diagrama('diag-principal', 'Diagrama de relaciones', svgGrafo(res), 'A = 4 líneas, E = 3, I = 2, O = 1. Línea morada discontinua = X.') + diagrama('diag-bloques', 'Bloques unitarios', svgBloquesUnitarios(res), 'El número indica el orden de colocación desde el núcleo.') + areas;

  if (typeof Chart === 'undefined') { $('grafica-areas').parentElement.textContent = 'No se pudo cargar la librería de gráficas (revise su conexión a internet).'; return; }
  graficaAreas = new Chart($('grafica-areas'), {
    type: 'bar',
    data: { labels: res.calculados.map((d) => d.codigo), datasets: [['Se', '#3b82f6'], ['Sg', '#22d3ee'], ['Sv', '#f59e0b']].map(([k, c]) => ({ label: k, data: res.calculados.map((d) => d.areas[k]), backgroundColor: c })) },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { stacked: true, ticks: { color: '#9aa8bb' } }, y: { stacked: true, ticks: { color: '#9aa8bb' } } } }
  });
}

const opcionesPlano = () => ({ cotas: $('chk-cotas').checked, pasillos: $('chk-pasillos').checked, flujos: $('chk-flujos').checked });

function renderizarVisualizacion() {
  const res = Estado.resultados[Nav.metodo];
  if (!res) return;
  const u = Estado.general.unidad;
  dibujarPlano($('canvas-plano'), res, opcionesPlano());
  $('leyenda-plano').innerHTML = res.bloques.map((b) => `<span><i class="punto-color" style="background:${esc(b.color)}"></i><strong>${esc(b.codigo)}:</strong> ${esc(b.nombre)} (${b.areaAsignada} ${u}²)</span>`).join('');
  $('verificacion').innerHTML = tablaHTML(['Indicador', 'Resultado'], filasIndicadores(res))
    + (res.avisos.length ? `<div class="nota" style="margin-top:12px"><strong>Puntos por revisar:</strong><br>${res.avisos.map((a) => `⚠ ${esc(a)}`).join('<br>')}</div>` : '<div class="nota" style="margin-top:12px">✔ No se detectaron incumplimientos en las restricciones evaluadas.</div>');
}

function filasIndicadores(res) {
  const u = Estado.general.unidad;
  return [
    ['Área requerida / disponible', `${res.requerida} / ${res.disponible} ${u}² (${res.ocupacion}%)`],
    [`Carga–distancia Z (cargas·${u})`, res.z],
    ['Pares A/E con borde compartido', `${res.aeOk} de ${res.aeTotal}`],
    ['Pares X con borde compartido', res.conflictosX],
    ['Puntos por revisar', res.avisos.length]
  ];
}

function renderizarComparacion() {
  const cont = $('comparacion');
  const errores = ['eldep', 'corelap'].map((m) => (Estado.resultados[m] ? '' : calcular(m)));
  const { eldep, corelap } = Estado.resultados;
  $('btn-pdf-comparativo').disabled = !(eldep && corelap);
  if (!eldep || !corelap) { cont.innerHTML = `<p class="nota">${esc(errores.find(Boolean))}</p>`; return; }
  const a = filasIndicadores(eldep), b = filasIndicadores(corelap);
  cont.innerHTML = tablaHTML(['Criterio', 'ELDEP', 'CORELAP'], a.map((f, i) => [f[0], f[1], b[i][1]]))
    + '<div class="nota" style="margin-top:12px">Ambos se miden con el mismo criterio sobre su plano final. Un Z menor favorece el manejo de materiales; más pares A/E contiguos y menos pares X favorecen las relaciones cualitativas. Si los flujos o la matriz REL están incompletos, la comparación no es concluyente.</div>';
}

/* ============================================================================
   7. INFORME PDF HORIZONTAL
   ============================================================================ */
function svgAImagen(svg) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 960; c.height = 720;
      c.getContext('2d').drawImage(img, 0, 0, 960, 720);
      ok(c.toDataURL('image/png'));
    };
    img.onerror = mal;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

// La fuente estándar del PDF no incluye algunos símbolos
const limpio = (t) => String(t).replace(/[ᵢⱼ]/g, '').replace(/₁/g, '1').replace(/₂/g, '2').replace(/Σ/g, 'Suma ').replace(/α/g, 'alfa').replace(/−/g, '-').replace(/—/g, '-');

async function generarPDF(metodos) {
  if (!window.jspdf) { avisar('La librería PDF no se ha cargado. Revise su conexión a internet.', true); return; }
  for (const m of metodos) {
    if (!Estado.resultados[m]) { const e = calcular(m); if (e) { avisar(e, true); return; } }
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const g = Estado.general, u = g.unidad;
  const deps = conAreas();
  const cod = (id) => deps.find((d) => d.id === id).codigo;
  let y = 0;
  const pagina = (titulo) => { doc.addPage('a4', 'landscape'); doc.setTextColor(15, 23, 42); doc.setFontSize(15); doc.text(limpio(titulo), 14, 17); y = 24; };
  const tabla = (titulo, head, body) => {
    if (y > 170) pagina(titulo + ' (continuación)');
    doc.setFontSize(11); doc.setTextColor(30, 58, 138); doc.text(limpio(titulo), 14, y);
    doc.autoTable({ startY: y + 3, head: [head.map(limpio)], body: body.map((f) => f.map(limpio)), theme: 'grid', headStyles: { fillColor: [30, 58, 138] }, styles: { fontSize: 8.5 }, margin: { left: 14, right: 14 } });
    y = doc.lastAutoTable.finalY + 10;
  };

  // Portada
  doc.setFillColor(15, 23, 42); doc.rect(0, 0, 297, 210, 'F');
  doc.setFillColor(37, 99, 235); doc.rect(0, 0, 12, 210, 'F');
  doc.setTextColor(56, 189, 248); doc.setFontSize(14); doc.text('ALPHA BLOCK · INGENIERÍA DE INSTALACIONES', 28, 40);
  doc.setTextColor(255, 255, 255); doc.setFontSize(25); doc.text('INFORME TÉCNICO DE DISTRIBUCIÓN DE PLANTA', 28, 62);
  doc.setFontSize(14);
  doc.text([`Proyecto: ${g.nombre}`, `Método(s): ${metodos.map((m) => m.toUpperCase()).join(' y ')}`, `Nave: ${g.largoPlanta} × ${g.anchoPlanta} ${u}   ·   K = ${g.coeficienteK}   ·   Pasillo: ${g.anchoPasillo} ${u}`, `Fecha: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`], 28, 84, { lineHeightFactor: 1.8 });
  doc.setFontSize(10); doc.text(g.descripcion || '', 28, 135, { maxWidth: 240 });
  doc.text('Proyecto creado por YEPJ', 28, 190);

  pagina('1. Datos de entrada');
  tabla('Departamentos', ['ID', 'Nombre', 'Actividad', 'Trabajadores', 'Ubicación', 'Prop. máx.'], deps.map((d) => [d.codigo, d.nombre, d.actividad, d.trabajadores, d.zonaFija, `${d.relacionMax}:1`]));
  tabla('Maquinaria y equipos', ['Depto.', 'Equipo', 'Cantidad', `Largo (${u})`, `Ancho (${u})`, 'Lados N'], deps.flatMap((d) => d.equipos.map((e) => [d.codigo, e.nombre, e.cantidad, e.largo, e.ancho, e.lados])));
  if (Estado.obstaculos.length) tabla('Elementos fijos', ['Tipo', 'Nombre', 'X', 'Y', 'Largo', 'Ancho'], Estado.obstaculos.map((o) => [o.tipo, o.nombre, o.x, o.y, o.largo, o.ancho]));

  pagina('2. Superficies por el método de Guerchet');
  tabla('Resultados', ['ID', 'Se', 'Sg', 'Sv', 'Almacén', `ST (${u}²)`], deps.map((d) => [d.codigo, d.areas.Se, d.areas.Sg, d.areas.Sv, d.areas.almacen, d.areas.ST]));
  tabla('Sustitución', ['ID', 'Evolución', 'Área total'], deps.map((d) => [d.codigo, `Sv = (${d.areas.Se} + ${d.areas.Sg}) × ${g.coeficienteK} = ${d.areas.Sv}`, `ST = ${d.areas.Se} + ${d.areas.Sg} + ${d.areas.Sv} + ${d.areas.almacen} = ${d.areas.ST}`]));

  let sec = 3;
  for (const m of metodos) {
    const res = Estado.resultados[m], M = m.toUpperCase();
    pagina(`${sec++}. Método ${M}: fórmulas y cálculos`);
    tabla('Fórmulas', ['Concepto', 'Expresión', 'Criterio'], FORMULAS[m]);
    if (m === 'eldep') {
      tabla('Matriz Desde-Hacia', ['Desde / Hacia', ...deps.map((d) => d.codigo)], deps.map((a) => [a.codigo, ...deps.map((b) => (a.id === b.id ? '-' : obtenerFlujo(a.id, b.id)))]));
      tabla(`Secuencia por cadena de flujo (${res.alternativas} alternativas evaluadas)`, ['Orden', 'Departamento', 'Salidas', 'Entradas', 'Flujo total'], res.secuencia.map((d) => [d.orden, d.codigo, d.salida, d.entrada, d.flujoTotal]));
      tabla(`Carga-distancia (Z = ${res.z})`, ['Origen', 'Destino', 'f', 'd', 'f × d'], res.pares.map((p) => [p.de, p.a, p.f, p.d, p.fd]));
    } else {
      tabla('Escala de valores', CODIGOS, [CODIGOS.map((c) => Estado.pesosREL[c])]);
      tabla('Matriz REL', ['Depto.', ...deps.map((d) => d.codigo)], deps.map((a) => [cod(a.id), ...deps.map((b) => (a.id === b.id ? '-' : obtenerREL(a.id, b.id)))]));
      tabla('TCR', ['Departamento', ...CODIGOS, 'TCR'], res.calculados.map((d) => [d.codigo, ...CODIGOS.map((c) => d.conteo[c]), d.tcr]));
      tabla('Iteraciones', ['#', 'Departamento', 'Criterio', 'Posición', 'PR'], res.bitacora.map((i) => [i.iteracion, i.depto, i.criterio, i.posicion, i.pr]));
    }

    pagina(`${sec++}. Método ${M}: diagramas`);
    const imagenes = [await svgAImagen(svgGrafo(res))];
    if (m === 'corelap') imagenes.push(await svgAImagen(svgBloquesUnitarios(res)));
    imagenes.forEach((img, i) => doc.addImage(img, 'PNG', 14 + i * 137, 26, 132, 99));
    // Gráfica de superficies dibujada en vectores
    const maxA = Math.max(...res.calculados.map((d) => d.areas.Se + d.areas.Sg + d.areas.Sv));
    const gx = m === 'eldep' ? 156 : 40, gy = m === 'eldep' ? 40 : 138;
    const alto = Math.min(m === 'eldep' ? 9 : 6, 60 / res.calculados.length), ancho = m === 'eldep' ? 108 : 220;
    doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.text('Superficies: Se (azul), Sg (cian), Sv (ámbar)', gx, gy - 7);
    res.calculados.forEach((d, i) => {
      let x = gx + 14;
      const fy = gy + i * (alto + 1.5);
      doc.setFontSize(Math.min(8, alto * 2.4)); doc.text(d.codigo, gx, fy + alto * 0.75);
      [['Se', [59, 130, 246]], ['Sg', [34, 190, 220]], ['Sv', [245, 158, 11]]].forEach(([k, c]) => {
        const w = d.areas[k] / maxA * ancho;
        doc.setFillColor(...c); doc.rect(x, fy, w, alto, 'F'); x += w;
      });
      doc.text(String(r2(d.areas.Se + d.areas.Sg + d.areas.Sv)), x + 2, fy + alto * 0.75);
    });

    pagina(`${sec++}. Método ${M}: plano de distribución`);
    const lienzo = document.createElement('canvas');
    lienzo.width = 1800; lienzo.height = 1200;
    const base = document.createElement('canvas');
    base.width = 1200; base.height = 800;
    dibujarPlano(base, res, m === metodos[0] && metodos.length === 1 ? opcionesPlano() : undefined);
    lienzo.getContext('2d').drawImage(base, 0, 0, 1800, 1200);
    doc.addImage(lienzo.toDataURL('image/jpeg', 0.92), 'JPEG', 31, 22, 235, 156.7);
    doc.setFontSize(8); doc.setTextColor(15, 23, 42);
    doc.text(res.bloques.map((b) => `${b.codigo}: ${b.nombre} (${b.areaAsignada} ${u}²)`).join('   |   '), 14, 186, { maxWidth: 270 });

    pagina(`${sec++}. Método ${M}: dimensiones y verificación`);
    tabla('Dimensiones y coordenadas', ['ID', 'X', 'Y', 'Largo', 'Ancho', 'Área asignada', 'Área requerida'], res.bloques.map((b) => [b.codigo, r2(b.x), r2(b.y), r2(b.largo), r2(b.ancho), b.areaAsignada, b.areaRequerida]));
    tabla('Indicadores', ['Indicador', 'Resultado'], filasIndicadores(res));
    tabla('Puntos por revisar', ['Observación'], (res.avisos.length ? res.avisos : ['Sin incumplimientos detectados en las restricciones evaluadas.']).map((a) => [a]));
  }

  if (metodos.length === 2) {
    pagina(`${sec}. Comparación ELDEP vs. CORELAP`);
    const a = filasIndicadores(Estado.resultados.eldep), b = filasIndicadores(Estado.resultados.corelap);
    tabla('Indicadores medidos con el mismo criterio', ['Criterio', 'ELDEP', 'CORELAP'], a.map((f, i) => [f[0], f[1], b[i][1]]));
  }

  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) { doc.setPage(p); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`ALPHA BLOCK · Proyecto creado por YEPJ · Página ${p} de ${total}`, 283, 203, { align: 'right' }); }
  doc.save(`Informe_ALPHA_BLOCK_${metodos.join('_').toUpperCase()}_${g.nombre.replace(/[^\wáéíóúñ]+/gi, '_')}.pdf`);
  audio.efecto('completado');
}

/* ============================================================================
   8. PERSONAJE, TEXTO ANIMADO Y GUIONES
   ============================================================================ */
const SVG_RESPALDO = '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="9" y="2" width="14" height="7" fill="#fbbf24"/><rect x="9" y="9" width="14" height="8" fill="#fed7aa"/><rect x="11" y="11" width="2" height="2" fill="#1e293b"/><rect x="19" y="11" width="2" height="2" fill="#1e293b"/><rect x="7" y="17" width="18" height="10" fill="#1e3a8a"/><rect x="14" y="17" width="4" height="10" fill="#f8fafc"/><rect x="9" y="27" width="5" height="5" fill="#0f172a"/><rect x="18" y="27" width="5" height="5" fill="#0f172a"/></svg>';

function prepararPersonajes() {
  $$('[data-personaje]').forEach((caja) => {
    const img = new Image();
    img.alt = 'Ingeniera industrial en pixel art';
    img.addEventListener('error', () => { caja.innerHTML = SVG_RESPALDO; });
    img.src = IMAGENES.explicando;   // el GIF de explicación se anima solo
    caja.appendChild(img);
  });
}

function posePersonaje(hablando) {
  $$('[data-personaje]').forEach((caja) => caja.classList.toggle('hablando', hablando));
}

/* Escena de acción: GIF grande de la ingeniera mientras calcula o imprime */
const ACCIONES = {
  calculando: { gif: IMAGENES.calculando, texto: 'Realizando los cálculos…' },
  imprimiendo: { gif: IMAGENES.imprimiendo, texto: 'Imprimiendo el diseño…' }
};
const pausa = (ms) => new Promise((ok) => setTimeout(ok, ms));

function mostrarAccion(tipo) {
  const { gif, texto } = ACCIONES[tipo];
  const caja = $('personaje-accion');
  caja.innerHTML = '';
  const img = new Image();
  img.alt = texto;
  img.addEventListener('error', () => { caja.innerHTML = SVG_RESPALDO; });
  img.src = gif;
  caja.appendChild(img);
  $('texto-accion').textContent = texto;
  $('escena-accion').classList.remove('oculto');
}
const ocultarAccion = () => $('escena-accion').classList.add('oculto');

/** Muestra el GIF, hace el trabajo y lo mantiene un mínimo de tiempo para que se alcance a ver. */
async function conAccion(tipo, trabajo, minimo = 2200) {
  mostrarAccion(tipo);
  await pausa(80);   // deja que el GIF se pinte antes del trabajo pesado
  const inicio = performance.now();
  try { return await trabajo(); }
  finally {
    const resto = minimo - (performance.now() - inicio);
    if (resto > 0) await pausa(resto);
    ocultarAccion();
  }
}

const escritura = { id: null, completar: null };
function escribir(elemento, texto) {
  clearInterval(escritura.id);
  let i = 0;
  elemento.textContent = '';
  posePersonaje(true);
  escritura.completar = () => { clearInterval(escritura.id); elemento.textContent = texto; escritura.completar = null; posePersonaje(false); };
  escritura.id = setInterval(() => {
    i += 2;
    elemento.textContent = texto.slice(0, i);
    if (i >= texto.length) escritura.completar();
  }, 22);
}

const TUTORIAL = [
  { titulo: '¡Hola! Seré tu guía', texto: 'Soy ingeniera industrial. Antes de entrar te explicaré qué hacemos en esta profesión y para qué sirve ALPHA BLOCK.', fichas: [] },
  { titulo: '¿Qué hace un ingeniero industrial?', texto: 'Diseña, mejora e integra sistemas donde participan personas, materiales, equipos, información y energía. La meta es producir con calidad, seguridad y sin desperdicios.', fichas: [['⏱️', 'Métodos y tiempos'], ['📦', 'Logística y producción'], ['✅', 'Calidad y mejora'], ['🦺', 'Ergonomía y seguridad']] },
  { titulo: 'Planeación de instalaciones', texto: 'Una de nuestras funciones es decidir dónde va cada área, máquina y pasillo. Una buena distribución de planta reduce recorridos, evita cruces y aprovecha el espacio.', fichas: [['↔️', 'Menos transporte'], ['📐', 'Mejor uso del área'], ['🚧', 'Operación segura']] },
  { titulo: '¿Para qué sirve ALPHA BLOCK?', texto: 'Te ayuda a calcular superficies, generar una propuesta de layout, ver sus diagramas y descargar un informe PDF. La propuesta es un punto de partida que debe validarse en la planta real.', fichas: [['1', 'Capturas datos'], ['2', 'Calculas'], ['3', 'Ves diagramas'], ['4', 'Visualizas e imprimes']] },
  { titulo: 'Dos caminos de diseño', texto: 'En esta aplicación, ELDEP parte de superficies y flujo de materiales (cuantitativo). CORELAP usa relaciones de cercanía entre áreas (A, E, I, O, U, X).', fichas: [['▤', 'ELDEP: flujo y distancia'], ['⬡', 'CORELAP: relaciones y TCR']] },
  { titulo: '¡Listo para comenzar!', texto: 'Ahora entrarás al menú. La primera vez explicaré cada apartado mientras llenas los datos. Cuando quieras repetirlo, toca Explícame, el botón Guía o mi figura en la esquina.', fichas: [] }
];
let indiceTutorial = 0;

function mostrarTutorial(i) {
  indiceTutorial = i;
  const t = TUTORIAL[i];
  $('tutorial-titulo').textContent = t.titulo;
  $('tutorial-visual').innerHTML = t.fichas.map(([a, b]) => `<div class="ficha"><b>${a}</b><span>${b}</span></div>`).join('');
  $('tutorial-puntos').innerHTML = TUTORIAL.map((_, k) => `<i class="${k === i ? 'activo' : ''}"></i>`).join('');
  $('btn-tutorial-atras').disabled = i === 0;
  $('btn-tutorial-sig').textContent = i === TUTORIAL.length - 1 ? 'Ir al menú ›' : 'Siguiente ›';
  escribir($('tutorial-texto'), t.texto);
}

// Una explicación por apartado: id del elemento -> [título, texto].
// "id@eldep" o "id@corelap" se usa cuando el texto cambia según el método.
const EXPLICACIONES = {
  'tarjeta-nave': ['Datos de la nave', 'Escribe el nombre del proyecto, el largo y el ancho de la nave. Elige el tipo de trabajo que más se parezca al tuyo y, si quieres, el ancho del pasillo. Es todo lo que necesito; yo te espero.'],
  'tarjeta-depto': ['Departamentos', 'Solo escribe el nombre del departamento, cuántos trabajadores tiene y cuánto espacio necesita para almacenar. El código y el color se asignan solos. Presiona Guardar departamento al terminar.'],
  'subpanel-equipos': ['Maquinaria', 'Es opcional. Añade cada equipo con su nombre, cantidad, largo y ancho, y presiona Añadir. Si no agregas ninguno, se crea una estación básica de 1.8 × 1.2 por trabajador.'],
  'tarjeta-lista-deptos': ['Departamentos registrados', 'Aquí revisas lo capturado. Con Editar corriges un departamento y con Eliminar lo quitas. Necesitas al menos dos para calcular.'],
  'tarjeta-obstaculos': ['Elementos fijos', 'Es opcional. Elige si es un acceso, una columna o una zona de seguridad, ponle nombre y dime en qué pared está. Yo calculo la posición y el tamaño.'],
  'tarjeta-anclaje': ['Anclaje y proporción', 'Indica si un área prefiere un borde y qué tan alargada puede ser. También es opcional.'],
  'tarjeta-flujo': ['Matriz Desde–Hacia', 'Escribe cuántas cargas viajan de cada origen (fila) a cada destino (columna). Deja en cero donde no haya movimiento.'],
  'tarjeta-escala': ['Niveles de cercanía', 'Cada nivel ya trae un valor listo para usar. Si no lo necesitas, déjalo como está.'],
  'tarjeta-rel': ['Matriz REL', 'Elige qué tan cerca deben estar dos departamentos: Indispensable significa pegados y Evitar significa separarlos.'],
  'tarjeta-formulas@eldep': ['Fórmulas ELDEP', 'Con Guerchet obtenemos las superficies y con la función carga–distancia medimos el recorrido total Z.'],
  'tarjeta-formulas@corelap': ['Fórmulas CORELAP', 'El TCR decide a quién colocar primero y la calificación PR decide en qué posición.'],
  'tarjeta-calcular': ['Calcular', 'Cuando tus datos estén listos, presiona el botón. Si falta algo, aquí te diré qué es.'],
  'resultados-calculo@eldep': ['Resultados ELDEP', 'Revisa la sustitución de valores, la secuencia por flujo y la tabla carga–distancia. A menor Z, menos recorrido.'],
  'resultados-calculo@corelap': ['Resultados CORELAP', 'Revisa el TCR de cada área, cada iteración de colocación y la memoria de superficies.'],
  'diag-principal@eldep': ['Flujo de materiales', 'Las flechas muestran origen, destino e intensidad. Los flujos grandes deberían quedar a menor distancia.'],
  'diag-principal@corelap': ['Diagrama de relaciones', 'Más líneas significan mayor necesidad de cercanía. La línea discontinua indica una relación X.'],
  'diag-bloques': ['Bloques unitarios', 'Muestra cómo creció la distribución desde el departamento núcleo.'],
  'diag-areas': ['Superficies', 'La gráfica compara Se, Sg y Sv. Estas áreas determinan el tamaño de cada bloque.'],
  'tarjeta-plano': ['El plano', 'Esta es la propuesta a escala. Puedes activar o quitar las cotas, los pasillos y los flujos o relaciones.'],
  'tarjeta-verificacion': ['Verificación', 'Antes de aceptar el diseño revisa qué restricciones no se cumplen. El algoritmo propone y tú validas.'],
  'tarjeta-exportar': ['Informe PDF', 'Descarga el informe con datos, cálculos, diagramas y plano. También puedes guardar el plano como imagen.'],
  'opciones-lista': ['Opciones', 'Aquí ajustas el sonido, administras el proyecto, auditas un plano existente y comparas los métodos. Elige un bloque.'],
  'tarjeta-sonido': ['Sonido', 'Activa o desactiva la música y los efectos, y ajusta el volumen.'],
  'tarjeta-proyecto': ['Proyecto', 'Guarda tu trabajo, carga el caso ejemplo o inicia en blanco. También puedes reiniciar mis explicaciones automáticas.'],
  'tarjeta-importar': ['Importar plano', 'Carga una imagen de tu planta, escribe sus medidas reales y anota los problemas que observes.'],
  'tarjeta-comparar': ['Comparación', 'Los dos métodos se miden con el mismo criterio. También puedes descargar el informe completo.']
};

const CLAVE_VISTAS = 'alphablock_explicaciones_vistas';
const guia = { ids: [], i: 0 };
const vistas = () => memoria.leer(CLAVE_VISTAS) || {};
const claveExplicacion = (id) => (EXPLICACIONES[`${id}@${Nav.metodo}`] ? `${id}@${Nav.metodo}` : id);
const guiaAbierta = () => !$('guia').classList.contains('oculto');
const enPantallaConGuia = () => Nav.pantalla === 'metodo' || Nav.pantalla === 'opciones';

/** Apartados que están a la vista en este momento. */
function idsDeLaVista() {
  let ids;
  if (Nav.pantalla === 'opciones') {
    ids = [Nav.opcion === 'inicio' ? 'opciones-lista' : `tarjeta-${Nav.opcion}`];
  } else if (Nav.paso === 0) {
    ids = {
      nave: ['tarjeta-nave'],
      deptos: ['tarjeta-depto', 'subpanel-equipos', 'tarjeta-lista-deptos'],
      restricciones: ['tarjeta-obstaculos', 'tarjeta-anclaje'],
      matriz: Nav.metodo === 'eldep' ? ['tarjeta-flujo'] : ['tarjeta-escala', 'tarjeta-rel']
    }[Nav.sub];
  } else {
    ids = [
      ['tarjeta-formulas', 'tarjeta-calcular', 'resultados-calculo'],
      ['diag-principal', 'diag-bloques', 'diag-areas'],
      ['tarjeta-plano', 'tarjeta-verificacion', 'tarjeta-exportar']
    ][Nav.paso - 1];
  }
  return ids.filter((id) => $(id) && $(id).childElementCount > 0);
}

/** Función que lleva al siguiente apartado, o null si no hay (o está bloqueado). */
function siguienteApartado() {
  if (Nav.pantalla !== 'metodo') return null;
  if (Nav.paso === 0 && Nav.sub !== 'matriz') return () => activarSub(SUBS[SUBS.indexOf(Nav.sub) + 1]);
  if (Nav.paso === 3 || (Nav.paso === 1 && !Estado.resultados[Nav.metodo])) return null;
  return () => irPaso(Nav.paso + 1);
}

/**
 * Sin argumentos: explica solo lo que aún no se ha visto.
 * { forzar: true }: repite la vista completa.  { desde: id }: empieza en ese apartado.
 */
function abrirGuia({ forzar = false, desde = null } = {}) {
  cerrarGuia();
  if (!enPantallaConGuia()) return;
  const ids = idsDeLaVista();
  let i = desde ? ids.indexOf(desde) : 0;
  if (!desde && !forzar) i = ids.findIndex((id) => !vistas()[claveExplicacion(id)]);
  if (!ids.length || i < 0) return;
  guia.ids = ids;
  guia.i = i;
  $('guia').classList.remove('oculto');
  $('btn-llamar-guia').classList.add('oculto');
  document.body.classList.add('guia-abierta');
  mostrarPasoGuia();
}

function mostrarPasoGuia() {
  const id = guia.ids[guia.i];
  const clave = claveExplicacion(id);
  const [titulo, texto] = EXPLICACIONES[clave];
  const v = vistas();
  v[clave] = true;
  memoria.guardar(CLAVE_VISTAS, v);

  $$('.resaltado').forEach((e) => e.classList.remove('resaltado'));
  const el = $(id);
  el.classList.add('resaltado');
  // Se espera un instante a que el contenido se acomode junto a la guía
  requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  const ultimo = guia.i === guia.ids.length - 1;
  $('guia-titulo').textContent = titulo;
  $('guia-contador').textContent = `Explicación ${guia.i + 1} de ${guia.ids.length}`;
  $('btn-guia-atras').disabled = guia.i === 0;
  $('btn-guia-sig').textContent = !ultimo ? 'Siguiente ›' : siguienteApartado() ? 'Siguiente apartado ›' : 'Entendido ✓';
  escribir($('guia-texto'), texto);
}

function avanzarGuia() {
  if (guia.i < guia.ids.length - 1) { guia.i++; mostrarPasoGuia(); return; }
  const ir = siguienteApartado();
  cerrarGuia();
  if (!ir) return;
  ir();
  window.scrollTo(0, 0);
  abrirGuia({ forzar: true });
}

function cerrarGuia() {
  const abierta = guiaAbierta();
  $('guia').classList.add('oculto');
  $('guia').classList.remove('escribiendo');
  $('btn-llamar-guia').classList.toggle('oculto', !enPantallaConGuia());
  document.body.classList.remove('guia-abierta');
  $$('.resaltado').forEach((e) => e.classList.remove('resaltado'));
  if (abierta) { clearInterval(escritura.id); posePersonaje(false); }
}

/** Agrega el botón "Explícame" a cada apartado. */
function ponerBotonesExplicar() {
  const ids = new Set(Object.keys(EXPLICACIONES).map((k) => k.split('@')[0]));
  ids.delete('opciones-lista');
  ids.forEach((id) => {
    const el = $(id);
    if (!el || !el.childElementCount || el.querySelector(':scope > .btn-explicar')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-explicar';
    b.dataset.explicar = id;
    b.textContent = '👷 Explícame';
    const encabezado = el.querySelector(':scope > h3, :scope > legend');
    if (encabezado) encabezado.after(b);
    else el.prepend(b);
  });
}

/* ============================================================================
   9. NAVEGACIÓN ENTRE PANTALLAS
   ============================================================================ */
function mostrarPantalla(nombre) {
  clearInterval(escritura.id);
  Nav.pantalla = nombre;
  cerrarGuia();
  $$('.pantalla').forEach((p) => p.classList.toggle('activa', p.id === `pantalla-${nombre}`));
  window.scrollTo(0, 0);
}

let temporizadorIntro = null;
function iniciarIntro() {
  const cont = $('letras-alpha-block');
  let i = 0;
  cont.innerHTML = ['ALPHA', 'BLOCK'].map((palabra, p) => `<div class="palabra${p ? ' acento' : ''}">${[...palabra].map((l) => {
    const k = i++;
    return `<span class="letra" style="--i:${k};--dx:${(k - 4.5) * 38}px;--dy:${k % 2 ? 240 : -240}px;--giro:${k % 2 ? 35 : -35}deg">${l}</span>`;
  }).join('')}</div>`).join('');
  mostrarPantalla('intro');
  audio.introduccion();
  temporizadorIntro = setTimeout(() => {
    $('pantalla-intro').classList.add('saliendo');
    temporizadorIntro = setTimeout(irTutorial, 500);
  }, 4000);
}

function irTutorial() {
  clearTimeout(temporizadorIntro);
  mostrarPantalla('tutorial');
  audio.cambiarApartado('tutorial');
  mostrarTutorial(0);
}

function irMenu() {
  mostrarPantalla('menu');
  audio.cambiarApartado('menu');
}

function irMetodo(metodo) {
  Nav.metodo = metodo;
  limpiarFormularioDepto();
  mostrarPantalla('metodo');
  audio.cambiarApartado(`ambiente_${metodo}`);
  $('metodo-titulo').textContent = `Método ${metodo.toUpperCase()}`;
  $$('.solo-eldep').forEach((e) => e.classList.toggle('oculto', metodo !== 'eldep'));
  $$('.solo-corelap').forEach((e) => e.classList.toggle('oculto', metodo !== 'corelap'));
  $('subtab-matriz').textContent = metodo === 'eldep' ? 'D. Matriz de flujo' : 'D. Matriz REL';
  renderizarDatos();
  activarSub('nave');
  irPaso(0);
}

function activarSub(sub) {
  Nav.sub = sub;
  $$('.subtab').forEach((b) => b.classList.toggle('activo', b.dataset.sub === sub));
  $$('.subvista').forEach((v) => v.classList.toggle('activa', v.dataset.subvista === sub));
  actualizarNavegacion();
}

const SUBS = ['nave', 'deptos', 'restricciones', 'matriz'];

function actualizarNavegacion() {
  const listo = !!Estado.resultados[Nav.metodo];
  $$('.paso').forEach((b) => {
    const p = Number(b.dataset.paso);
    b.classList.toggle('activo', p === Nav.paso);
    b.disabled = p >= 2 && !listo;
  });
  const sig = $('btn-paso-sig');
  sig.classList.toggle('oculto', Nav.paso === 3);
  sig.disabled = Nav.paso === 1 && !listo;
  sig.textContent = Nav.paso === 0 && Nav.sub !== 'matriz' ? 'Siguiente sección ›' : ['Ir al cálculo ›', 'Ver diagramas ›', 'Ver plano ›', ''][Nav.paso];
}

function irPaso(p) {
  if (p >= 2 && !Estado.resultados[Nav.metodo]) return;
  cerrarGuia();
  Nav.paso = p;
  $$('.vista-paso').forEach((v) => v.classList.toggle('activa', Number(v.dataset.vista) === p));
  if (p === 1) renderizarCalculo();
  if (p === 2) renderizarDiagramas();
  if (p === 3) renderizarVisualizacion();
  actualizarNavegacion();
  ponerBotonesExplicar();
  window.scrollTo(0, 0);
  abrirGuia();
}

/** Cambio manual de pestaña: la guía explica el apartado nuevo si es la primera vez. */
function cambiarSub(sub) {
  activarSub(sub);
  window.scrollTo(0, 0);
  abrirGuia();
}

/** "Volver" regresa exactamente al nivel anterior. */
function volverEnMetodo() {
  if (Nav.paso > 0) irPaso(Nav.paso - 1);
  else if (Nav.sub !== 'nave') cambiarSub(SUBS[SUBS.indexOf(Nav.sub) - 1]);
  else irMenu();
}

function mostrarOpcion(clave) {
  cerrarGuia();
  Nav.opcion = clave;
  $$('.opcion-vista').forEach((v) => v.classList.toggle('activa', v.dataset.opvista === clave));
  $('opciones-titulo').textContent = { inicio: 'Opciones', sonido: 'Opciones · Sonido', proyecto: 'Opciones · Proyecto', importar: 'Opciones · Importar plano', comparar: 'Opciones · Comparar métodos' }[clave];
  if (clave === 'comparar') renderizarComparacion();
  if (clave === 'importar') analizarImportado();
  ponerBotonesExplicar();
  window.scrollTo(0, 0);
  abrirGuia();
}

function irOpciones() {
  mostrarPantalla('opciones');
  audio.cambiarApartado('menu');
  renderizarDatos();
  mostrarOpcion('inicio');
}

function analizarImportado() {
  const img = $('img-layout-importado'), caja = $('analisis-importado');
  if (img.classList.contains('oculto')) return;
  const a = parseFloat($('imp-ancho').value) || 0, h = parseFloat($('imp-alto').value) || 0, u = Estado.general.unidad;
  const req = areaRequerida(), dif = r2(a * h - req);
  caja.classList.remove('oculto');
  caja.innerHTML = `<strong>Auditoría dimensional (según la escala capturada)</strong><br>Superficie del plano: ${r2(a * h)} ${u}²<br>Superficie requerida (Guerchet): ${req} ${u}²<br>Balance: <strong>${dif >= 0 ? 'superávit' : 'déficit'} de ${Math.abs(dif)} ${u}²</strong><br>Observaciones: ${esc($('imp-obs').value.trim() || 'Sin observaciones.')}`;
}

/* ============================================================================
   10. EVENTOS
   ============================================================================ */
const PALETA = ['#2563eb', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777', '#65a30d', '#dc2626', '#0d9488', '#4f46e5'];
const colorAutomatico = () => { const usados = new Set(Estado.departamentos.map((d) => d.color)); return PALETA.find((c) => !usados.has(c)) || PALETA[Estado.departamentos.length % PALETA.length]; };
function codigoAutomatico(nombre) {
  const limpio = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const base = (limpio.slice(0, 3) || 'DEP').padEnd(3, 'X');
  let cod = base, n = 2;
  while (Estado.departamentos.some((d) => d.codigo === cod)) cod = base + n++;
  return cod;
}
/** Convierte "tipo + pared" en coordenadas: el usuario no escribe X, Y ni medidas. */
const TAMANO_OBSTACULO = { acceso: [3, 1], columna: [1, 1], seguridad: [3, 3] };
function crearObstaculo(tipo, nombre, ubicacion) {
  const { largoPlanta: L, anchoPlanta: W } = Estado.general;
  const [lado, grueso] = TAMANO_OBSTACULO[tipo].map((v) => Math.min(v, L, W));
  const p = {
    norte: [(L - lado) / 2, 0, lado, grueso], sur: [(L - lado) / 2, W - grueso, lado, grueso],
    oeste: [0, (W - lado) / 2, grueso, lado], este: [L - grueso, (W - lado) / 2, grueso, lado],
    centro: [(L - lado) / 2, (W - grueso) / 2, lado, grueso]
  }[ubicacion];
  return { id: `obs_${Date.now()}`, tipo, nombre, ubicacion, x: r2(p[0]), y: r2(p[1]), largo: r2(p[2]), ancho: r2(p[3]) };
}

function configurarEventos() {
  const clic = (id, fn) => $(id).addEventListener('click', fn);

  // Sonido genérico en fase de captura: un sonido específico posterior lo reemplaza
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && !['btn-empezar-app', 'btn-saltar-intro'].includes(b.id)) audio.efecto('boton');
  }, true);

  clic('btn-empezar-app', iniciarIntro);
  clic('btn-saltar-intro', irTutorial);
  clic('btn-tutorial-atras', () => mostrarTutorial(indiceTutorial - 1));
  clic('btn-tutorial-sig', () => (indiceTutorial < TUTORIAL.length - 1 ? mostrarTutorial(indiceTutorial + 1) : irMenu()));
  clic('btn-tutorial-saltar', irMenu);
  ['tutorial-texto', 'guia-texto'].forEach((id) => clic(id, () => escritura.completar && escritura.completar()));

  clic('btn-menu-volver', irTutorial);
  $$('#pantalla-menu .bloque-menu').forEach((b) => b.addEventListener('click', () => (b.dataset.opcion === 'opciones' ? irOpciones() : irMetodo(b.dataset.opcion))));   // abre directo

  clic('btn-metodo-volver', volverEnMetodo);
  clic('btn-ir-menu', irMenu);
  ['btn-guia', 'btn-guia-opciones', 'btn-llamar-guia'].forEach((id) => clic(id, () => abrirGuia({ forzar: true })));
  clic('btn-guia-cerrar', cerrarGuia);
  clic('btn-guia-atras', () => { guia.i--; mostrarPasoGuia(); });
  clic('btn-guia-sig', avanzarGuia);
  clic('btn-guia-repetir', mostrarPasoGuia);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-explicar]');
    if (b) abrirGuia({ desde: b.dataset.explicar });
  });
  // En pantallas pequeñas la guía se compacta mientras se escribe
  document.addEventListener('focusin', (e) => $('guia').classList.toggle('escribiendo', !!e.target.closest('.contenido') && e.target.matches('input, select')));
  document.addEventListener('focusout', () => setTimeout(() => { if (!document.activeElement?.matches('.contenido input, .contenido select')) $('guia').classList.remove('escribiendo'); }, 250));

  $$('.paso').forEach((b) => b.addEventListener('click', () => irPaso(Number(b.dataset.paso))));
  $$('.subtab').forEach((b) => b.addEventListener('click', () => cambiarSub(b.dataset.sub)));
  clic('btn-paso-atras', volverEnMetodo);
  clic('btn-paso-sig', () => {
    if (Nav.paso === 0 && Nav.sub !== 'matriz') cambiarSub(SUBS[SUBS.indexOf(Nav.sub) + 1]);
    else irPaso(Nav.paso + 1);
  });

  // Datos generales (guardado automático)
  $('form-datos-generales').addEventListener('submit', (e) => e.preventDefault());
  $('form-datos-generales').addEventListener('change', () => {
    const g = Estado.general;
    const largo = parseFloat($('input-largo-planta').value), ancho = parseFloat($('input-ancho-planta').value);
    if (!(largo >= 2 && ancho >= 2)) avisar('El largo y el ancho deben ser de al menos 2.', true);
    else { g.largoPlanta = largo; g.anchoPlanta = ancho; }
    g.nombre = $('input-nombre-proyecto').value.trim() || 'Proyecto Sin Nombre';
    g.unidad = $('input-unidad-medida').value;
    g.coeficienteK = parseFloat($('input-coeficiente-k').value);
    g.anchoPasillo = Math.max(0, parseFloat($('input-ancho-pasillo').value) || 0);
    datosCambiados();
  });

  clic('btn-agregar-equipo', () => {
    const eq = { nombre: $('eq-nombre').value.trim(), cantidad: parseInt($('eq-cantidad').value, 10), largo: parseFloat($('eq-largo').value), ancho: parseFloat($('eq-ancho').value), lados: parseInt($('eq-lados').value, 10) };
    if (!eq.nombre || !(eq.cantidad >= 1 && eq.largo > 0 && eq.ancho > 0)) { avisar('Complete el nombre, la cantidad y las dimensiones del equipo.', true); return; }
    Estado.equiposTemporales.push(eq);
    $('eq-nombre').value = '';
    renderizarEquiposTemporales();
  });
  $('lista-equipos-temporales').addEventListener('click', (e) => {
    const b = e.target.closest('[data-quitar-eq]');
    if (b) { Estado.equiposTemporales.splice(Number(b.dataset.quitarEq), 1); renderizarEquiposTemporales(); }
  });

  $('form-departamento').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('edit-depto-id').value;
    const nombre = $('depto-nombre').value.trim();
    if (!nombre) { avisar('Escriba el nombre del departamento.', true); return; }
    const trabajadores = parseInt($('depto-trabajadores').value, 10) || 0;
    const actual = Estado.departamentos.find((d) => d.id === id);
    const datos = {
      nombre, trabajadores,
      codigo: actual ? actual.codigo : codigoAutomatico(nombre),   // código y color automáticos
      actividad: actual ? actual.actividad : 'General',
      color: actual ? actual.color : colorAutomatico(),
      areaAlmacen: Math.max(0, parseFloat($('depto-almacenamiento').value) || 0),
      equipos: Estado.equiposTemporales.length ? [...Estado.equiposTemporales] : [{ nombre: 'Estación Base', cantidad: Math.max(1, trabajadores), largo: 1.8, ancho: 1.2, lados: 2 }]
    };
    if (actual) Object.assign(actual, datos);
    else Estado.departamentos.push({ id: `dep_${Date.now()}`, zonaFija: 'libre', relacionMax: 2.5, ...datos });
    limpiarFormularioDepto();
    datosCambiados();
    actualizarNavegacion();
    audio.efecto('confirmacion');
  });
  clic('btn-cancelar-edicion', limpiarFormularioDepto);

  $('tbody-departamentos').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.editar) {
      const d = Estado.departamentos.find((x) => x.id === b.dataset.editar);
      Object.entries({ 'edit-depto-id': d.id, 'depto-nombre': d.nombre, 'depto-trabajadores': d.trabajadores, 'depto-almacenamiento': d.areaAlmacen }).forEach(([k, v]) => { $(k).value = v; });
      Estado.equiposTemporales = d.equipos.map((x) => ({ ...x }));
      renderizarEquiposTemporales();
      $('btn-guardar-depto').textContent = 'Actualizar departamento';
      $('btn-cancelar-edicion').classList.remove('oculto');
      $('tarjeta-depto').scrollIntoView({ behavior: 'smooth' });
    } else if (b.dataset.eliminar && confirm('¿Eliminar este departamento?')) {
      const id = b.dataset.eliminar;
      Estado.departamentos = Estado.departamentos.filter((d) => d.id !== id);
      [Estado.flujos, Estado.relaciones].forEach((o) => Object.keys(o).forEach((k) => { if (k.split(/->|\|/).includes(id)) delete o[k]; }));
      limpiarFormularioDepto();
      datosCambiados();
      actualizarNavegacion();
    }
  });

  $('form-obstaculo').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = $('obs-nombre').value.trim();
    if (!nombre) { avisar('Escriba un nombre para el elemento.', true); return; }
    Estado.obstaculos.push(crearObstaculo($('obs-tipo').value, nombre, $('obs-ubicacion').value));
    $('obs-nombre').value = '';
    datosCambiados(); actualizarNavegacion();
    audio.efecto('confirmacion');
  });
  $('lista-obstaculos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-quitar-obs]');
    if (b) { Estado.obstaculos = Estado.obstaculos.filter((o) => o.id !== b.dataset.quitarObs); datosCambiados(); actualizarNavegacion(); }
  });

  $('rest-depto-select').addEventListener('change', sincronizarRestriccion);
  $('form-restriccion-depto').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Estado.departamentos.find((x) => x.id === $('rest-depto-select').value);
    if (!d) return;
    d.zonaFija = $('rest-zona-fija').value;
    d.relacionMax = parseFloat($('rest-relacion-max').value);
    datosCambiados(); actualizarNavegacion();
    audio.efecto('confirmacion');
  });

  // Matrices y pesos (no se reconstruye la tabla de flujo para no perder el foco)
  const invalidar = () => { Estado.resultados = { eldep: null, corelap: null }; guardarProyecto(); actualizarNavegacion(); };
  $('contenedor-matriz-flujo').addEventListener('input', (e) => {
    if (e.target.dataset.flujo) { Estado.flujos[e.target.dataset.flujo] = Math.max(0, parseFloat(e.target.value) || 0); invalidar(); }
  });
  $('contenedor-matriz-rel').addEventListener('change', (e) => {
    const k = e.target.dataset.rel;
    if (!k) return;
    const [a, b] = k.split('|');
    delete Estado.relaciones[`${b}|${a}`];
    Estado.relaciones[k] = e.target.value;
    invalidar(); renderizarMatrizREL();
  });
  $('escala-rel').addEventListener('change', (e) => {
    if (e.target.dataset.peso) { Estado.pesosREL[e.target.dataset.peso] = parseFloat(e.target.value) || 0; invalidar(); renderizarMatrizREL(); }
  });

  clic('btn-calcular', async () => {
    const error = validarDatos(Nav.metodo);
    if (error) { avisar(error, true); return; }
    await conAccion('calculando', () => calcular(Nav.metodo), 2200);   // GIF de cálculo
    renderizarCalculo();
    actualizarNavegacion();
    ponerBotonesExplicar();
    audio.efecto('completado');
    if (!vistas()[claveExplicacion('resultados-calculo')]) abrirGuia({ desde: 'resultados-calculo' });
  });

  ['chk-cotas', 'chk-pasillos', 'chk-flujos'].forEach((id) => $(id).addEventListener('change', renderizarVisualizacion));
  const pdf = (metodos) => conAccion('imprimiendo', () => generarPDF(metodos), 2600).catch((err) => { console.error(err); avisar('No fue posible generar el PDF.', true); });
  clic('btn-pdf', () => pdf([Nav.metodo]));
  clic('btn-pdf-comparativo', () => pdf(['eldep', 'corelap']));
  clic('btn-png', () => conAccion('imprimiendo', async () => {
    const a = document.createElement('a');
    a.download = `Plano_${Nav.metodo.toUpperCase()}.png`;
    a.href = $('canvas-plano').toDataURL('image/png');
    a.click();
  }, 1800));

  // Opciones
  clic('btn-opciones-volver', () => (Nav.opcion === 'inicio' ? irMenu() : mostrarOpcion('inicio')));
  $$('[data-ir]').forEach((b) => b.addEventListener('click', () => mostrarOpcion(b.dataset.ir)));

  const interruptores = { 'audio-general': 'general', 'audio-ambiente': 'ambiente', 'audio-efectos': 'efectos' };
  Object.entries(interruptores).forEach(([id, k]) => {
    $(id).checked = audio.prefs[k];
    $(id).addEventListener('change', () => { audio.prefs[k] = $(id).checked; audio.aplicarPreferencias(); });
  });
  $('audio-volumen').value = Math.round(audio.prefs.volumen * 100);
  $('texto-volumen').textContent = `${$('audio-volumen').value}%`;
  $('audio-volumen').addEventListener('input', () => {
    audio.prefs.volumen = $('audio-volumen').value / 100;
    $('texto-volumen').textContent = `${$('audio-volumen').value}%`;
    audio.aplicarPreferencias();
  });

  clic('btn-guardar-proyecto', () => { guardarProyecto(); avisar('Proyecto guardado en este navegador.'); audio.efecto('confirmacion'); });
  clic('btn-cargar-ejemplo', () => {
    if (!confirm('Se reemplazarán los datos actuales por el caso ejemplo. ¿Continuar?')) return;
    cargarCasoEjemplo(); renderizarDatos(); avisar('Caso ejemplo cargado.'); audio.efecto('confirmacion');
  });
  clic('btn-repetir-guias', () => { memoria.borrar(CLAVE_VISTAS); avisar('Las explicaciones volverán a aparecer.'); });
  clic('btn-reiniciar', () => {
    if (!confirm('¿Borrar los datos actuales e iniciar un proyecto en blanco?')) return;
    Object.assign(Estado.general, { nombre: 'Proyecto Sin Nombre', descripcion: '' });
    Estado.departamentos = []; Estado.obstaculos = []; Estado.flujos = {}; Estado.relaciones = {};
    datosCambiados(); avisar('Proyecto en blanco creado.');
  });

  $('input-imagen-layout').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const lector = new FileReader();
    lector.onload = () => {
      $('img-layout-importado').src = lector.result;
      $('img-layout-importado').classList.remove('oculto');
      $('placeholder-visor').classList.add('oculto');
      analizarImportado();
    };
    lector.readAsDataURL(f);
  });
  ['imp-ancho', 'imp-alto', 'imp-obs'].forEach((id) => $(id).addEventListener('input', analizarImportado));
}

/* ============================================================================
   11. ARRANQUE
   ============================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  audio = new GestorAudio();
  prepararPersonajes();
  cargarProyecto();
  configurarEventos();
  renderizarDatos();
});