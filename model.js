/* =====================================================================
   model.js — Modelo matemático de la simulación
   ---------------------------------------------------------------------
   ECUACIONES UTILIZADAS (resumen; ver README.md para la versión
   extendida con justificación de cada parámetro)

   (1) Interpolación de anclas históricas (Escenario A)
       Entre dos años ancla t0 < t1 con valores V0, V1, se interpola:
         - Para magnitudes de crecimiento compuesto (PIB/hab, población,
           índices que no pueden ser negativos):
               V(t) = V0 * (V1/V0) ^ ((t - t0) / (t1 - t0))
           (interpolación exponencial = tasa de crecimiento anual
            constante dentro de cada tramo, consistente con la práctica
            habitual al trabajar con series de Maddison)
         - Para magnitudes acotadas tipo porcentaje que pueden saturar
           (alfabetización, urbanización, esperanza de vida, índices
           0-100) se usa interpolación lineal simple, más prudente
           cuando el rango es estrecho:
               V(t) = V0 + (V1 - V0) * (t - t0) / (t1 - t0)

   (2) Reparto regional
       Para cada variable X y año t, el valor continental X_cont(t) se
       reparte entre región r mediante un ratio r_X(r,t) interpolado
       linealmente entre el ratio documentado en 1870 y el de 2025:
               ratio(r,t) = ratio_1870(r) + (ratio_2025(r)-ratio_1870(r)) * (t-1870)/(2025-1870)
       y:
               X_region(r,t) = X_cont(t) * ratio(r,t)
       normalizado después para que la suma ponderada de las 5 regiones
       reproduzca el total continental (solo aplica a "población", que
       es extensiva; el resto son intensivas y no se normalizan).

   (3) Escenario B (hipótesis sin colonización)
       Antes del año de divergencia (por defecto 1885) Escenario B =
       Escenario A (no se inventa una historia alternativa para un
       periodo en el que el dominio colonial directo aún no se había
       impuesto en la mayor parte del continente).
       A partir del año de divergencia, para cada tramo [t0,t1] del
       Escenario A se calcula su tasa de crecimiento anual implícita:
               g_A = (V1/V0)^(1/(t1-t0)) - 1
       y se construye la tasa del Escenario B sumando un "delta" definido
       por el usuario (o, por defecto, el valor central del rango
       calibrado en data.js):
               g_B = g_A + delta
       aplicando luego crecimiento compuesto:
               V_B(t) = V_B(t0) * (1+g_B)^(t-t0)
       Para las variables acotadas (0-100, años de vida) se trabaja
       igual pero sobre la variación absoluta anual en vez de la tasa
       geométrica, para evitar que el índice se dispare sin límite:
               Δ_A = (V1 - V0) / (t1 - t0)
               Δ_B = Δ_A + delta_anual
               V_B(t) = V_B(t0) + Δ_B * (t - t0)
       con un tope (clamp) en [0,100] o en el máximo biológico razonable
       para esperanza de vida (85 años).

   Esto garantiza que el Escenario B:
         - Coincide con el A antes de 1885 (misma historia compartida).
         - Se aparta de forma proporional y acotada por los parámetros
           del panel de configuración, nunca de forma arbitraria.
         - Puede dar resultados mejores O peores que el A, dependiendo
           de los parámetros, tal y como pide el enunciado del proyecto.
   ===================================================================== */

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function lerp(a, b, t) { return a + (b - a) * t; }

// Tipo de interpolación por variable
const VAR_KIND = {
  gdpPerCapita: "geometric",
  population: "geometric",
  lifeExpectancy: "linear",
  literacy: "linear",
  urbanization: "linear",
  infraIndexRaw: "linear",
  institutionsIndexRaw: "linear"
};

const VAR_BOUNDS = {
  lifeExpectancy: [15, 85],
  literacy: [0, 100],
  urbanization: [0, 100],
  infraIndexRaw: [0, 100],
  institutionsIndexRaw: [0, 100]
};

function findBracket(anchorsObj, year) {
  const years = YEARS_ANCHOR;
  let t0 = years[0], t1 = years[years.length - 1];
  for (let i = 0; i < years.length - 1; i++) {
    if (year >= years[i] && year <= years[i + 1]) {
      t0 = years[i]; t1 = years[i + 1];
      break;
    }
  }
  return [t0, t1];
}

function continentValueA(varName, year) {
  const series = SCENARIO_A_CONTINENT[varName];
  const y = clamp(year, YEARS_ANCHOR[0], YEARS_ANCHOR[YEARS_ANCHOR.length - 1]);
  const [t0, t1] = findBracket(series.values, y);
  const V0 = series.values[t0].v, V1 = series.values[t1].v;
  const frac = t1 === t0 ? 0 : (y - t0) / (t1 - t0);
  const kind = VAR_KIND[varName];
  let val;
  if (kind === "geometric") {
    val = V0 * Math.pow(V1 / V0, frac);
  } else {
    val = lerp(V0, V1, frac);
  }
  // "kind" de dato (historical/estimated) = el del ancla inferior del tramo
  const dataKind = series.values[t0].kind === "historical" && series.values[t1].kind === "historical"
    ? "historical" : "estimated";
  return { value: val, dataKind };
}

