// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Journey editorial "Centro Histórico — El futuro se pintó aquí".
 *
 * ---------------------------------------------------------------------------
 * SEPARACIÓN DE CONTENIDO
 * Solo contenido. La presentación vive en components/journeys/CentroJourney.tsx.
 * ---------------------------------------------------------------------------
 *
 * ---------------------------------------------------------------------------
 * ALCANCE DE LA GEOGRAFÍA
 * Las ubicaciones son ILUSTRATIVAS y ORIENTATIVAS, a propósito: describen
 * zonas y direcciones a pie, no coordenadas ni "punto exacto". El visitante
 * camina, no navega por un marcador. Por eso `location` dice "barrio" o
 * "tramo", y la ruta se lee como un hilo de barrios, no como una lista de
 * pines.
 *
 * ---------------------------------------------------------------------------
 * RIGOR HISTÓRICO
 * Estados de un enunciado:
 *   'documentado' -> contrastado en las fuentes de SOURCES.
 *   'interpretacion' -> lectura de Amaxing, señalada como tal.
 *   'pendiente'   -> no se pudo verificar; no se publica como hecho.
 *
 * Puntos donde NO se afirma más de lo verificado:
 *  - Rivera y Orozco NO están enfrentados ni se ven a la vez: los dos murales
 *    están en el tercer piso, Rivera en el muro poniente y Orozco en el
 *    oriente. Hay un paseo entre ellos.
 *  - "Katharsis" se describe con la lectura oficial del INBAL.
 *  - El hundimiento del Palacio por debajo del nivel de la calle viene de una
 *    fuente secundaria: se menciona como aproximación, no como cifra.
 *  - La "marca de agua" junto a Madero que se mencionaba en el guion original
 *    NO se ha podido identificar. Se sustituye por el Salto del Agua, que sí
 *    está documentado y es el lugar donde llegaba el agua del acueducto.
 *  - El águila y la serpiente NO se ubican en Pino Suárez: el motivo está en
 *    el balcón principal del Palacio Nacional, "La Aguilita", y en la clave de
 *    la fachada del Palacio de Bellas Artes.
 *  - No se promete duración garantizada ni disponibilidad de mesas.
 * ---------------------------------------------------------------------------
 */

const IMG = '/static/images/journeys/centro'

/**
 * Fotografías verificadas. Todas de Wikimedia Commons, con licencia comprobada
 * y crédito en public/static/images/journeys/centro/CREDITS.md
 */
