# África: dos historias posibles (1870–2025)

Simulación interactiva, 100% HTML/CSS/JavaScript (sin dependencias ni paso de
compilación), que compara la evolución histórica documentada del continente
africano (**Escenario A — con colonización europea**) con una hipótesis
razonada de lo que podría haber ocurrido sin dominio colonial directo
(**Escenario B — sin colonización**).

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo (o usa uno existente) y sube estos archivos tal
   cual: `index.html`, `style.css`, `data.js`, `model.js`, `app.js`,
   `README.md`.
2. En GitHub: *Settings → Pages → Source → Deploy from a branch*, elige la
   rama `main` y la carpeta `/ (root)`.
3. En uno o dos minutos la app estará disponible en
   `https://<tu-usuario>.github.io/<tu-repositorio>/`.

No hace falta `npm install`, servidor ni build: todo el código es estático.

## Estructura del proyecto

```
index.html   — estructura de la interfaz (mapa, línea temporal, paneles, gráficos)
style.css    — estilos
data.js      — anclas históricas, ratios regionales, parámetros del Escenario B, bibliografía
model.js     — ecuaciones de interpolación y del modelo contrafactual
app.js       — lógica de interfaz (sin librerías externas: gráficos dibujados a mano en <canvas>)
README.md    — este documento
```

## Las cuatro variables

| Dimensión | Variable principal usada en el modelo | Unidad |
|---|---|---|
| Economía | PIB per cápita | US$ internacionales de 1990 (Geary-Khamis), escala de Maddison Project |
| Población y calidad de vida | Población + Esperanza de vida al nacer | millones de habitantes / años |
| Tecnología e infraestructuras | Índice compuesto de infraestructura (ferrocarril/electrificación/telecomunicaciones) | índice 0–100 |
| Desarrollo político y social | Índice compuesto de estabilidad institucional + Alfabetización | índice 0–100 / % |

El enunciado del proyecto pedía explícitamente **no usar una puntuación
arbitraria de "civilización" o "progreso"**. Por eso los dos índices
compuestos (tecnología e instituciones) se documentan como lo que son:
construcciones propias que combinan proxies con series reales conocidas
(no una sola fuente oficial), y se etiquetan siempre como "estimado" o
"hipótesis", nunca como "histórico" cuando no lo son.

## Clasificación de los datos (muy importante)

Cada cifra que muestra la aplicación lleva una etiqueta:

- **Histórico**: procede directamente de una serie publicada para ese año o
  un año muy cercano (Maddison Project, UN WPP, UNESCO, Banco Mundial...).
- **Estimado**: es una reconstrucción o extrapolación académica para un
  periodo con datos escasos —típicamente antes de 1950, cuando no existen
  censos ni cuentas nacionales fiables para la mayoría de África—. Se cita
  siempre el estudio del que procede la extrapolación (p. ej. Prados de la
  Escosura 2012 para el PIB 1870–1950).
- **Hipótesis**: es un resultado del modelo del Escenario B, es decir,
  depende de los parámetros que el usuario fije en el panel de
  configuración. Nunca se presenta como un hecho.

No se ha completado ningún hueco de datos con una cifra inventada sin
justificar: donde la fuente solo da un rango o un orden de magnitud, se ha
tomado el valor central del rango y se declara como "estimado".

## El modelo matemático

### 1. Interpolación de las anclas históricas (Escenario A)

Los datos reales/estimados solo existen en años concretos ("anclas": 1870,
1900, 1913, 1950, 1960, 1973, 1990, 2000, 2010, 2025). Entre dos anclas
consecutivas `t0 < t1` con valores `V0, V1`, se interpola de dos formas
distintas según el tipo de variable:

- **Magnitudes de crecimiento compuesto** (PIB per cápita, población), que no
  pueden ser negativas y para las que tiene sentido económico una tasa de
  crecimiento anual constante dentro de cada tramo:

  V(t) = V0 · (V1 / V0) ^ ((t − t0) / (t1 − t0))

- **Magnitudes acotadas tipo porcentaje o índice** (esperanza de vida,
  alfabetización, urbanización, índices 0–100), donde una interpolación
  lineal es más prudente que una exponencial cuando el rango es estrecho:

  V(t) = V0 + (V1 − V0) · (t − t0) / (t1 − t0)

### 2. Reparto regional

No existen series fiables año a año por región para todo el periodo
1870–2025. Para repartir el dato continental entre las cinco regiones se usa
un **ratio relativo documentado en la literatura regional** (ver
`REGIONAL_RATIOS` en `data.js`), declarado en dos puntos de referencia (1870
y 2025) e interpolado linealmente en el tiempo:

ratio(r, t) = ratio_1870(r) + (ratio_2025(r) − ratio_1870(r)) · (t − 1870) / (2025 − 1870)

X_región(r, t) = X_continental(t) · ratio(r, t)

Esto es una **simplificación declarada**, no una serie regional
independiente: su objetivo es mostrar que las disparidades regionales
existen y han evolucionado (por ejemplo, el sur y el norte del continente
con rentas relativas más altas que el centro, de forma consistente con la
historiografía citada), sin fingir una precisión que los datos disponibles
no permiten.