function regionalRatio(varName, region, year) {
  const r = REGIONAL_RATIOS[varName];
  const y = clamp(year, 1870, 2025);
  const frac = (y - 1870) / (2025 - 1870);
  return lerp(r[1870][region], r[2025][region], frac);
}

// Valor regional en Escenario A
function regionValueA(varName, region, year) {
  const cont = continentValueA(varName, year);
  const ratio = regionalRatio(varName, region, year);
  let value = cont.value * ratio;
  if (VAR_BOUNDS[varName]) value = clamp(value, VAR_BOUNDS[varName][0], VAR_BOUNDS[varName][1]);
  return { value, dataKind: cont.dataKind };
}

/* ---------------------------------------------------------------------
   Escenario B: se calcula por región, tramo a tramo, aplicando el
   delta de parámetros sobre la tasa/variación de cada tramo del
   Escenario A EN ESA MISMA REGIÓN (así la disparidad regional de
   partida se conserva; solo cambia la trayectoria temporal).
   ----------------------------------------------------------------- */
function buildScenarioBSeries(varName, region, params) {
  // devuelve función year -> {value, dataKind:'hypothesis'|'historical'(pre-divergencia)}
  const divYear = params.divergenceYear;
  const years = YEARS_ANCHOR;
  const kind = VAR_KIND[varName];

  // precomputamos valores de A en cada ancla para esta región
  const Avals = years.map(y => regionValueA(varName, region, y).value);

  return function (year) {
    const y = clamp(year, years[0], years[years.length - 1]);
    if (y <= divYear) {
      return { value: regionValueA(varName, region, y).value, dataKind: "historical-compartida" };
    }
    // reconstituir trayectoria B tramo a tramo desde divYear
    // valor de partida en divYear = igual a A (punto de divergencia)
    let prevYear = divYear;
    let prevVal = interpAtYear(years, Avals, divYear, kind);

    for (let i = 0; i < years.length; i++) {
      if (years[i] <= divYear) continue;
      const segT0 = Math.max(prevYear, years[i - 1] !== undefined ? years[i - 1] : divYear);
      const t0 = prevYear;
      const t1 = years[i];
      const V0_A = interpAtYear(years, Avals, t0, kind);
      const V1_A = Avals[i];
      let delta = deltaForVar(varName, params);

      let V1_B;
      if (kind === "geometric") {
        const gA = Math.pow(V1_A / V0_A, 1 / (t1 - t0)) - 1;
        const gB = gA + delta;
        V1_B = prevVal * Math.pow(1 + gB, t1 - t0);
      } else {
        const dA = (V1_A - V0_A) / (t1 - t0);
        const dB = dA + delta;
        V1_B = prevVal + dB * (t1 - t0);
        if (VAR_BOUNDS[varName]) V1_B = clamp(V1_B, VAR_BOUNDS[varName][0], VAR_BOUNDS[varName][1]);
      }

      if (y <= t1) {
        // interpolar dentro de este tramo hasta y
        const frac = (y - t0) / (t1 - t0);
        let val;
        if (kind === "geometric") {
          const gA = Math.pow(V1_A / V0_A, 1 / (t1 - t0)) - 1;
          const gB = gA + delta;
          val = prevVal * Math.pow(1 + gB, y - t0);
        } else {
          const dA = (V1_A - V0_A) / (t1 - t0);
          const dB = dA + delta;
          val = prevVal + dB * (y - t0);
          if (VAR_BOUNDS[varName]) val = clamp(val, VAR_BOUNDS[varName][0], VAR_BOUNDS[varName][1]);
        }
        return { value: val, dataKind: "hypothesis" };
      }

      prevYear = t1;
      prevVal = V1_B;
    }
    return { value: prevVal, dataKind: "hypothesis" };
  };
}

function interpAtYear(years, vals, year, kind) {
  let t0 = years[0], t1 = years[years.length - 1], V0 = vals[0], V1 = vals[vals.length - 1];
  for (let i = 0; i < years.length - 1; i++) {
    if (year >= years[i] && year <= years[i + 1]) {
      t0 = years[i]; t1 = years[i + 1]; V0 = vals[i]; V1 = vals[i + 1];
      break;
    }
  }
  const frac = t1 === t0 ? 0 : (year - t0) / (t1 - t0);
  return kind === "geometric" ? V0 * Math.pow(V1 / V0, frac) : lerp(V0, V1, frac);
}