export const CENTRO_PHOTOS = {
  zocalo: {
    src: `${IMG}/zocalo-aereo.jpg`,
    alt: 'Vista aérea del Zócalo de la Ciudad de México: la plancha de la plaza, la Catedral Metropolitana y el Palacio Nacional.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  temploMayor: {
    src: `${IMG}/templo-mayor.jpg`,
    alt: 'Ruinas del Templo Mayor en el Centro Histórico de la Ciudad de México.',
    credit: 'Wikimedia Commons, CC BY 4.0',
  },
  balcon: {
    src: `${IMG}/balcon-nacional.jpg`,
    alt: 'Balcón principal del Palacio Nacional, en la fachada que da al Zócalo.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  saltoAgua: {
    src: `${IMG}/salto-del-agua.jpg`,
    alt: 'Fuente de Salto del Agua en la Ciudad de México.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  saltoAguaLitografia: {
    src: `${IMG}/salto-del-agua-litografia.jpg`,
    alt: 'Litografía de la Fuente del Salto del Agua por Casimiro Castro.',
    credit: 'Wikimedia Commons, dominio público',
  },
  saltoAguaOriginal: {
    src: `${IMG}/salto-del-agua-original.jpg`,
    alt: 'Fuente original de Salto del Agua, realizada en 1779 y conservada en Tepotzotlán, Estado de México.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  azulejos: {
    src: `${IMG}/casa-azulejos.jpg`,
    alt: 'Fachada de la Casa de los Azulejos, revestida de talavera poblana.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  azulejos1858: {
    src: `${IMG}/casa-azulejos-1858.jpg`,
    alt: 'La Casa de los Azulejos de la Ciudad de México en una imagen de 1858, durante la Reforma.',
    credit: 'Wikimedia Commons, dominio público',
  },
  madero: {
    src: `${IMG}/madero.jpg`,
    alt: 'Corredor peatonal de Francisco I. Madero en el Centro Histórico.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  bellasArtes: {
    src: `${IMG}/bellas-artes-fachada.jpg`,
    alt: 'Fachada del Palacio de Bellas Artes durante los trabajos de restauración de 2026.',
    credit: 'Wikimedia Commons, CC BY 4.0',
  },
  keystone: {
    src: `${IMG}/bellas-artes-keystone.jpg`,
    alt: 'Clave de la fachada del Palacio de Bellas Artes en forma de cabeza de guerrero águila mexica.',
    credit: 'Wikimedia Commons, CC BY 4.0',
  },
  rivera: {
    src: `${IMG}/rivera-hombre-controlador.jpg`,
    alt: 'El hombre controlador del universo, fresco de Diego Rivera en el Palacio de Bellas Artes.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  lenin: {
    src: `${IMG}/rivera-lenin.jpg`,
    alt: 'Detalle del retrato de Lenin en el panel izquierdo de El hombre controlador del universo.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  katharsis: {
    src: `${IMG}/orozco-katharsis.jpg`,
    alt: 'Katharsis, fresco de José Clemente Orozco en el Palacio de Bellas Artes.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  alameda: {
    src: `${IMG}/alameda.jpg`,
    alt: 'Alameda Central de la Ciudad de México.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  alamedaXX: {
    src: `${IMG}/alameda-siglo-xx.jpg`,
    alt: 'Vista aérea del Centro Histórico en el siglo XX; la Alameda Central es la masa arbolada del primer plano.',
    credit: 'Wikimedia Commons, dominio público',
  },
  museoMural: {
    src: `${IMG}/museo-mural.jpg`,
    alt: 'Fachada del Museo Mural Diego Rivera en Balderos y Colón.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  donceles: {
    src: `${IMG}/donceles-librerias.jpg`,
    alt: 'Librerías de viejo alineadas a lo largo de la calle Donceles.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  uruguay: {
    src: `${IMG}/calle-uruguay.jpg`,
    alt: 'Calle República de Uruguay en el Centro Histórico.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  ideal: {
    src: `${IMG}/pasteleria-ideal.jpg`,
    alt: 'Pastelería Ideal en la calle República de Uruguay.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
}

/** Tipos de bloque de descubrimiento. */
export const CENTRO_DISCOVERY_KINDS = {
  documentado: { label: 'Historia documentada', tone: 'documentado' },
  curiosidad: { label: 'Dato curioso', tone: 'curiosidad' },
  interpretacion: { label: 'Interpretación de Calpulli CDMX', tone: 'interpretacion' },
}

export const CENTRO_DISCOVERIES = [
  {
    id: 'tianguis-alameda',
    kind: 'documentado',
    title: 'El tianguis que se volvió Alameda',
    title_en: 'The market that became the Alameda',

    body: 'La Alameda Central se trazó, a principios de 1592, sobre un cuadrado de lo que era la plaza o tianguis de Juan Velázquez, al sur de la Calzada de Tacuba. El mercado no desapareció: cambió de nombre y de forma. Es el mismo tipo de superposición que se repite en todo el Centro.',
    body_en:
      'The Zócalo was not always a square. Before the Spanish arrived, the western side was Tlachinolco: a neighbourhood of canoes, workshops and vendors. After the Conquest it became the great market of the city, and when the plaza was laid out the market moved a few streets west, to where the Alameda is today. The city did not erase the market. It moved it, and then named the new place after the trees that were planted there.',
    source: 'Alameda Central, historia',
  },
  {
    id: 'agua-1629',
    kind: 'documentado',
    title: 'La inundación de 1629',
    title_en: 'The flood of 1629',

    body: 'El Tajo de Nochistongo, construido con un presupuesto bajo y mala calidad, se vino abajo. Al cerrarlo, la Ciudad de México sufrió la peor inundación de su historia: duró cerca de cuatro años, alcanzó dos metros de profundidad y se estima que costó la vida a cerca de 20.000 personas. El ducts que lo ordenaba se rehízo dos veces antes de sostenerse.',
    body_en:
      'The city tried to drain the lake, and the attempt made things worse. The Tajo de Nochistongo, built on a low budget and badly, collapsed; the year the works were closed to repair it came the worst flood in the history of Mexico City: about four years under water, two metres deep, and an estimated twenty thousand dead. It took decades to rebuild the drainage, and the city that came out of it was not the one that went in.',
    source: 'Revista Digital Universitaria, UNAM',
  },
  {
    id: 'rio-nueva-avenida',
    kind: 'curiosidad',
    title: 'Un río que hoy es una avenida',
    title_en: 'A river that is an avenue today',

    body: 'El último canal que atravesaba la ciudad, el de La Viga, se cerró en 1938 y fue sustituido por una avenida. Los ríos Churubusco, Remedios, Consulado y La Piedad corrieron la misma suerte entre 1954 y 1957. Caminar por esas avenidas es caminar sobre agua que se dejó de ver.',
    body_en:
      'In 1938 the last canal crossing the city, La Viga, was closed and replaced by an avenue. Between 1954 and 1957 the Churubusco, Remedios, Consulado and La Piedad rivers were covered over in the same way. The map of the Centro shows no water, but the ground remembers: these are arteries that no longer carry blood and still run downhill to the south, where the water always went.',
    source: 'Revista Digital Universitaria, UNAM',
  },
  {
    id: 'lectura-actual',
    kind: 'interpretacion',
    title: 'La lectura que hacemos nosotros',
    title_en: 'The reading we make',

    body: 'Katharsis habla, en 1934, de la guerra, el maquinismo y las políticas de masas. Leerlo hoy, a la luz de las máquinas que escriben y deciden, es una tentación legítima. Pero es nuestra lectura, no la intención de Orozco. Por eso va marcada como tal en toda la página.',
    body_en:
      "There is a difference between what a piece documents and what we make of it. This block is the second kind, and it is marked as such: it is our reading, not the museum's voice.",
    source: 'Interpretación de Calpulli CDMX',
  },
]

/**
 * Fuentes consultadas. Se conservan en el código para que cualquier corrección
 * futura tenga un punto de partida y no una suposición.
 */
export const CENTRO_SOURCES = [
  {
    id: 'mpba-visita',
    label: 'Museo del Palacio de Bellas Artes (INBAL) — Horario y ubicación',
    url: 'https://museopalaciodebellasartes.inba.gob.mx/',
  },
  {
    id: 'mpba-katharsis',
    label: 'MPBA (INBAL) — Katharsis, ficha oficial',
    url: 'https://museopalaciodebellasartes.inba.gob.mx/katharsis/',
  },
  {
    id: 'mpba-murales',
    label: 'MPBA (INBAL) — Murales, colección permanente',
    url: 'https://museopalaciodebellasartes.inba.gob.mx/murales-coleccion-permanente/',
  },
  {
    id: 'mmdr-visita',
    label: 'Museo Mural Diego Rivera (INBAL) — Información al visitante',
    url: 'https://museomuraldiegorivera.inba.gob.mx/museo/informaci%C3%B3n-al-visitantes.html',
  },
  {
    id: 'inba-mmdr',
    label: 'INBAL — Museo Mural Diego Rivera: historia del mural y su traslado',
    url: 'https://inba.gob.mx/recinto/46/museo-mural-diego-rivera',
  },
  {
    id: 'unam-agua',
    label:
      'UNAM, Revista Digital Universitaria — La historia del agua y el drenaje del Valle de México',
    url: 'https://www.revista.unam.mx/vol.12/num10/art96/art96.pdf',
  },
  {
    id: 'cdmx-turismo',
    label: 'Portal de Turismo de la Ciudad de México — Guía a pie del Centro Histórico',
    url: 'https://mexicocity.pre.cdmx.gob.mx/locations/centro-historico/',
  },
  {
    id: 'cdmx-donceles',
    label: 'Portal de Turismo de la Ciudad de México — Calle Donceles',
    url: 'https://mexicocity.cdmx.gob.mx/tag/donceles-virtual-tour/',
  },
  {
    id: 'ideal-sucursales',
    label: 'Pastelería Ideal — Sucursales (oficial)',
    url: 'https://www.pasteleriaideal.com/sucursales',
  },
  {
    id: 'ortiz-subsidence',
    label:
      'Ortiz-Zamora & Ortega-Guerrero — Evolución del hundimiento de la Ciudad de México, Water Resources Research (2010)',
    url: 'https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2008WR007398',
  },
]

/**
 * La ruta, por zonas. `walk` son minutos a pie estimados y `note` es la
 * dirección que se da al visitante, no un punto exacto.
 */
export const CENTRO_ROUTE = [
  {
    zone: 'Zócalo',
    walk: 0,
    note: 'Punto de partida y de regreso. La plancha de la plaza y el borde de la zona arqueológica.',
  },
  {
    zone: 'Corredor sur',
    walk: 7,
    note: 'Hacia el sur, por el eje que baja a la Merced. Un tramo de tlachería,Commerce y autos.',
  },
  {
    zone: 'Salto del Agua',
    walk: 7,
    note: 'Subir por el Eje Central. Aquí se cruza con el agua que la ciudad_PTR primero bebió del acueducto.',
  },
  {
    zone: 'Madero',
    walk: 10,
    note: 'El corredor peatonal, de largo y sin tráfico. Casa de los Azulejos al pasar, a media cuadra del cruce.',
  },
  {
    zone: 'Bellas Artes',
    walk: 9,
    note: 'El Palacio, en el cruce con Eje Central. Se entra por Eje Central y se sale por la Alameda.',
  },
  {
    zone: 'Alameda Central',
    walk: 4,
    note: 'El paseo, entre la fuente y el Panteón. Terraza de sombra, bancos, kiosco.',
  },
  {
    zone: 'Donceles',
    walk: 8,
    note: 'Módulo opcional. Una cuadra al norte, entre librerías de viejo.',
  },
  {
    zone: 'Plaza del Artesano',
    walk: 11,
    note: 'Sur por República de Uruguay. Número 75, casi esquina.',
  },
  {
    zone: 'Pastelería Ideal',
    walk: 1,
    note: 'Número 74, a una puerta. Se puede tomar algo de aquí o seguir de largo.',
  },
  { zone: 'Zócalo', walk: 6, note: 'Regreso por la misma calle, hacia el Zócalo.' },
]

/** Duración por momento, en minutos. Suman el recorrido de referencia. */
export const CENTRO_DURATIONS = {
  minimo: '2 h 20 min',
  realista: '3 h 20 min',
  relajado: '4 h 15 min',
}

/**
 * Los seis momentos del recorrido.
 */
export const CENTRO_MOMENTS = [
  {
    id: 'origen',
    featured: true,
    number: 1,
    title: 'El origen bajo la ciudad',
    title_en: 'The origin under the city',
    location: 'Zócalo y borde de la zona arqueológica',
    kicker: 'Hay algo debajo',
    duration_min: 20,
    image: 'zocalo',
    secondaryImage: 'temploMayor',
    lead: 'El Zócalo es la superficie más pisada de la ciudad y, al mismo tiempo, la que esconde más capas. Debajo de la plancha hay una ciudad anterior: un centro político y religioso, un sistema de diques y canales, y una ciudad que se hundió bajo sus propios pies. Este recorrido empieza mirando hacia abajo.',
    lead_en:
      'The Zócalo is the most walked-on surface in the city and, at the same time, the one that hides the most layers. Under the flagstones there is an older city: a political and religious centre, a system of dikes and canals, and a city that sank under its own feet. This walk starts by looking down.',
    steps: [
      {
        title: 'La plancha y el borde',
        title_en: 'The square and the edge',
        body: 'Antes de entrar en la zona arqueológica, conviene quedarse un momento en el borde y mirar el suelo. La plaza es una explanada construida sobre rellenos: no siempre estuvo al nivel de la calle. En ese thicken, la parte alta y la parte baja se leen de un vistazo, y esa diferencia de niveles es la primera pista de que aquí hubo agua debajo.',
        body_en:
          'Before going into the archaeological zone, it is worth staying at the edge and looking at the ground. The plaza is a platform built on fill: it was not always at street level. In that thickness, the high part and the low part can be read at a glance, and that difference in level is the first clue that there was water under here.',
        observe: [
          'El desnivel entre la plaza y elems museums borde arqueológico',
          'El tráfico y los puestos que se montan y desmontan sobre la misma plancha',
          'La diferencia entre la escala horizontal de la plaza y la vertical del Palacio Nacional',
        ],
        observe_en: [
          'The level difference between the plaza and the archaeological edge',
          'The traffic and the stalls that are set up and taken down on the same flagstones',
          'The horizontal scale of the square against the vertical one of the National Palace',
        ],
      },
      {
        title: 'Un centro político y religioso',
        title_en: 'A political and religious centre',

        body: 'Tenochtitlan se fundó en 1325 en un valle con varios lagos. Era una ciudad conectada por cuatro diques que servían a la vez de calzadas, con una infraestructura hidráulica sofisticada: canales, drenajes, chinampas, estanques y humedales artificiales. El Templo Mayor no era solo un templo: era la sede del poder. Lo que ves al borde de la zona arqueológica es la raíz de esa ciudad, no una ruina decorativa.',
        body_en:
          'The Templo Mayor was not only a temple. It was the seat of power: the ruler lived in the palace around it and the city was administered from there. Understanding the greatness of Tenochtitlan means understanding that the political and the sacred were the same thing, and that the pyramid was the mountain that held both.',
        observe: [
          'Las bases de piedra que}\\n          ordenan la zona: lo que hubo arriba era mucho mayor de lo que cabe hoy',
          'La posición del conjunto respecto a la plaza: el centro de poder estaba aquí y el mercado estaba al oeste',
        ],
        observe_en: [
          'The scale of the platform against the buildings that stood on it',
          'How the temple dominated every approach to the city',
        ],
      },
      {
        title: 'El balcón que se llama La Aguilita',
        title_en: 'The balcony called La Aguilita',

        body: 'El balcón principal del Palacio Nacional, en la fachada que da a la plaza, se conoce oficialmente como La Aguilita. Desde ahí seciplina la historia del encuentro entre dos sociedades que se cuenta en el Zócalo, y de las cuales la ciudad conserva muy poco más que la posición. Si buscas el motivo del águila y la serpiente en esta zona, no está en la calle de al lado: la ciudad lo puso en la fachada de su propio edificio de gobierno.',
        body_en:
          "The main balcony of the National Palace carries a name that has nothing to do with the building: La Aguilita, the little eagle. It is the balcony from which the city was addressed, and it is the place where the encounter between two societies is told in the city's own version. Watch the stonework up close: the coat of arms is there, and it is a nineteenth-century carving.",
        observe: [
          'La escala del balcón frente a la altura de la plaza',
          'La relación entre la fachada del Palacio y el Templo Mayor, a doscientos metros de distancia',
        ],
        observe_en: [
          'The carving of the coat of arms in the stone',
          'How the balcony is looked at from the square, and from above',
        ],

        pending:
          'La fachada del Palacio Nacional estaba en restauración durante 2026, y los trabajos pueden alterar la vista. Confirma el estado antes de la visita.',
        pending_en:
          'The National Palace façade was under restoration during 2026, and the works may change what you see. Check the state before you visit.',
      },
    ],
    next_hint: 'Baja hacia el sur por el corredor que conecta con la Merced.',
  },
  {
    id: 'encuentro',
    number: 2,
    title: 'El encuentro y la ruptura',
    title_en: 'The encounter and the rupture',
    location: 'Corredor sur, entre el Zócalo y la Merced',
    kicker: 'No fue un solo encuentro',
    duration_min: 20,
    image: 'uruguay',
    lead: 'La conquista no es un episodio con dos personajes: es un proceso que destruye una infraestructura, reduce a la población y reordena la ciudad durante décadas. Y el modo en que esta ciudad resolvió la ruptura es el mismo con el que resuelve casi todo: construyendo encima.',
    lead_en:
      'The Conquest is not a story with two characters in it: it is a process that destroys infrastructure, shrinks a population and reorders a city for decades. And the way this city answered the rupture is the way it answers almost everything: by building on top.',
    steps: [
      {
        title: 'La ruptura también fue hidráulica',
        title_en: 'The rupture was hydraulic too',
        body: 'Cuando llegaron los españoles en 1519, Tenochtitlan ocupaba unos nueve kilómetros cuadrados y estaba conectada a los lagos. La infraestructura hidráulica indígena fue destruida; después se reconstruyó parte, en particular el acueducto del Salto del Agua, que traía el agua de los manantiales de Chapultepec, y un segundo acueducto desde Santa Fe. El agua volvía a llegar, pero a otra ciudad y bajo otro control. Las fuentes públicas, las casas, los hospitales y los conventos se surtieron de un sistema que antes no existía.',
        body_en:
          'When the Spanish arrived in 1519, Tenochtitlan covered some nine square kilometres and was connected to the lakes. The Indigenous hydraulic infrastructure was destroyed; part of it was later rebuilt, in particular the Salto del Agua aqueduct, which brought water from the Chapultepec springs, and a second aqueduct from Santa Fe. The water came back, but to a different city and under a different control. Public fountains, houses, hospitals and convents were supplied by a system that had not existed before.',
        observe: [
          'El corredor sur es el eje comercial que baja al mercado: el mismo eje por el que se movía la carga hacia el sur',
          'Las fuentes y los patios de agua que aparecen en las fachadas de las casas del corredor',
        ],
        observe_en: [
          'The southern corridor is the commercial axis that runs down to the market: the same route the cargo took',
          'The fountains and water patios that appear on the facades along the corridor',
        ],
      },
      {
        title: 'Una ciudad que se vació y se llenó de otra cosa',
        title_en: 'A city that emptied and filled with something else',
        body: 'A partir de 1555 las inundaciones fueron frecuentes: en 1604, en 1607 y de forma catastrófica en 1629, cuando una inundación de cerca de cuatro años alcanzó dos metros y se estima que costó la vida a unos 20.000 personas. La ciudad no se recuperó igual: se reordenó por completo, con un nuevo trazo, nuevasault authorities y otra relación con el agua. El Zócalo que vemos no es el mismo Zócalo de 1520, y sin embargo está en el mismo lugar.',
        body_en:
          'From 1555 the floods were frequent: 1604, 1607, and catastrophically 1629, when a flood lasting about four years reached two metres and is estimated to have cost the lives of some 20,000 people. The city did not recover the same way: it was completely reordered, with a new layout, new authorities and a new relationship with water. The Zócalo we see is not the Zócalo of 1520, and yet it is in the same place.',
        observe: [
          'La diferencia de densidad y altura entre los bloques.rename del siglo XVI y lasManifestations decimonónicas',
          'Qué se ha mantenido del trazo original y qué se ha rehecho',
        ],
        observe_en: [
          'The difference in density and height between the blocks of the sixteenth century and the later ones',
          'What was kept of the original layout and what was redone',
        ],
      },
      {
        title: 'Lo que quedó debajo',
        title_en: 'What was left underneath',
        body: 'Toda esta secuencia se puede leer en un solo hecho: el subsuelo del Centro se hundió. La sobreexplotación del acuífero llegó a producir hundimientos de hasta cincuenta centímetros por año en algunos puntos, y la ciudad llegó a hundir entre siete y diez metros, según la zona, a lo largo del siglo XX. Los edificios del Centro no están donde se construyeron. Están más abajo. Eso explica cosas que se ven caminando: ventanas al nivel de la banqueta, plantas bajas medio metro por debajo de la acera, Caller swings que no coinciden.',
        body_en:
          'The whole sequence can be read in a single fact: the subsoil of the centre sank. Overexploitation of the aquifer produced subsidence of up to fifty centimetres a year in some places, and by the twentieth century the city had sunk between seven and ten metres, depending on the area. The buildings of the Centro are not where they were built. They are lower. That explains things you see while walking: windows at pavement level, ground floors half a metre below the sidewalk, doorways that no longer line up.',
        observe: [
          'Las plantas bajas de los edificios coloniales, a nivel del suelo o por debajo',
          'Los escalones de entrada de las casas del corredor, con desgaste desigual',
        ],
        observe_en: [
          'The ground floors of the colonial buildings, at street level or below it',
          'The worn and uneven steps of the doorways along the corridor',
        ],
      },
    ],
    next_hint: 'Sube por el Eje Central hasta el Salto del Agua.',
  },
  {
    id: 'agua',
    featured: true,
    number: 3,
    title: 'La ciudad del agua y sus transformaciones',
    title_en: 'The city of water and its transformations',
    location: 'Salto del Agua, corredor de Madero y Casa de los Azulejos',
    kicker: 'Agua, urbe y suelo',
    duration_min: 30,
    image: 'saltoAgua',
    secondaryImage: 'azulejos',
    lead: 'El agua no es un tema aparte en esta ciudad: es el tema. Condicionó la forma de la ciudad antigua, la hizo vulnerable, y su pérdida gradual la está transformando otra vez. Recorrer el Eje Central y el corredor de Madero es recorrer doscientos años de relación con el agua en una sola tarde.',
    lead_en:
      'Water is not a separate subject here: it is the subject. It shaped the old city, made it vulnerable, and its slow loss is transforming it again. Walking the Eje Central and the Madero corridor is walking two hundred years of that relationship in a single afternoon.',
    steps: [
      {
        title: 'Donde el agua llegaba',
        title_en: 'Where the water arrived',
        body: 'La fuente del Salto del Agua está donde terminaba el acueducto que traía el agua de Chapultepec a la ciudad: el primer gran metabolite doméstico del virreinato, construido después de que los españoles destruyeran el sistema anterior. La fuente original, de 1779, se conserva en Tepotzotlán, en el Estado de México; en la ciudad se conserva una versión. Es un recordatorio físico de algo que no se ve: el agua llegaba desde el oeste, por gravity, con un desnivel.',
        body_en:
          'The Salto del Agua fountain stands where the aqueduct that brought water from Chapultepec to the city ended: the great domestic work of the viceregal period, built after the Spanish destroyed the previous system. The original fountain, from 1779, is kept in Tepotzotlán, in the State of Mexico; what stands in the city is a version of it. It is a physical reminder of something you cannot see: the water arrived from the west, by gravity, with a drop.',
        observe: [
          'La fontbrería de la fuente y el lugar donde brota: el agua sube desde abajo',
          'La litografía de Casimiro Castro que muestra la misma fuente hace más de un siglo, en la sección de créditos',
        ],
        observe_en: [
          'The spout of the fountain and the place where the water comes up',
          'Casimiro Castro lithograph of the same fountain, over a century ago, in CREDITS',
        ],
      },
      {
        title: 'Un río que se volvió avenida',
        title_en: 'A river that became an avenue',
        body: 'En 1938 se cerró el último canal que atravesaba la ciudad, el de La Viga, y fue sustituido por una avenida. Entre 1954 y 1957, los ríos Churubusco, Remedios, Consulado y La Piedad fueron igualmente cubiertas. El mapa actual del Centro no muestra agua, pero el suelo sí la recuerda: son arterias que ya no llevan sangre, y que siguen bajando hacia el sur por donde el agua siempre se fue.',
        body_en:
          'In 1938 the last canal crossing the city, La Viga, was closed and replaced by an avenue. Between 1954 and 1957 the Churubusco, Remedios, Consulado and La Piedad rivers were covered over in the same way. The map of the Centro today shows no water, but the ground remembers it: these are arteries that no longer carry blood, and that still run downhill to the south where the water always went.',
        observe: [
          'La anchura de las avenidas del sur comparada con la de las calles peatonales del centro',
          'El desnivel del corredor de Madero y cómo te hace caminar',
        ],
        observe_en: [
          'The width of the southern avenues compared with the pedestrian streets of the centre',
          'The slope of the Madero corridor and how it makes you walk',
        ],
      },
      {
        title: 'Madero: la calle que se inventó',
        title_en: 'Madero: the street that was invented',
        body: 'El corredor peatonal de Francisco I. Madero no es una calle antigua: es una decisión administrativa reciente que cubrió el tráfico para devolverle el centro a la gente. Por eso funciona como un observatorio: en dos cuadras se ven el barroco de los portales, las mashed-ups decimonónicas, las fachadas Art déco y los escaparates, todo en la misma línea de fuga. Y por eso, al llegar a Casa de los Azulejos, el material de la fachada —talavera poblana, verde y azul— funciona como una respuesta: aquí, la ciudad se decora con cerámica.',
        body_en:
          'The Madero pedestrian corridor is not an old street: it is a recent administrative decision that closed the traffic to give the centre back to people. That is why it works as a viewpoint: in two blocks you see the Baroque of the portales, the nineteenth-century façades, the Art Deco and the shopfronts, all on the same line of sight. And that is why, on reaching Casa de los Azulejos, the glazed façade answers back: here the city decorates itself with ceramic.',
        observe: [
          'La secuencia de estilos en una sola cuadra: barroco, neoclásico, art déco',
          'La azuleja de la fachada de los Azulejos: no es pintura, es cerámica de fired',
          'La diferencia de altura entre los portales y las rexglas de los Siglos',
        ],
        observe_en: [
          'The sequence of styles along a single block: Baroque, Neoclassical, Art Deco',
          'The tiles on the Azulejos façade: it is not paint, it is fired ceramic',
          'The difference in height between the portales and the later façades',
        ],
      },
    ],
    next_hint: 'Sigue por Madero hasta el Palacio de Bellas Artes.',
  },
  {
    id: 'bellas-artes',
    featured: true,
    number: 4,
    title: 'El futuro se pintó aquí',
    title_en: 'The Future Was Painted Here',
    location: 'Interior del Palacio de Bellas Artes',
    kicker: 'El momento central',
    hero: true,
    duration_min: 60,
    image: 'rivera',
    secondaryImage: 'katharsis',
    lead: 'Dos frescos gigantes del mismo año, en el mismo piso, en extremos opuestos del edificio. Uno lo pintó un mexicano en Nueva York, para un rascacielos, y lo trajo censurado. El otro lo pintó aquí, y habla de máquinas, de guerra y de multitudes. El debate que plantaron sigue abierto, y no por casualidad se parece al de hoy.',
    lead_en:
      'Two giant frescoes from the same year, on the same floor, at opposite ends of the building. One was painted by a Mexican in New York for a skyscraper, and brought back censored. The other was painted here, and talks about machines, war and crowds. The argument they opened is still open, and it does not look unlike ours.',
    steps: [
      {
        title: 'Un encargo de Nueva York, una censura y un viaje',
        title_en: 'A commission from New York, a censorship and a journey',

        body: 'El hombre controlador del universo, de Diego Rivera, no se pintó en México. Se pintó en 1933 por encargo del Centro Rockefeller de Nueva York. Allí lo censuraron: el retrato de Lenin en el panel izquierdo provocó la destrucción de la obra. Rivera la repitió aquí, en el Palacio de Bellas Artes, y en esta versión añadió a Trotsky y a Marx, que no estaban en el original. La obra que parece mexicana por su ubicación nació de un encargo estadounidense y de una censura. Eso ya es un debate sobre quién decide qué se representa.',
        body_en:
          'The painting was not made in Mexico. It was commissioned in 1933 for the Rockefeller Center in New York, where it was censored for the portrait of Lenin, and it was destroyed. Rivera remade it here, in the Palacio de Bellas Artes, and this time he added Trotsky and Marx, who were not in the original. A work that looks Mexican by its location was born from an American commission and a censorship. That is already an argument about who decides what gets represented.',
        observe: [
          'El retrato de Lenin en el panel izquierdo: lo que en Nueva York hubo que borrar',
          'La máquina, la energía y el trabajo en el centro de la composición',
          'Los automóviles, el avión, el teléfono: los objetos de la modernidad, dibujados con detalle',
        ],
        observe_en: [
          'The portrait of Lenin in the left panel: what had to be erased in New York',
          'The machine, the energy and the work at the centre of the composition',
          'The cars, the plane, the cell: the objects of modernity, drawn in detail',
        ],
      },
      {
        title: 'Katharsis: la guerra, el maquinismo, las masas',
        title_en: 'Katharsis: war, machinery, the masses',

        body: 'Katharsis, de José Clemente Orozco, es un fresco sobre bastidor de 446 por 1146 centímetros, pintado entre 1934 y 1935. La ficha oficial del museo lo describe como una crítica en torno a la guerra, el maquinismo y las políticas de masas en la era moderna. En el centro, una lucha violenta entre dos hombres se abre en espiral y se funde con armas de alto calibre, máquinas monstruosas, cuerpos acribillados y una muchedumbre en protesta, en medio de un paisaje apocalíptico. Tres prostitutas remiten a las políticas higienistas y a la hipocresía de su aplicación durante el Maximato. Y arriba, las llamas intensas simbolizan el fuego purificador que dará origen a una sociedad nueva.',
        body_en:
          'The fresco is 446 by 1146 centimetres, painted in 1934. The official description calls it a criticism of war, machinery and mass politics in the modern age. At the centre, a violent struggle between two men opens in a spiral and merges with heavy weapons, monstrous machines, riddled bodies and a protesting crowd, in an apocalyptic landscape. Three prostitutes stand for the hygienist policies and the hypocrisy of their application. And at the top, the intense flames symbolise the purifying fire that will give rise to a new society.',
        observe: [
          'La espiral: la lucha no se queda en el centro, se abre hacia fuera',
          'La figura recostada en tonos verdes, en la parte baja',
          'Las llamas de la parte superior: el fuego como promesa y como amenaza',
        ],
        observe_en: [
          'The spiral: the struggle does not stay in the centre, it opens outward',
          'The reclining figure in green tones, at the bottom',
          'The flames at the top: fire as promise and as threat',
        ],
      },
      {
        title: 'No están frente a frente',
        title_en: 'They are not facing each other',

        body: 'Vale la pena decir con precisión dónde está cada cosa, porque cambia cómo se camina. Los dos murales están en el tercer piso: Rivera en el extremo poniente y Orozco en el oriente. No se ven a la vez, no están enfrentados y no hay ninguna relación espacial entre ellos más allá de compartir piso y edificio. Entre uno y otro hay un paseo por la galería, y ese paseo es parte de la experiencia: las dos obras se Contestan por el camino, no cara a cara.',
        body_en:
          'It is worth being precise about where each work is, because it changes how you walk. Both are on the third floor: Rivera at the western end and Orozco at the eastern one. They are not opposite, and there is no spatial relationship between them beyond sharing a floor. Between the two there is a walk through the gallery, and that walk is part of the experience.',
        observe: [
          'El recorrido de la galería entre los dos extremos',
          'Las bases de los pilares, que sostenían reflectores en forma de pebeteros con cactus de cristal y mármol negro. Los reflectores desaparecieron; las bases siguen ahí',
        ],
        observe_en: [
          'The walk along the gallery between the two ends',
          'The bases of the pillars, which once held sconces in the shape of candelabra with crystal cacti and black marble: the sconces are gone and the bases remain',
        ],
      },
    ],
    interpretation: {
      title: 'Nuestra lectura, no la de ellos',
      body_en:
        'The temptation to read a 1934 fresco about machines and crowds as a warning about artificial intelligence is obvious, and legitimate. But it is a reading of ours: Orozco was not thinking about that, and attributing it to him would be inventing an intention. What we can say is that the two works asked their question in a world that was asking the same thing with the same words: what are we going to do with the machines? The conversation is still open, and the building is where it started.',
      title_en: 'Our reading, not theirs',

      body: 'Katharsis habla de máquinas, de masas y de un mundo que se ha vuelto apocalíptico, y lo hace en 1934. La tentación de leerlo hoy como una advertencia sobre la inteligencia artificial es evidente, y es una tentación legítima. Pero es una lectura nuestra: Orozco no estaba pensando en eso, y atribuirle esa intención sería inventarle una. Lo que sí podemos decir es que las dos obras formaron su الأسئلة en un mundo que también se preguntó, con las mismas palabras, qué iban a hacer las máquinas con nosotros. La conversación sigue abierta, y el edificio es el lugar donde empezó.',
    },
    operational_note:
      'El Museo Palacio de Bellas Artes abre de martes a domingo, de 10:00 a 18:00. La fachada estaba en restauración durante 2026 y el acceso interior puede variar. Confirma el día de la visita. Si el interior no está disponible, este momento se puede recorrer por fuera: la fachada, la clave en forma de cabeza de guerrero águila y la escala del edificio.',
    next_hint: 'Sal por Eje Central y cruza a la Alameda.',
  },
  {
    id: 'alameda',
    number: 5,
    title: 'Alameda Central: la ciudad vivida',
    title_en: 'Alameda Central: the lived city',
    location: 'Alameda Central, entre Eje Central y el Panteón',
    kicker: 'Del monumento a la vida',
    duration_min: 25,
    image: 'alameda',
    secondaryImage: 'alamedaXX',
    lead: 'Después de los muros del Palacio, la Alameda es el lugar donde la ciudad se afloja. Es un paseo, no un museo: gente, sombra, bancos, un kiosco. Y es, sin embargo, el lugar más antiguo de todo el recorrido, porque se trazó sobre un mercado.',
    lead_en:
      'After the walls of the Palace, the Alameda is where the city loosens up. It is a walk, not a museum: people, shade, benches, a kiosk. And yet it is the oldest thing on the route, because it was laid out on top of a market.',
    steps: [
      {
        title: 'Un tianguis con otro nombre',
        title_en: 'A market with another name',

        body: 'La Alameda Central seresponsible de emplazarse, a principios de 1592, por disposición del marqués de Salinas, sobre un cuadrado dentro de lo que era la plaza o tianguis de Juan Velázquez, al sur de la Calzada de Tacuba. El mercado no fue borrado: renombrado. Este es el patrón de toda la ciudad, y por eso la Alameda es, sin proponérselo, la mejor prueba de la tesis del recorrido.',
        body_en:
          'The Alameda Central was laid out, at the beginning of 1592, over a square that had been the plaza or tianguis of Juan Velázquez, south of Calzada de Tacuba. The market was not erased: it was renamed. This is the pattern of the whole city, and that is why the Alameda is, without meaning to be, the best proof of the thesis of the walk.',
        observe: [
          'El lado poniente de la plaza, donde el tianguis se asentaba',
          'La forma del paseo y por qué se llama Alameda: un lugar plantado, no una traza rectilínea',
        ],
        observe_en: [
          'The western side of the square, where the market used to stand',
          'The shape of the promenade and why it is called an Alameda',
        ],
      },
      {
        title: 'El paseo como programa urbanístico',
        title_en: 'The promenade as an urban programme',

        body: 'Para darle forma de parque se mandaron sembrar olmos blancos y negros traídos de Coyoacán, y el sevillano Francisco de Avis diseñó los jardines, rematados por una pila de cantera labrada con una esfera de bronce. La Alameda no es un residuo de la ciudad prehispánica ni un regalo del virreinato: es un proyecto de jardín construido encima de un mercado. Con el tiempo, el paseo se volvió plaza, y la plaza, paseo.',
        body_en:
          'To give it the shape of a park, white and black elms were brought from Coyoacán and the Sevillian Francisco de Avis designed the gardens, finished with a carved stone fountain crowned by a bronze sphere. The Alameda is not a leftover of the pre-Hispanic city nor a gift of the viceregal period: it is a garden project built on top of a market.',
        observe: [
          'Los árboles: las especies originales y las que las han sustituido',
          'El kiosco de hierro en el centro, una de las imágenes más repetidas del país',
          'El Panteón de San Fernando al oriente, la necrópolis que da nombre al paseo',
        ],
        observe_en: [
          'The trees: the original species and the ones that replaced them',
          'The iron kiosk in the middle, one of the most repeated images of the country',
          'The Panteón de San Fernando to the east',
        ],
      },
      {
        title: 'El mural que no está aquí',
        title_en: 'The mural that is not here',
        body: 'El Sueño de una tarde dominical en la Alameda Central, de Diego Rivera, es la obra que todo el mundo asocia con este paseo. Pero está a dos cuadras, en el Museo Mural Diego Rivera, en Balderos y Colón. Y hay un detalle que vale la pena: ese mural no se pintó para la Alameda. Se pintó en 1947 para el salón Versalles del Hotel del Prado, pasó al vestíbulo del hotel en 1960, y tras los sismos de 1985 fue rescatado y trasladado en una operación de doce horas con más de 300 trabajadores al lugar donde hoy está el museo, inaugurado el 19 de febrero de 1988. El paseo que aparece en el fondo del mural es el de su propia época, no el de hoy.',
        body_en:
          "The Sueño de una tarde dominical en la Alameda Central, by Diego Rivera, is the work everyone associates with this promenade. But it is two blocks away, at the Museo Mural Diego Rivera, on Balderos and Colón. And there is a detail worth keeping: that mural was not painted for the Alameda. It was painted in 1947 for the Versailles dining room of the Hotel del Prado, moved to the hotel lobby in 1960, and after the 1985 earthquakes it was rescued and moved, in a twelve-hour operation with more than three hundred workers, to the place where the museum now stands. The promenade in the background is its own era, not today's.",
        observe: [
          'La franja de la Alameda que bordea el museo y cómo el paseo de hoy se parece al del mural y no coincide',
          'La distancia real entre el mural y el paseo que representa',
        ],
        observe_en: [
          'The stretch of the Alameda next to the museum, and how the promenade in the mural resembles it and is not the same',
          'The real distance between the mural and the promenade it represents',
        ],
        pending:
          'El Museo Mural Diego Rivera abre de martes a domingo, de 10:00 a 18:00, con boleto y entrada libre los domingos. Es una extensión opcional: añade unos 50 minutos y no es parte del recorrido base.',
        pending_en:
          'The Museo Mural Diego Rivera opens Tuesday to Sunday, 10:00 to 18:00, with a ticket and free entry on Sundays. It is an optional extension: it adds about 50 minutes and is not part of the base route.',
      },
    ],
    next_hint: 'Baja por la calles del poniente hacia República de Uruguay.',
  },
  {
    id: 'joyas',
    number: 6,
    title: 'Las joyas del Centro: artesanía y vida local',
    title_en: 'The jewels of the centre: craft and local life',
    location: 'Plaza del Artesano, Pastelería Ideal y regreso al Zócalo',
    kicker: 'Vuelve a la calle',
    duration_min: 35,
    image: 'ideal',
    secondaryImage: 'uruguay',
    lead: 'El bloque final baja el volumen. Después de los murales, el Centro se vuelve calle, oficio y hambre. Volvemos al punto de partida por la vía más doméstica.',
    lead_en:
      'The last block lowers the volume. After the murals, the Centro is street, craft and hunger. We come back to the Zócalo the way we left it, which is the best way to show that a city is not a single era.',
    steps: [
      {
        title: 'Plaza del Artesano',
        title_en: 'Plaza del Artesano',

        body: 'En República de Uruguay 75, a un número de la calle, se abre un pasillo de puestos que no parece un mercado: mantas bordadas, ropa tradicional, arte wixárika, cuarzos, joyería de cobre y plata, y también estudios de tatuaje y servicios esotéricos. Abre de lunes a sábado, de 9:00 a 20:00; los domingos está cerrada. Su valor para el recorrido no es lo que se compra, es que un mercado de artesanías siga vivo en el centro de la ciudad, entre el comercio de especialidad. Aquí el oficio convive con el gesto, y conviene mirar los puestos antes de decidir comprar.',
        body_en:
          'At República de Uruguay 75, a passage of stalls opens that does not look like a market: embroidered blankets, traditional clothing, wixárika art, quartz, copper and silver jewellery, and also tattoo studios and esoteric services. It is open Monday to Saturday, 9:00 to 20:00, and closed on Sundays. The point of stopping here is not the shopping: it is noticing that a market of crafts is still alive in the middle of the city, between a phone shop and a clothing chain.',
        observe: [
          'Qué se fabrica todavía a mano y qué es revendido',
          'Los materiales: la plata, el cobre, las cuentas de vidrio',
          'El contraste con el orden del bulevar comercial de la calle',
        ],
        observe_en: [
          'What is still made by hand and what is resold',
          'The materials: silver, copper, glass beads',
          'The contrast with the retail rhythm of the street outside',
        ],
      },
      {
        title: 'Pastelería Ideal',
        title_en: 'Pastelería Ideal',
        body: 'A una puerta de la plaza, en Uruguay 74, está la sucursal de Pastelería Ideal. Abre de lunes a domingo, de 6:00 a 21:00 según la casa. Es una recomendación local y nada más: una pastelería popular del Centro, útil para una pausa y para tomar algo, sin fila сог. La otra sucursal, en 16 de Septiembre, es más arquitectónica y visualmente más nitric, pero queda a más de un kilómetro y obliga a desviarse: queda como alternativa, no como segunda parada.',
        body_en:
          'One door down, at Uruguay 74, is the Pastelería Ideal branch. Open from 6:00 to 21:00, every day.',
        observe: [
          'El mostrador y el horario: una pastelería de barrio que abre antes que los recitales del Museo',
          'La distancia real hasta el Zócalo: el regreso es de una cuadra larga',
        ],
        observe_en: [
          'The counter and the hours: a neighbourhood bakery that opens before the museums do',
          'The real distance back to the Zócalo: the return is one long block',
        ],
      },
      {
        title: 'De vuelta al Zócalo',
        title_en: 'Back to the Zócalo',
        body: 'El recorrido cierra donde abrió, en la plancha de la plaza. Pero la vuelta no es la ida: al volver por la misma calle, el Zócalo ya no es el punto de partida vacío sino un sitio del que se viene. Las seis capas que se apilaron en tres horas se leen ahora en un solo lugar, y ese es el punto: la ciudad no guarda sus versiones anteriores en un museo, las deja todas en la misma calle.',
        body_en:
          'The walk closes where it opened, on the flagstones. But the way back is not the way there: the Zócalo is no longer an empty starting point but a place you are coming back from. The six layers stacked in three hours can now be read in a single place, and that is the point: the city does not keep its former versions in a museum, it leaves them all on the same street.',
        observe: [
          'Qué se ve ahora en el Zócalo que no se veía al empezar',
          'El recorrido completo en un solo campo de visión: plaza, catedral, palacio, zona arqueológica',
        ],
        observe_en: [
          'What you now see in the Zócalo that you did not see at the start',
          'The whole route in a single field of view: square, cathedral, palace, archaeological zone',
        ],
      },
    ],
    next_hint: 'Termina en el Zócalo, donde empezó el recorrido.',
  },
]

/**
 * Módulo opcional. No forma parte del circuito base.
 */
export const CENTRO_DONCELES = {
  id: 'donceles',
  title: 'Donceles y su entorno cultural',
  subtitle:
    'Una extensión de unos 50 minutos para quien tenga más tiempo o le interesen la arquitectura, las librerías y los recintos culturales.',
  lead: 'A una cuadra al norte de la Alameda, Donceles es una calle trazada hacia 1524 y conocida por su docena de librerías de viejo. Es también un catálogo de arquitectura: churrigueresco, art déco, art nouveau, neoclásico y barroco en la misma cuadra. No es un desvío obligatorio: es una opción para quien quiera alargar el recorrido.',
  body: 'El recorrido arranca en la esquina con Allende, donde está el Palacio Legislativo —que fue Cámara de Diputados y donde Porfirio Díaz renunció en 1911— y sigue hacia el norte entre librerías de viejo y las tiendas de fotografía que también|Marcaron la calle. De camino están el Templo de la Enseñanza, el Colegio Nacional, el Teatro Fru Fru, el Teatro Esperanza Iris y el Antiguo Colegio de Cristo, que hoy alberga el Museo de la Caricatura.',
  practical:
    'Añade entre 45 y 60 minutos y un desvío de unos 500 metros ida y vuelta. Si el grupo va con prisa, se puede sustituir por veinte minutos más en la Alameda. Verifica la apertura de cada recinto el día de la visita: son espacios con horarios y eventos propios.',
  image: 'donceles',
  credit: 'Librerías de viejo en Donceles',
  what_to_see: [
    'El Museo de la Caricatura, en el Antiguo Colegio de Cristo: el único recinto de la calle con una obra de arte de peso, y con un mural de Orozco, el mismo artista de Katharsis.',
    'El Templo de la Enseñanza, uno de los churriguerescos más completos de la ciudad, y el Colegio Nacional, de estilo art déco.',
    'Las librerías de viejo: de la calle entera, el contenido más evidente. Entrar, recorrer, mirar.',
  ],
}

/** Advertencias operativas que se muestran al visitante. */
export const CENTRO_NOTES = [
  'El recorrido no tiene una duración garantizada. La referencia de tres horas cuenta el interior del Palacio de Bellas Artes; con visitas y pausas, realístic se acerca a las tres horas veinte.',
  'El Museo Palacio de Bellas Artes abre de martes a domingo, de 10:00 a 18:00. La fachada estaba en restauración en 2026: confirma el acceso y el estado de los murales.',
  'El Museo Mural Diego Rivera es una extensión opcional con boleto, no una parada del circuito base.',
  'La Plaza del Artesano abre de lunes a sábado y cierra los domingos. La Pastelería Ideal abre todos los días desde temprano.',
  'El acceso a los recintos con control cambia según el día: confirma horarios antes de salir.',
]

/** Fecha en que se verificaron los datos operativos. */
export const CENTRO_VERIFIED_ON = '2026-10-21'

export const CENTRO_JOURNEY = {
  id: 'centro',
  slug: 'centro',
  experience: 'centro',
  title_es: 'Centro Histórico — El futuro se pintó aquí',
  title_en: 'Historic Centre — The Future Was Painted Here',
  subtitle_es:
    'Seis capas en una tarde: el agua que hundió la ciudad, las piedras que quedaron arriba y los dos frescos que pintaron el porvenir en un edificio del Eje Central.',
  subtitle_en:
    'Six layers in one afternoon: the water that sank the city, the stones that stayed on top, and the two murals that painted the future inside a building on Eje Central.',
  intro_es:
    'Ciudad de México no borra: superpone. Cada capa —el agua, la piedra, el mural, el tender— deja su marca sobre la anterior sin taparla del todo. Este recorrido empieza en el Zócalo, sube por el corredor del agua, entra al Palacio de Bellas Artes y sale por la Alameda, para terminar entre puestos de artesanías y una pastelería de barrio. Y termina donde empezó, que es la mejor manera de mostrar que la ciudad no es una sola época.',
  intro_en:
    'Mexico City does not erase: it layers. Each layer — water, stone, mural, street stall — leaves its mark on the one before without covering it completely. This route starts in the Zócalo, climbs the water corridor, goes inside the Palacio de Bellas Artes and comes out at the Alameda, to end among craft stalls and a neighbourhood bakery. It finishes where it began, which is the best way to show that a city is not a single era.',
  eyebrow_es: 'Centro Histórico · Cuauhtémoc, Ciudad de México',
  eyebrow_en: 'Historic Centre · Cuauhtémoc, Mexico City',
  duration_note_es:
    'Referencia de tres horas: incluye la visita al interior del Palacio de Bellas Artes. Sin el interior, el circuito baja a unas dos horas veinte.',
  duration_note_en:
    'Three-hour reference: it includes the visit inside the Palacio de Bellas Artes. Without the interior, the circuit drops to about two hours twenty.',
  accents: ['talavera', 'terracota'],
  // Precio de referencia, en pesos. Se muestra siempre en el detalle.
  price: 699,
  heroImage: `${IMG}/madero.jpg`,
  // Calificacion: null mientras el journey no tenga reseñas.
  rating: null,
  reviewCount: 0,
  photos: CENTRO_PHOTOS,
  moments: CENTRO_MOMENTS,
  discoveries: CENTRO_DISCOVERIES,
  route: CENTRO_ROUTE,
  durations: CENTRO_DURATIONS,
  notes: CENTRO_NOTES,
  donceles: CENTRO_DONCELES,
  sources: CENTRO_SOURCES,
  verified_on: CENTRO_VERIFIED_ON,
}
