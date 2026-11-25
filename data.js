/* =====================================================================
   data.js — Base empírica del modelo
   ---------------------------------------------------------------------
   Este fichero contiene:
   1) Anclas históricas a nivel continental para el Escenario A
      (África con colonización europea = evolución real documentada).
   2) Ratios de diferenciación regional (para repartir el dato
      continental entre las 5 regiones).
   3) Parámetros de referencia para construir el Escenario B
      (hipótesis sin colonización), calibrados con comparadores
      históricos reales (países nunca colonizados o colonizados muy
      brevemente: Etiopía, Tailandia/Siam, Japón Meiji, Afganistán,
      Irán/Persia).
   4) La bibliografía citada en toda la aplicación.

   IMPORTANTE SOBRE EL RIGOR DE LOS DATOS
   ---------------------------------------------------------------------
   - Los valores marcados como "historical" proceden de series publicadas
     (ver REFERENCES). Para el nivel CONTINENTAL están razonablemente
     bien documentados desde 1870 (PIB/hab) y desde 1950 (resto de
     variables).
   - No existen series fiables año a año por región para 1870-1950, así
     que el reparto regional se hace con un ratio relativo documentado
     en la literatura regional (Frankema 2015; Broadberry & Gardner
     2019; Jerven 2014) y declarado explícitamente como SIMPLIFICACIÓN,
     no como dato regional independiente.
   - Los valores del Escenario B son, por construcción, una HIPÓTESIS
     razonada, nunca un dato histórico. Se generan con el modelo de
     model.js a partir de los parámetros definidos aquí.
   - Donde no hay dato fiable (p. ej. población africana antes de 1850,
     tecnología antes de 1950) se usa el rango de incertidumbre citado
     por la fuente en vez de inventar una cifra puntual.
   ===================================================================== */

const YEARS_ANCHOR = [1870, 1900, 1913, 1950, 1960, 1973, 1990, 2000, 2010, 2025];

const REGIONS = {
  north:   { name: "África septentrional", short: "Norte",   color: "#e07a5f" },
  west:    { name: "África occidental",    short: "Oeste",   color: "#81b29a" },
  central: { name: "África central",       short: "Centro",  color: "#f2cc8f" },
  east:    { name: "África oriental",      short: "Este",    color: "#3d5a80" },
  south:   { name: "África austral",       short: "Sur",     color: "#9c6644" }
};

/* ---------------------------------------------------------------------
   1. ESCENARIO A — Anclas continentales (valores reales / estimados)
   ---------------------------------------------------------------------
   gdpPerCapita: PIB per cápita, dólares internacionales Geary-Khamis de
     1990 (la unidad estándar de Maddison Project). Fuente: Maddison
     Project Database 2018 (1950-2016/2025 extrapolado); Prados de la
     Escosura (2012) y Frankema (2015) para 1870-1950, que son
     retro-extrapolaciones, no observaciones directas -> se marcan
     "estimated".
   population: millones de habitantes. Fuente: UN World Population
     Prospects 2024 (1950-2025); Frankema (2015) / Manning (2014) para
     1870-1950 (estimaciones con incertidumbre considerable, señaladas).
   lifeExpectancy: años al nacer, media continental. Fuente: UN WPP 2024
     (1950-2025) y Our World in Data / Riley (2005) para 1870-1950
     (estimaciones).
   literacy: tasa de alfabetización adulta (%), UNESCO Institute for
     Statistics / Our World in Data (dato fiable solo desde ~1950;
     antes de esa fecha se usa un valor mínimo citado en la literatura
     colonial, marcado "estimated", nunca "historical").
   urbanization: % población urbana, UN World Urbanization Prospects
     2018 (serie fiable desde 1950; 1870-1913 estimado a partir de
     historiografía urbana africana, p. ej. Coquery-Vidrovitch 2005).
   ----------------------------------------------------------------- */