function deltaForVar(varName, params) {
  switch (varName) {
    case "gdpPerCapita": return params.gdpGrowthDelta / 100; // delta está en puntos %, se pasa a tasa
    case "population":
      // La población se calcula aparte en buildPopulationBSeries(); esta
      // rama no se usa nunca (Model.getValue desvía "population" antes
      // de llegar aquí), se deja solo por completitud del switch.
      return 0;
    case "lifeExpectancy": {
      const totalYears = 2025 - params.divergenceYear;
      return params.lifeExpectancyDelta / totalYears;
    }
    case "literacy":
    case "urbanization": {
      // el factor de difusión tecnológica/educativa también modula
      // el ritmo de alfabetización/urbanización autónoma
      return (params.techDiffusionFactor - 1) * 0.6; // puntos/año adicionales, modestos
    }
    case "infraIndexRaw":
      return (params.techDiffusionFactor - 1) * 1.2;
    case "institutionsIndexRaw": {
      const totalYears = 2025 - params.divergenceYear;
      return params.institutionsDelta / totalYears;
    }
    default: return 0;
  }
}

// La población usa su propio delta anual constante en millones/año,
// calculado una vez a partir del parámetro "delta total en 2025".
function populationDeltaPerYear(params) {
  const totalYears = 2025 - params.divergenceYear;
  return params.populationDelta2025 / totalYears;
}

// Sobreescribimos buildScenarioBSeries para población con una regla
// específica (más simple y más transparente que forzar el caso general).
function buildPopulationBSeries(region, params) {
  const years = YEARS_ANCHOR;
  const kind = "geometric";
  const Avals = years.map(y => regionValueA("population", region, y).value);
  const dPerYearTotal = populationDeltaPerYear(params); // millones/año, continental
  // repartimos el delta poblacional entre regiones según su peso poblacional actual
  const w = regionalRatio("population", region, 2025);
  let totalW = 0;
  Object.keys(REGIONS).forEach(r => totalW += regionalRatio("population", r, 2025));
  const dPerYear = dPerYearTotal * (w / totalW);

  return function (year) {
    const y = clamp(year, years[0], years[years.length - 1]);
    if (y <= params.divergenceYear) {
      return { value: regionValueA("population", region, y).value, dataKind: "historical-compartida" };
    }
    const base = interpAtYear(years, Avals, params.divergenceYear, kind);
    const val = base + dPerYear * (y - params.divergenceYear) +
      (interpAtYear(years, Avals, y, kind) - interpAtYear(years, Avals, params.divergenceYear, kind));
    return { value: Math.max(5, val), dataKind: "hypothesis" };
  };
}

/* ---------------------------------------------------------------------
   API pública usada por app.js
   ----------------------------------------------------------------- */
const Model = {
  regions: Object.keys(REGIONS),

  getValue(scenario, varName, region, year, params) {
    if (scenario === "A") {
      return regionValueA(varName, region, year);
    }
    if (varName === "population") {
      return buildPopulationBSeries(region, params)(year);
    }
    return buildScenarioBSeries(varName, region, params)(year);
  },

  // Agregados continentales (suma o media ponderada según variable)
  getContinentValue(scenario, varName, year, params) {
    const regions = Object.keys(REGIONS);
    if (varName === "population") {
      let sum = 0;
      regions.forEach(r => sum += this.getValue(scenario, varName, r, year, params).value);
      return sum;
    }
    if (varName === "lifeExpectancy" || varName === "literacy" || varName === "urbanization" ||
        varName === "infraIndexRaw" || varName === "institutionsIndexRaw") {
      // media ponderada por población
      let num = 0, den = 0;
      regions.forEach(r => {
        const pop = this.getValue(scenario, "population", r, year, params).value;
        const val = this.getValue(scenario, varName, r, year, params).value;
        num += val * pop; den += pop;
      });
      return num / den;
    }
    if (varName === "gdpPerCapita") {
      // PIB total / población total
      let gdp = 0, pop = 0;
      regions.forEach(r => {
        const p = this.getValue(scenario, "population", r, year, params).value;
        const g = this.getValue(scenario, "gdpPerCapita", r, year, params).value;
        gdp += g * p; pop += p;
      });
      return gdp / pop;
    }
    return null;
  },

  defaultParams() {
    return {
      divergenceYear: SCENARIO_B_DEFAULTS.divergenceYear,
      gdpGrowthDelta: SCENARIO_B_DEFAULTS.gdpGrowthDelta.default,
      lifeExpectancyDelta: SCENARIO_B_DEFAULTS.lifeExpectancyDelta.default,
      techDiffusionFactor: SCENARIO_B_DEFAULTS.techDiffusionFactor.default,
      institutionsDelta: SCENARIO_B_DEFAULTS.institutionsDelta.default,
      populationDelta2025: SCENARIO_B_DEFAULTS.population.delta2025.default
    };
  }
};
