/* =====================================================================
   app.js — Interfaz: mapa, línea temporal, indicadores, gráficos,
   panel de configuración y pantalla de resultados.
   No depende de ninguna librería externa (funciona sin conexión y es
   compatible con GitHub Pages sin pasos de compilación).
   ===================================================================== */

const state = {
  scenario: "A",       // 'A' | 'B' | 'both'
  region: "all",        // 'all' | 'north' | 'west' | 'central' | 'east' | 'south'
  year: 2025,
  params: Model.defaultParams(),
  playing: false
};

/* ---------------------- MAPA ESQUEMÁTICO DE ÁFRICA ----------------------
   Nota: es un mapa ESQUEMÁTICO (no cartográficamente preciso) pensado
   solo para seleccionar región; ver README.md. */
function renderMap() {
  const container = document.getElementById("africa-map-container");
  const regionsPath = {
    north:   "M70,10 L230,10 L230,70 L70,70 Z",
    west:    "M40,75 L150,75 L140,170 L55,190 L20,130 Z",
    central: "M155,75 L240,75 L250,175 L150,175 Z",
    east:    "M245,75 L300,75 L290,220 L255,210 L252,180 Z",
    south:   "M90,195 L220,180 L230,290 L110,300 Z"
  };
  let svg = `<svg viewBox="0 0 320 310" xmlns="http://www.w3.org/2000/svg">`;
  Object.keys(regionsPath).forEach(key => {
    svg += `<path id="region-${key}" class="region-shape" data-region="${key}" d="${regionsPath[key]}" fill="${REGIONS[key].color}"></path>`;
  });
  svg += `</svg>`;
  container.innerHTML = svg;

  Object.keys(regionsPath).forEach(key => {
    document.getElementById(`region-${key}`).addEventListener("click", () => {
      state.region = (state.region === key) ? "all" : key;
      updateSelectedRegionStyle();
      renderAll();
    });
  });
  updateSelectedRegionStyle();

  const allBtn = document.createElement("button");
  allBtn.textContent = "Todo el continente";
  allBtn.className = "scenario-btn";
  allBtn.style.marginTop = "10px";
  allBtn.addEventListener("click", () => { state.region = "all"; updateSelectedRegionStyle(); renderAll(); });
  container.parentElement.insertBefore(allBtn, container.nextSibling);
}

function updateSelectedRegionStyle() {
  document.querySelectorAll(".region-shape").forEach(el => el.classList.remove("selected"));
  if (state.region !== "all") {
    const el = document.getElementById(`region-${state.region}`);
    if (el) el.classList.add("selected");
  }
}

/* ---------------------- HELPERS DE DATOS ---------------------- */
function getIndicator(scenario, varName, year) {
  if (state.region === "all") {
    return { value: Model.getContinentValue(scenario, varName, year, state.params), dataKind: year <= 1950 ? "estimated" : (scenario === "B" && year > state.params.divergenceYear ? "hypothesis" : "historical") };
  }
  return Model.getValue(scenario, varName, state.region, year, state.params);
}