const SCENARIO_A_CONTINENT = {
  gdpPerCapita: {
    unit: "US$ internacionales de 1990 (Geary-Khamis)",
    source: "Maddison Project Database 2018; Prados de la Escosura 2012; Frankema 2015",
    values: {
      1870: { v: 500,  kind: "estimated"  },
      1900: { v: 600,  kind: "estimated"  },
      1913: { v: 650,  kind: "estimated"  },
      1950: { v: 890,  kind: "historical" },
      1960: { v: 1040, kind: "historical" },
      1973: { v: 1365, kind: "historical" },
      1990: { v: 1255, kind: "historical" },
      2000: { v: 1330, kind: "historical" },
      2010: { v: 1770, kind: "historical" },
      2025: { v: 2100, kind: "estimated"  }
    }
  },
  population: {
    unit: "millones de habitantes",
    source: "UN World Population Prospects 2024; Frankema 2015; Manning 2014",
    values: {
      1870: { v: 90,   kind: "estimated"  },
      1900: { v: 113,  kind: "estimated"  },
      1913: { v: 124,  kind: "estimated"  },
      1950: { v: 230,  kind: "historical" },
      1960: { v: 285,  kind: "historical" },
      1973: { v: 390,  kind: "historical" },
      1990: { v: 635,  kind: "historical" },
      2000: { v: 811,  kind: "historical" },
      2010: { v: 1050, kind: "historical" },
      2025: { v: 1500, kind: "historical" }
    }
  },
  lifeExpectancy: {
    unit: "años al nacer (media continental)",
    source: "UN WPP 2024; Riley 2005 (Our World in Data)",
    values: {
      1870: { v: 26,   kind: "estimated"  },
      1900: { v: 27,   kind: "estimated"  },
      1913: { v: 28,   kind: "estimated"  },
      1950: { v: 37,   kind: "historical" },
      1960: { v: 41,   kind: "historical" },
      1973: { v: 46,   kind: "historical" },
      1990: { v: 50,   kind: "historical" },
      2000: { v: 51,   kind: "historical" },
      2010: { v: 58,   kind: "historical" },
      2025: { v: 64,   kind: "historical" }
    }
  },
  literacy: {
    unit: "% población adulta alfabetizada",
    source: "UNESCO Institute for Statistics; Our World in Data",
    values: {
      1870: { v: 5,    kind: "estimated"  },
      1900: { v: 7,    kind: "estimated"  },
      1913: { v: 9,    kind: "estimated"  },
      1950: { v: 15,   kind: "estimated"  },
      1960: { v: 21,   kind: "historical" },
      1973: { v: 32,   kind: "historical" },
      1990: { v: 48,   kind: "historical" },
      2000: { v: 57,   kind: "historical" },
      2010: { v: 62,   kind: "historical" },
      2025: { v: 70,   kind: "historical" }
    }
  },
  urbanization: {
    unit: "% población urbana",
    source: "UN World Urbanization Prospects 2018; Coquery-Vidrovitch 2005",
    values: {
      1870: { v: 5,    kind: "estimated"  },
      1900: { v: 6,    kind: "estimated"  },
      1913: { v: 8,    kind: "estimated"  },
      1950: { v: 14,   kind: "historical" },
      1960: { v: 18,   kind: "historical" },
      1973: { v: 25,   kind: "historical" },
      1990: { v: 32,   kind: "historical" },
      2000: { v: 35,   kind: "historical" },
      2010: { v: 39,   kind: "historical" },
      2025: { v: 45,   kind: "historical" }
    }
  },
  /* Infraestructura de transporte/energía: proxy construido (no existe
     serie continua 1870-2025). Se ancla con datos puntuales conocidos
     (km de ferrocarril construidos en la época colonial, tasa de
     electrificación y penetración de telefonía móvil reciente) y se
     normaliza a un índice 0-100. Ver README para la fórmula exacta. */
  infraIndexRaw: {
    unit: "índice compuesto 0-100 (ferrocarril/electrificación/telecom, normalizado)",
    source: "Construcción propia a partir de: Jedwab & Moradi (2016) [ferrocarriles coloniales]; " +
            "Banco Mundial, World Development Indicators [electrificación, líneas telefónicas, " +
            "suscripciones móviles]; UIT (ITU) World Telecommunication Indicators",
    values: {
      1870: { v: 1,   kind: "estimated"  },
      1900: { v: 4,   kind: "estimated"  },
      1913: { v: 9,   kind: "estimated"  },
      1950: { v: 14,  kind: "estimated"  },
      1960: { v: 17,  kind: "estimated"  },
      1973: { v: 23,  kind: "estimated"  },
      1990: { v: 29,  kind: "estimated"  },
      2000: { v: 35,  kind: "historical" },
      2010: { v: 55,  kind: "historical" },
      2025: { v: 72,  kind: "historical" }
    }
  },
  /* Estabilidad político-institucional: proxy cualitativo-cuantitativo
     0-100 construido a partir de (a) nº de cambios de régimen /
     conflictos armados por década (Uppsala Conflict Data Program,
     UCDP), (b) grado de autonomía política (colonia plena, protectorado,
     independencia), y (c) un componente de institucionalidad basado en
     la tasa de alfabetización como proxy de capacidad administrativa.
     Declarado explícitamente como ÍNDICE SINTÉTICO, no como una
     "puntuación de civilización". */
  institutionsIndexRaw: {
    unit: "índice compuesto 0-100 (autonomía + estabilidad + capacidad institucional)",
    source: "Construcción propia a partir de: UCDP/PRIO Armed Conflict Dataset; " +
            "Polity5 Project (conceptos de autocracia/democracia, no la serie bruta); " +
            "Our World in Data — descolonización",
    values: {
      1870: { v: 38,  kind: "estimated"  },
      1900: { v: 18,  kind: "estimated"  },
      1913: { v: 15,  kind: "estimated"  },
      1950: { v: 20,  kind: "estimated"  },
      1960: { v: 30,  kind: "estimated"  },
      1973: { v: 34,  kind: "estimated"  },
      1990: { v: 33,  kind: "estimated"  },
      2000: { v: 36,  kind: "estimated"  },
      2010: { v: 42,  kind: "estimated"  },
      2025: { v: 46,  kind: "estimated"  }
    }
  }
};