### 3. Escenario B — la hipótesis contrafactual

El Escenario B **no es una serie de datos**: es la salida de un modelo con
parámetros ajustables. Su construcción:

1. **Antes del año de divergencia** (por defecto 1885, la Conferencia de
   Berlín), Escenario B = Escenario A. No tiene sentido simular una historia
   alternativa para un periodo en el que el dominio colonial directo aún no
   se había impuesto en la mayor parte del continente.

2. **A partir del año de divergencia**, para cada tramo `[t0, t1]` del
   Escenario A se calcula su tasa de crecimiento (o variación) implícita:

   - Variables de crecimiento compuesto: `g_A = (V1/V0)^(1/(t1−t0)) − 1`
   - Variables acotadas: `Δ_A = (V1 − V0) / (t1 − t0)`

   y se construye la trayectoria del Escenario B sumando un **delta definido
   por el usuario** en el panel de configuración:

   - `g_B = g_A + delta_PIB`   →  `V_B(t) = V_B(t0) · (1+g_B)^(t−t0)`
   - `Δ_B = Δ_A + delta_anual` →  `V_B(t) = V_B(t0) + Δ_B · (t−t0)`, con un
     tope (clamp) en el rango físicamente razonable de cada variable (p. ej.
     0–100 para los índices, 15–85 años para la esperanza de vida).

De este modo el Escenario B siempre:
- Comparte la misma base histórica que el A antes de 1885.
- Se aparta de A de forma proporcional y acotada por los parámetros, nunca
  de forma arbitraria.
- Puede terminar **mejor, igual o peor** que el Escenario A en 2025, según
  los parámetros elegidos — tal y como pedía el enunciado del proyecto, que
  explícitamente prohíbe asumir que la ausencia de colonización habría sido
  necesariamente mejor.

### 4. Calibración de los parámetros por defecto del Escenario B

Los valores centrales (por defecto) de los parámetros no se han inventado:
están anclados en el **orden de magnitud** de comparadores históricos reales
de sociedades que no sufrieron un dominio colonial directo prolongado
durante el mismo periodo:

- **Etiopía** (independiente salvo la ocupación italiana de 1936–1941):
  crecimiento económico lento y muy irregular, con periodos de inestabilidad
  política importantes — usada como aviso frente al optimismo excesivo.
- **Tailandia/Siam**: independencia política mantenida durante todo el
  periodo colonial, con modernización gradual del Estado y la economía.
- **Japón de la era Meiji (1868–1912)**: el caso mejor documentado de
  industrialización autónoma sin colonización — se usa como **cota
  superior** razonable, no como lo esperable para toda África.
- **Afganistán e Irán/Persia**: independencia formal pero con inestabilidad
  política recurrente y crecimiento económico muy bajo durante buena parte
  del siglo XX — usados como **cota inferior** realista.

El rango permitido en cada control del panel de configuración (mínimo y
máximo del slider) se corresponde aproximadamente con el abanico de
resultados observado entre estos comparadores. El valor por defecto se sitúa
en el centro de ese abanico, ligeramente optimista en el PIB per cápita y la
tecnología (reflejando que el comercio y la difusión tecnológica no se
habrían detenido sin colonización) pero prudente en instituciones y
población (reflejando que los conflictos internos, las enfermedades y los
reequilibrios de poder regionales habrían seguido existiendo con o sin
dominio europeo).

**El usuario puede mover libremente estos parámetros** para explorar
hipótesis más optimistas, más pesimistas o mixtas (p. ej. mejor economía
pero peor estabilidad institucional).

## Limitaciones reconocidas

- El reparto regional es una simplificación basada en ratios, no en series
  independientes por región para cada año.
- Los índices de tecnología e instituciones son construcciones propias
  (proxies), no series oficiales únicas; se documentan como tales.
- El Escenario B es, por diseño, una hipótesis exploratoria. Cambiar los
  parámetros cambia el resultado; no existe "el" resultado correcto del
  Escenario B, y la aplicación no pretende ofrecer uno.
- El mapa de la interfaz es esquemático (divide el continente en 5 zonas
  aproximadas para la interacción), no un mapa cartográfico preciso.
- Antes de 1950 los datos de PIB, población y esperanza de vida llevan una
  incertidumbre considerable, señalada explícitamente en la literatura
  citada y heredada por esta aplicación (etiqueta "Estimado").

## Bibliografía completa

Ver la lista completa, con enlaces, en el array `REFERENCES` de `data.js`, y
también en la pantalla "Metodología, ecuaciones y fuentes" dentro de la
propia aplicación. Incluye, entre otras: Maddison Project Database (2018),
Prados de la Escosura (2012), Frankema (2015), Broadberry & Gardner (2019),
Naciones Unidas (World Population Prospects 2024, World Urbanization
Prospects 2018), UNESCO Institute for Statistics, Our World in Data, Jedwab
& Moradi (2016), Banco Mundial (World Development Indicators), Uppsala
Conflict Data Program, Austin (2010) y Heldring & Robinson (2012).