function fmt(n, decimals = 0) {
  if (n === null || n === undefined || isNaN(n)) return "–";
  return n.toLocaleString("es-ES", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

/* ---------------------- INDICADORES ---------------------- */
function renderIndicators() {
  const heading = state.region === "all" ? "Todo el continente" : REGIONS[state.region].name;
  document.getElementById("region-heading").textContent = heading + " — " + state.year;

  const sc = state.scenario === "both" ? "A" : state.scenario; // tarjetas muestran el escenario activo principal
  const gdp = getIndicator(sc, "gdpPerCapita", state.year);
  const pop = getIndicator(sc, "population", state.year);
  const life = getIndicator(sc, "lifeExpectancy", state.year);
  const tech = getIndicator(sc, "infraIndexRaw", state.year);
  const inst = getIndicator(sc, "institutionsIndexRaw", state.year);
  const lit = getIndicator(sc, "literacy", state.year);

  document.getElementById("val-gdp").textContent = "$" + fmt(gdp.value);
  document.getElementById("val-pop").textContent = fmt(pop.value, 0);
  document.getElementById("val-life").textContent = fmt(life.value, 1);
  document.getElementById("val-tech").textContent = fmt(tech.value, 0);
  document.getElementById("val-inst").textContent = fmt(inst.value, 0);
  document.getElementById("val-lit").textContent = fmt(lit.value, 0);

  const kindLabel = { historical: "Histórico", estimated: "Estimado", hypothesis: "Hipótesis (Escenario B)", "historical-compartida": "Histórico (compartido A/B)" };
  document.getElementById("data-flag").innerHTML =
    `<span class="tag ${gdp.dataKind && gdp.dataKind.indexOf('hypothes') >= 0 ? 'tag-hypothesis' : (gdp.dataKind === 'historical' ? 'tag-historical' : 'tag-estimated')}">${kindLabel[gdp.dataKind] || gdp.dataKind}</span> tipo de dato para el año seleccionado (escenario ${sc}).`;
}

/* ---------------------- GRÁFICOS (canvas, sin librerías) ---------------------- */
function drawLineChart(canvasId, seriesList, title) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const padL = 46, padR = 14, padT = 26, padB = 26;
  const plotW = w - padL - padR, plotH = h - padT - padB;

  let allVals = [];
  seriesList.forEach(s => s.points.forEach(p => allVals.push(p.y)));
  let minY = Math.min(...allVals), maxY = Math.max(...allVals);
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const pad = (maxY - minY) * 0.1;
  minY -= pad; maxY += pad;

  const minX = 1870, maxX = 2025;
  const xToPx = x => padL + (x - minX) / (maxX - minX) * plotW;
  const yToPx = y => padT + (1 - (y - minY) / (maxY - minY)) * plotH;

  // ejes
  ctx.strokeStyle = "#2a2f3c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();

  ctx.fillStyle = "#9aa0ac";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(fmt(maxY, maxY > 100 ? 0 : 1), padL - 6, padT + 4);
  ctx.fillText(fmt(minY, minY > 100 ? 0 : 1), padL - 6, padT + plotH);

  ctx.textAlign = "center";
  [1870, 1950, 2025].forEach(yr => ctx.fillText(yr, xToPx(yr), padT + plotH + 16));

  // título
  ctx.textAlign = "left";
  ctx.fillStyle = "#e8e9ed";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(title, padL, 14);

  seriesList.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(s.dashed ? [5, 4] : []);
    ctx.beginPath();
    s.points.forEach((p, i) => {
      const px = xToPx(p.x), py = yToPx(p.y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // leyenda
  let lx = padL;
  ctx.font = "10px sans-serif";
  seriesList.forEach(s => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, h - 12, 10, 3);
    ctx.fillStyle = "#9aa0ac";
    ctx.fillText(s.label, lx + 14, h - 8);
    lx += ctx.measureText(s.label).width + 34;
  });
}

function buildSeries(varName, scenario, color, dashed, label) {
  const points = [];
  for (let y = 1870; y <= 2025; y += 5) {
    const val = state.region === "all"
      ? Model.getContinentValue(scenario, varName, y, state.params)
      : Model.getValue(scenario, varName, state.region, y, state.params).value;
    points.push({ x: y, y: val });
  }
  // asegurar el punto final exacto 2025
  const last = state.region === "all"
    ? Model.getContinentValue(scenario, varName, 2025, state.params)
    : Model.getValue(scenario, varName, state.region, 2025, state.params).value;
  points.push({ x: 2025, y: last });
  return { points, color, dashed, label };
}

function renderCharts() {
  const showA = state.scenario === "A" || state.scenario === "both";
  const showB = state.scenario === "B" || state.scenario === "both";

  const specs = [
    { id: "chart-gdp", varName: "gdpPerCapita", title: "Economía — PIB per cápita (US$ int'l 1990)" },
    { id: "chart-pop", varName: "population", title: "Población (millones)" },
    { id: "chart-tech", varName: "infraIndexRaw", title: "Tecnología e infraestructuras (índice 0–100)" },
    { id: "chart-inst", varName: "institutionsIndexRaw", title: "Desarrollo político y social (índice 0–100)" }
  ];

  specs.forEach(spec => {
    const series = [];
    if (showA) series.push(buildSeries(spec.varName, "A", "#e07a5f", false, "Escenario A"));
    if (showB) series.push(buildSeries(spec.varName, "B", "#3d9a7e", true, "Escenario B"));
    drawLineChart(spec.id, series, spec.title);
  });
}

/* ---------------------- RESULTADOS 2025 ---------------------- */
function renderResults() {
  const vars = [
    { key: "gdpPerCapita", label: "PIB per cápita", unit: "US$", dec: 0 },
    { key: "population", label: "Población", unit: "M", dec: 0 },
    { key: "lifeExpectancy", label: "Esperanza de vida", unit: "años", dec: 1 },
    { key: "literacy", label: "Alfabetización", unit: "%", dec: 0 },
    { key: "infraIndexRaw", label: "Tecnología/infraestructura", unit: "índice", dec: 0 },
    { key: "institutionsIndexRaw", label: "Estabilidad político-institucional", unit: "índice", dec: 0 }
  ];

  const container = document.getElementById("results-2025");
  container.innerHTML = "";

  Object.keys(REGIONS).concat(["all"]).forEach(key => {
    const title = key === "all" ? "Continente completo" : REGIONS[key].name;
    const card = document.createElement("div");
    card.className = "result-card";
    let html = `<h4>${title}</h4>`;
    vars.forEach(v => {
      const A = key === "all" ? Model.getContinentValue("A", v.key, 2025, state.params) : Model.getValue("A", v.key, key, 2025, state.params).value;
      const B = key === "all" ? Model.getContinentValue("B", v.key, 2025, state.params) : Model.getValue("B", v.key, key, 2025, state.params).value;
      const diff = B - A;
      const diffPct = A !== 0 ? (diff / A * 100) : 0;
      html += `<div class="result-row"><span class="label">${v.label} — A</span><span>${fmt(A, v.dec)} ${v.unit}</span></div>`;
      html += `<div class="result-row"><span class="label">${v.label} — B</span><span>${fmt(B, v.dec)} ${v.unit}</span></div>`;
      html += `<div class="result-row diff"><span class="label">Diferencia (B−A)</span><span style="color:${diff >= 0 ? '#8fe3bd' : '#e38f8f'}">${diff >= 0 ? '+' : ''}${fmt(diffPct, 1)}%</span></div>`;
    });
    card.innerHTML = html;
    container.appendChild(card);
  });
}

/* ---------------------- REFERENCIAS ---------------------- */
function renderReferences() {
  const el = document.getElementById("references-list");
  let html = "<ul>";
  REFERENCES.forEach(r => {
    html += `<li>${r.text}${r.url ? ` — <a href="${r.url}" target="_blank" rel="noopener">enlace</a>` : ""}</li>`;
  });
  html += "</ul>";
  el.innerHTML = html;
}

/* ---------------------- CONTROLES ---------------------- */
function wireControls() {
  document.querySelectorAll(".scenario-btn[data-scenario]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.scenario = btn.dataset.scenario;
      document.querySelectorAll(".scenario-btn[data-scenario]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderAll();
    });
  });

  const slider = document.getElementById("year-slider");
  slider.addEventListener("input", () => {
    state.year = parseInt(slider.value, 10);
    document.getElementById("year-label").textContent = state.year;
    renderIndicators();
  });

  document.getElementById("btn-play").addEventListener("click", function () {
    state.playing = !state.playing;
    this.textContent = state.playing ? "⏸" : "▶";
    if (state.playing) playTimeline();
  });

  function playTimeline() {
    if (!state.playing) return;
    let y = parseInt(slider.value, 10);
    y = y >= 2025 ? 1870 : y + 1;
    slider.value = y;
    state.year = y;
    document.getElementById("year-label").textContent = y;
    renderIndicators();
    setTimeout(playTimeline, 60);
  }

  const paramMap = [
    { id: "param-divergence", key: "divergenceYear", valId: "val-divergence", fmt: v => v },
    { id: "param-gdp", key: "gdpGrowthDelta", valId: "val-gdp-param", fmt: v => (v >= 0 ? "+" : "") + v.toFixed(2) },
    { id: "param-life", key: "lifeExpectancyDelta", valId: "val-life-param", fmt: v => (v >= 0 ? "+" : "") + v.toFixed(1) },
    { id: "param-tech", key: "techDiffusionFactor", valId: "val-tech-param", fmt: v => v.toFixed(2) + "×" },
    { id: "param-inst", key: "institutionsDelta", valId: "val-inst-param", fmt: v => (v >= 0 ? "+" : "") + v },
    { id: "param-pop", key: "populationDelta2025", valId: "val-pop-param", fmt: v => (v >= 0 ? "+" : "") + v + " M" }
  ];

  paramMap.forEach(p => {
    const input = document.getElementById(p.id);
    input.addEventListener("input", () => {
      const v = parseFloat(input.value);
      state.params[p.key] = v;
      document.getElementById(p.valId).textContent = p.fmt(v);
      renderAll();
    });
  });

  document.getElementById("btn-reset-params").addEventListener("click", () => {
    state.params = Model.defaultParams();
    paramMap.forEach(p => {
      document.getElementById(p.id).value = state.params[p.key];
      document.getElementById(p.valId).textContent = p.fmt(state.params[p.key]);
    });
    renderAll();
  });
}

/* ---------------------- RENDER GLOBAL ---------------------- */
function renderAll() {
  renderIndicators();
  renderCharts();
  renderResults();
}

window.addEventListener("resize", renderCharts);

document.addEventListener("DOMContentLoaded", () => {
  renderMap();
  wireControls();
  renderReferences();
  renderAll();
});