/* ---------------------------------------------------------------------
   2. RATIOS REGIONALES (reparto del dato continental)
   ---------------------------------------------------------------------
   Reflejan disparidades regionales documentadas en la literatura
   (p. ej. mayor renta histórica relativa en el sur -minería- y el
   norte -agricultura comercial/petróleo-, menor en África central).
   Se declaran dos puntos de referencia (1870 y 2025) y se interpola
   linealmente en el tiempo (en escala logarítmica para el PIB) para
   evitar simular una serie regional inexistente.
   Fuente de las disparidades: Frankema (2015); Broadberry & Gardner
   (2019); Banco Mundial, "Africa's Pulse" (disparidades actuales).
   ----------------------------------------------------------------- */
const REGIONAL_RATIOS = {
  gdpPerCapita: {
    1870: { north: 1.15, west: 0.95, central: 0.85, east: 0.90, south: 1.25 },
    2025: { north: 1.25, west: 0.70, central: 0.50, east: 0.60, south: 1.95 }
  },
  population: {
    // peso poblacional aproximado de cada región sobre el total continental
    1870: { north: 0.17, west: 0.28, central: 0.14, east: 0.27, south: 0.14 },
    2025: { north: 0.15, west: 0.30, central: 0.13, east: 0.30, south: 0.12 }
  },
  lifeExpectancy: {
    1870: { north: 1.08, west: 0.97, central: 0.92, east: 0.96, south: 1.10 },
    2025: { north: 1.08, west: 0.93, central: 0.85, east: 0.95, south: 1.02 }
  },
  literacy: {
    1870: { north: 1.1, west: 0.9, central: 0.8, east: 0.9, south: 1.2 },
    2025: { north: 1.15, west: 0.85, central: 0.75, east: 0.95, south: 1.25 }
  },
  urbanization: {
    1870: { north: 1.2, west: 0.9, central: 0.8, east: 0.85, south: 1.3 },
    2025: { north: 1.1, west: 0.95, central: 0.8, east: 0.85, south: 1.3 }
  },
  infraIndexRaw: {
    1870: { north: 1.2, west: 0.9, central: 0.75, east: 0.85, south: 1.3 },
    2025: { north: 1.15, west: 0.9, central: 0.7, east: 0.85, south: 1.4 }
  },
  institutionsIndexRaw: {
    1870: { north: 1.1, west: 1.0, central: 0.85, east: 0.95, south: 1.05 },
    2025: { north: 1.05, west: 0.95, central: 0.70, east: 0.90, south: 1.25 }
  }
};

/* ---------------------------------------------------------------------
   3. PARÁMETROS DE REFERENCIA PARA EL ESCENARIO B (hipótesis)
   ---------------------------------------------------------------------
   El Escenario B no es un dato: es un modelo de crecimiento compuesto
   cuyas tasas de referencia (valor "central"/por defecto) están ancladas
   en la experiencia de sociedades que NO sufrieron dominio colonial
   directo prolongado durante el mismo periodo, usadas como comparadores
   de orden de magnitud (nunca como "lo que habría pasado con certeza"):
     - Etiopía (nunca colonizada de forma duradera, salvo 1936-41)
     - Tailandia/Siam (independiente durante todo el periodo)
     - Japón Meiji -> years 1868-1912 (modernización autónoma, el caso
       mejor documentado de industrialización no colonial, usado como
       cota superior razonable, no como lo esperable para toda África)
     - Afganistán e Irán/Persia (independencia política, pero con
       inestabilidad y crecimiento económico muy bajo, usados como cota
       inferior realista frente a cualquier optimismo excesivo)
   El usuario puede mover estos parámetros en el panel de configuración;
   los valores por defecto están en el centro de la franja permitida.
   ----------------------------------------------------------------- */
const SCENARIO_B_DEFAULTS = {
  divergenceYear: 1885, // Conferencia de Berlín: inicio convencional del reparto colonial
  // Crecimiento ANUAL adicional (puntos porcentuales) del PIB per cápita
  // respecto a la tasa que de hecho tuvo el Escenario A en cada tramo.
  // Rango basado en diferenciales de crecimiento observados entre
  // economías coloniales y no coloniales comparables (Austin 2010;
  // Heldring & Robinson 2012 revisan ambas posturas de la literatura).
  gdpGrowthDelta: { min: -0.5, max: 1.2, default: 0.3, step: 0.05 },
  // Mortalidad/esperanza de vida: sin campañas sanitarias coloniales
  // (a veces reales, a veces sobreestimadas por la historiografía
  // colonial) pero también sin los shocks de trabajo forzado y las
  // grandes pandemias ligadas al contacto colonial intensivo.
  lifeExpectancyDelta: { min: -3, max: 4, default: 1, step: 0.5 }, // años en 2025
  // Ritmo de difusión tecnológica autónoma vía comercio, sin la red de
  // infraestructura extractiva (orientada al puerto) pero con posible
  // adopción más orgánica y menos destructiva de las industrias locales
  // (p. ej. artesanía textil, que la importación colonial desplazó).
  techDiffusionFactor: { min: 0.5, max: 1.4, default: 0.85, step: 0.05 },
  // Estabilidad político-institucional: posibilidad de Estados africanos
  // consolidando fronteras e instituciones propias sin la fragmentación
  // artificial de 1885, pero también sujetos a sus propios conflictos
  // internos, expansión de reinos vecinos, y presión externa no colonial.
  institutionsDelta: { min: -10, max: 20, default: 6, step: 1 }, // puntos de índice en 2025
  population: {
    // La población sin colonización pudo crecer algo más rápido (menos
    // trabajo forzado, menos hambrunas coloniales en ciertas regiones)
    // pero también pudo verse afectada igualmente por enfermedad y
    // conflictos locales. Delta en millones de personas en 2025.
    delta2025: { min: -100, max: 250, default: 60, step: 10 }
  }
};

/* ---------------------------------------------------------------------
   4. BIBLIOGRAFÍA
   ----------------------------------------------------------------- */
const REFERENCES = [
  {
    key: "maddison2018",
    text: "Bolt, J., Inklaar, R., de Jong, H. & van Zanden, J.L. (2018). Maddison Project Database, version 2018. Groningen Growth and Development Centre.",
    url: "https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2018"
  },
  {
    key: "prados2012",
    text: "Prados de la Escosura, L. (2012). Output per head in pre-independence Africa: quantitative conjectures. Economic History of Developing Regions, 27(2), 1-36.",
    url: "https://doi.org/10.1080/20780389.2012.745659"
  },
  {
    key: "frankema2015",
    text: "Frankema, E. (2015). African Economic Development: Growth, Reversals, and Deep Transitions, en Cambridge Economic History of Africa / documento de trabajo WUR.",
    url: "https://edepot.wur.nl/562233"
  },
  {
    key: "broadberry2019",
    text: "Broadberry, S. & Gardner, L. (2019). Economic Growth in Sub-Saharan Africa, 1885-2008: Evidence from Eight Countries. CAGE Working Paper 425.",
    url: "https://warwick.ac.uk/fac/soc/economics/research/centres/cage/manage/publications/425-2019_broadberry_and_gardner.pdf"
  },
  {
    key: "unwpp2024",
    text: "United Nations, Department of Economic and Social Affairs, Population Division (2024). World Population Prospects 2024.",
    url: "https://population.un.org/wpp/"
  },
  {
    key: "unwup2018",
    text: "United Nations, Department of Economic and Social Affairs (2018). World Urbanization Prospects 2018.",
    url: "https://population.un.org/wup/"
  },
  {
    key: "uis",
    text: "UNESCO Institute for Statistics. Adult literacy rate, population by region (serie histórica).",
    url: "https://uis.unesco.org/"
  },
  {
    key: "owid",
    text: "Our World in Data — series de esperanza de vida, alfabetización, urbanización y pobreza (Roser, Ritchie y colaboradores).",
    url: "https://ourworldindata.org/"
  },
  {
    key: "jedwab2016",
    text: "Jedwab, R. & Moradi, A. (2016). The Permanent Effects of Transportation Revolutions in Poor Countries: Evidence from Africa. Review of Economics and Statistics, 98(2).",
    url: "https://doi.org/10.1162/REST_a_00540"
  },
  {
    key: "wdi",
    text: "Banco Mundial. World Development Indicators (electrificación, telecomunicaciones, PIB).",
    url: "https://databank.worldbank.org/source/world-development-indicators"
  },
  {
    key: "ucdp",
    text: "Uppsala Conflict Data Program / PRIO. Armed Conflict Dataset.",
    url: "https://ucdp.uu.se/"
  },
  {
    key: "austin2010",
    text: "Austin, G. (2010). African Economic Development and Colonial Legacies. International Development Policy, 1.",
    url: "https://doi.org/10.4000/poldev.78"
  },
  {
    key: "heldring2012",
    text: "Heldring, L. & Robinson, J.A. (2012). Colonialism and Economic Development in Africa. NBER Working Paper 18566.",
    url: "https://www.nber.org/papers/w18566"
  },
  {
    key: "coquery2005",
    text: "Coquery-Vidrovitch, C. (2005). The History of African Cities South of the Sahara: From the Origins to Colonization. Markus Wiener Publishers.",
    url: "https://catalog.nypl.org/search/i1558763031"
  },
  {
    key: "manning2014",
    text: "Manning, P. (2014). African Population, 1650-2000: Comparisons and Implications of New Estimates. En: Akyeampong, E., Bates, R.H., Nunn, N. & Robinson, J. (eds.), Africa's Development in Historical Perspective, Cambridge University Press, pp. 131-150.",
    url: "https://www.cambridge.org/core/product/identifier/CBO9781139644594A011/type/BOOK_PART"
  },
  {
    key: "riley2005",
    text: "Riley, J.C. (2005). Estimates of Regional and Global Life Expectancy, 1800-2001. Population and Development Review, 31(3).",
    url: "https://doi.org/10.1111/j.1728-4457.2005.00083.x"
  }
];
