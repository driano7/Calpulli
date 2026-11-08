// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Journey editorial "Chapultepec — De los Dioses a Emperadores".
 *
 * ---------------------------------------------------------------------------
 * SEPARACIÓN DE CONTENIDO
 * Este archivo contiene SOLO el contenido editorial. La presentación vive en
 * components/journeys/ChapultepecJourney.tsx y en los componentes de apoyo.
 * ---------------------------------------------------------------------------
 *
 * ---------------------------------------------------------------------------
 * RIGOR HISTÓRICO
 * El guion distingue tres estados de un enunciado, y cada bloque lo declara:
 *
 *   'documentado' -> contrastado en las fuentes listadas en `SOURCES`.
 *   'tradicion'   -> relato o belief asociado al lugar. Se presenta como tal.
 *   'curiosidad'  -> dato o versión popular, señalada como tal.
 *
 * Reglas que se respetan aquí:
 *  - La cueva de Cincalco se presenta como lugar ASOCIADO al Mictlán, nunca
 *    como hallazgo arqueológico demostrado, y el acceso aparece como restringido.
 *  - No se afirma que Moctezuma se bañaba ahí. Se cuenta el nombre popular y
 *    se separa del depósito de agua prehispánico documentado.
 *  - No se dan horarios garantizados: el Audiorama y el Castillo se citan con
 *    el horario publicado por su operador, con la advertencia de verificar.
 *  - No se afirma una duración garantizada del recorrido.
 * ---------------------------------------------------------------------------
 */

const IMG = '/static/images/journeys/chapultepec'

/**
 * Fotografías verificadas. Todas provienen de Wikimedia Commons, con licencia
 * comprobada y crédito en public/static/images/journeys/chapultepec/CREDITS.md
 */
export const CHAPULTEPEC_PHOTOS = {
  metro: {
    src: `${IMG}/metro-chapultepec.jpg`,
    alt: 'Estación Chapultepec del Metro de la Ciudad de México, línea 1, tras la renovación 2022-2025.',
    credit: 'Gobierno de la Ciudad de México / Wikimedia Commons, CC BY-SA 4.0',
  },
  puerta: {
    src: `${IMG}/puerta-de-los-leones.jpg`,
    alt: 'Puerta de los Leones, entrada principal al Bosque de Chapultepec.',
    credit: 'Lasibris / Wikimedia Commons, CC BY-SA 4.0',
  },
  galeria: {
    src: `${IMG}/calzada-juventud-heroica.jpg`,
    alt: 'Interior del Bosque de Chapultepec con arbolado y áreas de descanso en la Primera Sección.',
    credit: 'Gobierno de la Ciudad de México / Wikimedia Commons, CC0',
  },
  altar: {
    src: `${IMG}/altar-a-la-patria.jpg`,
    alt: 'Altar a la Patria, monumento a los Niños Héroes, en la Primera Sección del Bosque de Chapultepec.',
    credit: 'José Luiz / Wikimedia Commons, CC BY-SA 4.0',
  },
  altarEscultura: {
    src: `${IMG}/altar-escultura-central.jpg`,
    alt: 'Escultura central del Altar a la Patria, con la figura de la Patria sosteniendo a un cadete caído.',
    credit: 'Wikimedia Commons, CC BY 4.0',
  },
  audiorama: {
    src: `${IMG}/audiorama.jpg`,
    alt: 'Audiorama del Bosque de Chapultepec, recinto construido en 1972 para escuchar música entre árboles.',
    credit: 'Gobierno de la Ciudad de México / Wikimedia Commons, CC0',
  },
  cincalco: {
    src: `${IMG}/cincalco-acceso.jpg`,
    alt: 'Entrada de la cueva conocida como Cincalco, con barrera que restringe el paso al público.',
    credit: 'Gobierno de la Ciudad de México / Wikimedia Commons, CC0',
  },
  banos: {
    src: `${IMG}/banos-de-moctezuma.jpg`,
    alt: 'Baños de Moctezuma en la Primera Sección del Bosque de Chapultepec.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  banosEscalinatas: {
    src: `${IMG}/banos-de-moctezuma-escalinatas.jpg`,
    alt: 'Escalinatas históricas de los Baños de Moctezuma en el Bosque de Chapultepec.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  castillo1880: {
    src: `${IMG}/castillo-1880.jpg`,
    alt: 'El Castillo de Chapultepec visto desde el poniente, hacia 1880-1900, con los agaves en primer plano.',
    credit: 'Wikimedia Commons, dominio público',
  },
  castilloBriquet: {
    src: `${IMG}/castillo-briquet.jpg`,
    alt: 'El Castillo de Chapultepec desde el poniente, impresion de albumina de Abel Briquet.',
    credit: 'Abel Briquet / Library of Congress, dominio público',
  },
  castillo: {
    src: `${IMG}/castillo-exterior.jpg`,
    alt: 'Fachada exterior del Castillo de Chapultepec.',
    credit: 'Wikimedia Commons, CC BY 4.0',
  },
  castilloAereo: {
    src: `${IMG}/castillo-aereo.jpg`,
    alt: 'Vista aérea del Castillo de Chapultepec y el cerco de árboles del bosque.',
    credit: 'ProtoplasmaKid / Wikimedia Commons, CC BY 4.0',
  },
  castilloDia: {
    src: `${IMG}/castillo-de-dia.jpg`,
    alt: 'Castillo de Chapultepec visto desde abajo en un día claro.',
    credit: 'Lasibris / Wikimedia Commons, CC BY 4.0',
  },
  lago: {
    src: `${IMG}/lago-chapultepec.jpg`,
    alt: 'Lago Mayor del Bosque de Chapultepec.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  bosque: {
    src: `${IMG}/bosque-arboles.jpg`,
    alt: 'Arbolado del Bosque de Chapultepec.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
}

/**
 * Bloques de descubrimiento: separan el hecho documentado de la tradición.
 * `kind` decide el tratamiento visual y el encabezado.
 */
export const DISCOVERY_KINDS = {
  documentado: { label: 'Historia documentada', tone: 'documentado' },
  curiosidad: { label: 'Dato curioso', tone: 'curiosidad' },
  tradicion: { label: 'Tradición o leyenda', tone: 'tradicion' },
}

export const CHAPULTEPEC_DISCOVERIES = [
  {
    id: 'cincalco-mictlan',
    kind: 'tradicion',
    title: 'Cincalco y el inframundo',
    body: 'El sitio oficial del Bosque llama a esta cueva "lugar de la casa del maíz" y la asocia al Mictlán, el inframundo nahua. Es una relación de tradición: el sitio no la presenta como un hallazgo arqueológico demostrado, y el acceso al interior está restringido.',
    source: 'Pro Bosque de Chapultepec',
  },
  {
    id: 'moctezuma-debate',
    kind: 'curiosidad',
    title: 'El nombre popular y la evidencia',
    body: 'Los Baños de Moctezuma deben su nombre a un relato popular. En el lugar se documenta la existencia de un depósito de agua de origen prehispánico, con transformaciones posteriores. Que se asocie a un baño personal del soberano no está demostrado por una fuente sólida.',
    source: 'Baños de Moctezuma, Primera Sección',
  },
  {
    id: 'altar-1947',
    kind: 'documentado',
    title: 'Seis cadetes, seis columnas',
    body: 'El Altar a la Patria se levantó entre 1947 y 1952 con seis columnas de mármol. Conserva los restos del general Felipe Santiago Xicoténcatl y los de seis personas que en 1947 fueron identificadas como los Niños Héroes.',
    source: 'Altar a la Patria, Primera Sección',
  },
  {
    id: 'changuito-mion',
    kind: 'curiosidad',
    title: 'Los pequeños habitantes',
    body: 'En las copas de los árboles de la Primera Sección se puede observar al changuito mión, un primate pequeño de cola larga propio de la región. Conviene mirarlo con calma y a distancia: observar no es tocar.',
    source: 'Observación de campo',
  },
]

/**
 * Línea de tiempo del Castillo. Cada hito lleva la época y el hecho
 * contrastado. Es un recurso explorable, no un paso obligatorio.
 */
export const CASTILLO_TIMELINE = [
  {
    id: 'virreinato',
    period: '1785',
    title: 'Casa de descanso virreinal',
    body: 'Bernardo de Gálvez ordena la construcción de una casa de descanso en Chapultepec el 16 de agosto de 1785, sobre una antigua ermita dedicada al Arcángel Miguel. Participan los ingenieros Francisco Bambitelli y Manuel Agustín Mascaró. La obra queda inconclusa ese mismo año.',
    state: 'documentado',
  },
  {
    id: 'colegio-militar',
    period: '1833',
    title: 'Sede del Heroico Colegio Militar',
    body: 'El inmueble, deteriorado durante años, se convierte en sede del Heroico Colegio Militar en 1833, con inauguración en 1843. Se levanta el torreón "Caballero Alto", que dará al conjunto el aire de fortaleza y el nombre de castillo.',
    state: 'documentado',
  },
  {
    id: 'ano-1847',
    period: '1847',
    title: 'La batalla de Chapultepec',
    body: 'Durante la intervención estadounidense, el castillo resiste catorce horas de asedio al mando del general Nicolás Bravo y es considerado el último bastión de la defensa nacional. El edificio sufre daños considerables. La historia del lugar no se reduce a este episodio, pero forma parte de él.',
    state: 'documentado',
  },
  {
    id: 'imperio',
    period: '1864-1867',
    title: 'Maximiliano y Carlota',
    body: 'Durante el Segundo Imperio Mexicano, Maximiliano de Habsburgo y la emperatriz Carlota eligen el castillo como residencia, atraídos por la vista al valle de México. Se añaden arcadas neoclásicas, balcones en la fachada sur, un pórtico central y jardines, y el recinto pasa a ser conocido como "Palacio Imperial de Chapultepec" o "Miravalle".',
    body_en:
      'Between 1864 and 1867, during the Second Mexican Empire, Maximilian of Habsburg and the empress Carlota chose the castle as their residence, captivated by the view over the valley of Mexico. Neoclassical arcades inspired by Paris were added, along with balconies on the south facade, a central portico, a tower linking the floors, loggias with iron columns, the Las Bacantes murals by Santiago Rebull, billiard and carriage rooms, and the ramp that connected to the Paseo de la Emperatriz. The complex became known as the Palacio Imperial de Chapultepec, or "Miravalle".',
    state: 'documentado',
  },
  {
    id: 'porfiriato',
    period: '1872-1910',
    title: 'Porfiriato y residencia presidencial',
    body: 'Desde 1872 el castillo vuelve a ser residencia presidencial. En 1878 se inaugura el Observatorio Astronómico Nacional en el Caballero Alto y se construye la escalera de los leones. Porfirio Díaz lo usa primero como casa de veraneo y desde 1896 como residencia principal; se instalan ascensores, la Galería de Emplomados con vitrales procedentes de París y un boudoir en el antiguo salón de té de Carlota.',
    state: 'documentado',
  },
  {
    id: 'revolucion',
    period: '1911-1913',
    title: 'La Marcha de la Lealtad',
    body: 'Francisco I. Madero habita el castillo entre 1911 y 1913. En febrero de 1912, durante la Decena Trágica, marcha desde aquí hasta el Palacio Nacional. En 1916 Venustiano Carranza ordena demoler parte del edificio del Colegio Militar para ampliar las habitaciones residenciales de los presidentes.',
    state: 'documentado',
  },
  {
    id: 'museo',
    period: '1944',
    title: 'Museo Nacional de Historia',
    body: 'El 27 de septiembre de 1944, por decreto de Lázaro Cárdenas, el castillo se convierte en sede del Museo Nacional de Historia, que abre sus puertas al público ese mismo día. En 1934, Cárdenas ya había preferido Los Pinos como residencia presidencial. Hoy administra el recinto el INAH.',
    state: 'documentado',
  },
]

/**
 * Fuentes consultadas. Se conservan en el código para que cualquier corrección
 * futura tenga un punto de partida y no una suposición.
 */
export const SOURCES = [
  {
    id: 'inah-castillo',
    label: 'INAH — Museo Nacional de Historia, Castillo de Chapultepec',
    url: 'https://www.mnh.inah.gob.mx/',
  },
  {
    id: 'pro-bosque-audiorama',
    label: 'Pro Bosque de Chapultepec — Audiorama y cueva de Cincalco',
    url: 'http://bosquedechapultepec.mx:9000/bosquedechapultepec/espacios/audiorama-chapultepec/',
  },
  {
    id: 'pro-bosque-galeria',
    label: 'Pro Bosque de Chapultepec — Galería Abierta Juventud Heroica',
    url: 'http://bosquedechapultepec.mx:9000/bosquedechapultepec/espacios/calzada-juventud-heroica/',
  },
  {
    id: 'cdmx-turismo',
    label: 'Turismo Ciudad de México — Altar a la Patria',
    url: 'https://www.mexicocity.cdmx.gob.mx/venues/ninos-heroes-monument/',
  },
  {
    id: 'wiki-castillo',
    label: 'Wikipedia — Castillo de Chapultepec (con referencias al INAH)',
    url: 'https://es.wikipedia.org/wiki/Castillo_de_Chapultepec',
  },
]

/**
 * Los seis momentos del recorrido. El orden es el aprobado y no se altera:
 * Metro → Puerta de los Leones → Puente → Altar a la Patria → Audiorama y
 * Cincalco → Baños de Moctezuma → Castillo → lago → Metro.
 *
 * No se agregan Calzada Flotante, zoológico, Segunda Sección, Papalote,
 * Aztlán ni Casa del Lago.
 */
export const CHAPULTEPEC_MOMENTS = [
  {
    id: 'umbral',
    featured: true,
    duration_min: 15,
    number: 1,
    title: 'El umbral de las épocas',
    title_en: 'The threshold of the ages',
    location: 'Metro Chapultepec → Puerta de los Leones',
    kicker: 'Del ruido urbano al bosque',
    next_hint: 'Sigue al Puente del Tiempo, al otro lado de la avenida.',
    image: 'metro',
    secondaryImage: 'puerta',
    lead: 'There are places that do not belong to a single era. Chapultepec has been sacred ground, a place of rest, a battlefield and a refuge for a city that never stops changing itself. Today we are going to walk over some of the traces left by the people who passed through here.',
    lead_en:
      'There are places that do not belong to a single era. Chapultepec has been sacred ground, a place of rest, a battlefield and a refuge for a city that never stops changing itself. Today we are going to walk over some of the traces left by the people who passed through here.',
    steps: [
      {
        title: 'La puerta del bosque',
        title_en: "The forest's gate",
        body: 'Antes de entrar, detente en los leones. La Puerta de los Leones es la entrada principal al Bosque de Chapultepec y el paso desde el ruido de la avenida hacia el arbolado. Los leones y sus pedestales son el umbral: un lugar que anuncia que del otro lado cambia la escala.',
        body_en:
          'Before you go in, stop at the lions. The Puerta de los Leones is the main entrance to the Chapultepec forest and the threshold from the noise of the avenue to the trees. The lions and their pedestals announce it: this is a place where the scale of things changes.',
        observe: [
          'El gesto de los leones: la mirada y la postura anticipan el camino',
          'La escala del pedestal frente a la persona que lo cruza',
          'El contraste entre el tráfico de la avenida y el silencio del bosque',
        ],
        observe_en: [
          'The gesture of the lions: the look and the posture anticipate the walk',
          'The scale of the pedestal against the person walking past it',
          'The contrast between the traffic of the avenue and the silence of the forest',
        ],
      },
      {
        title: 'Una pregunta para comenzar',
        title_en: 'A question to begin with',
        body: 'No hace falta responderla en voz alta ni seguir adelante de inmediato. Solo considera: ¿qué historias crees que podría guardar un mismo lugar durante siglos? El resto del recorrido es una forma de buscar respuesta.',
        body_en:
          'You do not have to answer it out loud, nor move on straight away. Just consider it: what stories do you think a single place might hold for centuries? The rest of the walk is one way of looking for an answer.',
        observe: [],
      },
    ],
  },
  {
    id: 'puente',
    duration_min: 15,
    number: 2,
    title: 'El Puente del Tiempo',
    title_en: 'The Bridge of Time',
    location: 'Acceso peatonal y galería fotográfica, rumbo al Altar a la Patria',
    kicker: 'Cruzar y comparar',
    next_hint: 'Continua al Altar a la Patria, en la entrada de la calzada.',
    image: 'galeria',
    lead: 'Crossing this bridge is more than changing sides of the avenue. It is also a chance to watch the landscape transform. Photographs let us compare one era with another and see what stays, what disappears and what changes its meaning.',
    lead_en:
      'Crossing this bridge is more than changing sides of the avenue. It is also a chance to watch the landscape transform. Photographs let us compare one era with another and see what stays, what disappears and what changes its meaning.',
    steps: [
      {
        title: 'Mira el bosque con otros ojos',
        title_en: 'Look at the forest with other eyes',
        body: 'La Calzada Juventud Heroica cuenta con una galería fotográfica al aire libre, la Galería Abierta Juventud Heroica, donde se exhiben muestras temporales. El catálogo cambia, así que lo que puedes comparar hoy no será necesariamente lo que había hace un año. El acceso principal a esta calzada se hace por la Puerta de los Leones y por el Puente Metro.',
        body_en:
          'The Calzada Juventud Heroica has an open-air photo gallery, the Galería Abierta Juventud Heroica, where temporary shows are mounted. The catalogue changes, so what you can compare today will not necessarily be there a year from now. The main way into this stretch is through the Puerta de los Leones and the Puente Metro.',
        observe: [
          'Qué época aparece en las imágenes y cuál no',
          'Qué edificios, árboles o terraceros ya no están',
          'Qué objeto se repite en varias de las fotografías',
        ],
        observe_en: [
          'Which era appears in the photographs, and which does not',
          'Which buildings, trees or kerbsides are no longer there',
          'Which object repeats across several of the photographs',
        ],
      },
      {
        title: 'Antes y ahora',
        title_en: 'Before and now',
        body: 'Comparar dos fotografías del mismo punto es un ejercicio de lenguaje visual: obliga a elegir qué se mira. En este journey todavía no hay un par histórico verificado del mismo punto, así que no te proponemos un comparador. En cuanto exista con procedencia comprobada, aparecerá aquí.',
        body_en:
          'Comparing two photographs of the same spot is a visual language exercise: it forces you to decide what to look at. There is no verified historical pair of this place yet, so we are not offering you a slider. It will appear here as soon as there is one with a documented origin.',
        observe: [],
        pending:
          'Falta un par de fotografías históricas y actuales verificadas del mismo punto, con procedencia y crédito documentados.',
        pending_en:
          'A verified pair of historical and current photographs of the same spot is still missing, with documented origin and credit.',
      },
    ],
  },
  {
    id: 'memoria',
    featured: true,
    duration_min: 20,
    number: 3,
    title: 'La memoria de una nación',
    title_en: 'The memory of a nation',
    location: 'Altar a la Patria, monumento a los Niños Héroes',
    kicker: 'El bosque cambia de tono',
    next_hint: 'Baja hacia la zona del Audiorama, entre la arboleda.',
    image: 'altar',
    secondaryImage: 'altarEscultura',
    lead: 'Here the forest changes its tone. The monument remembers the cadets who were linked to the defence of the Castle during the 1847 US intervention. Beyond its monumental presence, it also asks us to think about how a society keeps the memory of its events.',
    lead_en:
      'Here the forest changes its tone. The monument remembers the cadets who were linked to the defence of the Castle during the 1847 US intervention. Beyond its monumental presence, it also asks us to think about how a society keeps the memory of its events.',
    steps: [
      {
        title: 'Seis columnas, una memoria',
        title_en: 'Six columns, one memory',
        body: 'El Altar a la Patria se levantó entre 1947 y 1952. Obra del arquitecto Enrique Aragón Echegaray y del escultor Ernesto Tamariz, se compone de seis columnas de mármol en disposición semicircular, coronadas por águilas y antorchas de bronce. En el centro, la figura de la Patria sostiene a un cadete caído y una rama de olivo; junto a ella, un hombre en pie porta la bandera de la Primera República Federal. En la base se lee: "A los defensores de la Patria 1846-1847".',
        body_en:
          'The Altar a la Patria was built between 1947 and 1952. It is the work of the architect Enrique Aragón Echegaray and the sculptor Ernesto Tamariz: six marble columns in a semicircle, crowned with bronze eagles and torches. At the centre, the figure of the Motherland holds a fallen cadet and an olive branch; beside her, a man stands with the flag of the First Federal Republic. At the base you can read: "To the defenders of the Fatherland, 1846-1847".',
        observe: [
          'Las seis columnas y la disposición semicircular',
          'Los remates de águila y antorcha de bronce',
          'La inscripción en la base del conjunto',
        ],
        observe_en: [
          'The six columns and the semicircular layout',
          'The eagle and torch finials in bronze',
          'The inscription at the base of the ensemble',
        ],
      },
      {
        title: 'La historia y su símbolo',
        title_en: 'The story and its symbol',
        body: 'El monumento guarda los restos del general Felipe Santiago Xicoténcatl y los de seis personas que en 1947 fueron identificadas como los Niños Héroes. Conviene separar los hechos: el episodio militar de 1847 está documentado, igual que la construcción del monumento. La categoría de "Niños Héroes", con su propia iconografía, se fue construyendo después, en la memoria conmemorativa del siglo XX. El monumento es documento de ambas cosas a la vez.',
        body_en:
          'The monument holds the remains of General Felipe Santiago Xicoténcatl and of six people identified in 1947 as the Niños Héroes. It is worth separating the facts: the military episode of 1847 is documented, and so is the building of the monument. The category of "Niños Héroes", with its own imagery, was constructed later, in the commemorative memory of the twentieth century. The monument is a document of both things at once.',
        observe: [],
      },
    ],
    question: '¿Qué hace que un acontecimiento se convierta en símbolo para todo un país?',
    question_en: 'What makes an event become a symbol for a whole country?',
  },
  {
    id: 'dioses',
    duration_min: 30,
    number: 4,
    title: 'El Chapultepec de los Dioses',
    title_en: 'The Chapultepec of the Gods',
    location: 'Audiorama, cueva de Cincalco, Baños de Moctezuma',
    kicker: 'Paisaje, agua y memoria',
    next_hint: 'Empieza la subida al Castillo.',
    image: 'audiorama',
    secondaryImage: 'cincalco',
    lead: 'Before it was the stage for emperors and presidents, Chapultepec was tied to sacred stories, to water and to the traditions of the peoples who lived in the valley. Here it is worth looking closely: some of these stories belong to the historical record, and others survive as legends that have given the landscape its meaning.',
    lead_en:
      'Before it was the stage for emperors and presidents, Chapultepec was tied to sacred stories, to water and to the traditions of the peoples who lived in the valley. Here it is worth looking closely: some of these stories belong to the historical record, and others survive as legends that have given the landscape its meaning.',
    steps: [
      {
        title: 'Audiorama: una pausa dentro del bosque',
        title_en: 'Audiorama: a pause inside the forest',
        body: 'Inaugurado en 1972, el Audiorama es un recinto pensado para escuchar música rodeado de árboles, con un género distinto cada día de la semana y una pequeña colección de libros en préstamo. El sitio oficial publica un horario de martes a domingo, de 09:00 a 16:00, con entrada libre. Confírmalo el día de la visita: los horarios de los recintos con acceso controlado cambian.',
        body_en:
          'Opened in 1972, the Audiorama is a space built for listening to music surrounded by trees, with a different genre every day of the week and a small collection of books to borrow. The official site publishes hours from Tuesday to Sunday, 9:00 to 16:00, with free entry. Check on the day you visit: the hours of controlled-access places change.',
        observe: [
          'El cambio de música según el día: el lugar suena distinto cada vez',
          'La selección de libros disponible para consultar',
          'El contraste entre el sonido del recinto y el de la calle',
        ],
        observe_en: [
          'How the music changes with the day: the place sounds different every time',
          'The selection of books available to look through',
          'The contrast between the sound of the enclosure and the sound of the street',
        ],
      },
      {
        title: 'Cincalco y el Mictlán',
        title_en: 'Cincalco and the Mictlán',
        body: 'En el Audiorama se encuentra la cueva conocida como Cincalco, "lugar de la casa del maíz". El sitio oficial del Bosque la asocia al Mictlán, el inframundo nahua, y el cronista Salvador Novo la bautizó con el nombre náhuatl "In xochitl, In cuicatl", "en la flor, el canto". Hay que decirlo con precisión: es una relación de tradición y relato, no un hecho arqueológico demostrado. El acceso al interior de la cueva está restringido hoy por seguridad, y así debe narrarse: se observa desde el exterior.',
        body_en:
          'In the Audiorama you find the cave known as Cincalco, "place of the house of maize". The official site of the forest links it to the Mictlán, the Nahua underworld, and the chronicler Salvador Novo gave it the Nahuatl name "In xochitl, In cuicatl", "in the flower, the song". It should be said precisely: this is a relationship of tradition and story, not a demonstrated archaeological fact. Access to the inside of the cave is restricted today for safety, and that is how it should be told: it is looked at from outside.',
        observe: [
          'La barrera que delimita el acceso al interior de la cueva',
          'La relación de la cubierta con el bosque que la rodea',
          'La diferencia entre el nombre náhuatl y el nombre que se le da hoy',
        ],
        observe_en: [
          'The barrier that closes off access to the inside of the cave',
          'The way the rock cover sits against the forest around it',
          'The difference between the Nahuatl name and the name it is given today',
        ],
      },
      {
        title: 'Baños de Moctezuma: historia y mito',
        title_en: "Moctezuma's Baths: history and myth",
        body: 'Un nombre puede conservar una leyenda durante siglos. Pero ¿qué nos dicen las evidencias sobre el lugar? En los Baños de Moctezuma se documenta la existencia de un depósito de agua de origen prehispánico, con transformaciones posteriores a lo largo del tiempo. Lo que no está demostrado por una fuente sólida es que el soberano se bañara personalmente ahí: esa versión pertenece al relato popular, no a la evidencia.',
        body_en:
          'A name can keep a legend alive for centuries. But what do the evidence tell us about the place? At the Baños de Moctezuma there is documented evidence of a water deposit of pre-Hispanic origin, with later transformations of the site. What is not demonstrated by a solid source is that the ruler bathed here personally: that version belongs to popular story, not to the evidence.',
        observe: [
          'Las escalinatas y el trabajo de cantería que rodea el depósito',
          'Las transformaciones posteriores visibles en el conjunto',
          'La diferencia entre el nombre del lugar y lo que la evidencia permite afirmar',
        ],
        observe_en: [
          'The stairways and the stonework that surrounds the water deposit',
          'The later transformations visible in the ensemble',
          'The difference between the name of the place and what the evidence allows us to say',
        ],
      },
      {
        title: 'Los pequeños habitantes del bosque',
        title_en: "The forest's small inhabitants",
        body: 'En las copas de los árboles de la Primera Sección se puede observar al changuito mión, un primate pequeño de cola larga propio de la región. Es una curiosidad menor del bosque, no una atracción: lo interesante es notar que un bosque urbano sostiene fauna propia. Míralo con calma y a distancia.',
        body_en:
          'In the crowns of the trees of the First Section you can spot the changuito mión, a small long-tailed primate native to the region. It is a minor curiosity of the forest, not an attraction: what is interesting is noticing that an urban forest still supports its own wildlife. Watch it calmly, from a distance.',
        observe: [],
      },
    ],
    operational_note:
      'El Audiorama publica un horario de martes a domingo, de 9:00 a 16:00, con entrada libre. El acceso al interior de la cueva de Cincalco esta restringido: se visita desde el exterior. Confirma el dia de la visita.',
  },
  {
    id: 'castillo',
    featured: true,
    duration_min: 60,
    number: 5,
    title: 'De virreyes a emperadores',
    title_en: 'From viceroys to emperors',
    location: 'Subida y visita al Castillo de Chapultepec',
    kicker: 'El capítulo mayor',
    next_hint: 'Baja hacia el lago para el ultimo tramo.',
    hero: true,
    image: 'castillo',
    secondaryImage: 'castilloAereo',
    lead: 'From here, history changes scale. The hill that kept old stories also became a place of rest, of military training, an imperial residence and the scene of political transformations. The Castle does not belong to a single story: it holds several of them at once, laid over one another in its walls, its rooms and its views.',
    lead_en:
      'From here, history changes scale. The hill that kept old stories also became a place of rest, of military training, an imperial residence and the scene of political transformations. The Castle does not belong to a single story: it holds several of them at once, laid over one another in its walls, its rooms and its views.',
    steps: [
      {
        title: 'El ascenso',
        title_en: 'The climb',
        body: 'La subida al cerro funciona como transición narrativa. La vegetación se espesa, la pendiente marca el cambio de nivel y las vistas empiezan a abrirse. Ese cambio de perspectiva es parte del relato: el Castillo no se entiende de golpe.',
        body_en:
          'The climb up the hill works as a narrative transition. The vegetation thickens, the slope marks the change in level and the views start to open up. That change of perspective is part of the story: the Castle is not understood all at once.',
        observe: [
          'Cómo se va abriendo el panorama a medida que se sube',
          'El tipo de vegetación que se va dejando atrás',
          'El punto en que el bosque se vuelve discernible desde arriba',
        ],
        observe_en: [
          'How the panorama opens up as you climb',
          'The kind of vegetation you leave behind',
          'The point at which the forest becomes visible from above',
        ],
      },
      {
        title: 'De casa de descanso a Castillo',
        title_en: 'From resting house to Castle',
        body: 'El origen es virreinal. El 16 de agosto de 1785, Bernardo de Gálvez ordena la construcción de una casa de descanso en Chapultepec, sobre una antigua ermita dedicada al Arcángel Miguel, con participación de los ingenieros Francisco Bambitelli y Manuel Agustín Mascaró. La obra queda inconclusa ese mismo año y se ordena su subasta. En 1806 la adquiere el Ayuntamiento de México.',
        body_en:
          'The origin is viceregal. On 16 August 1785, Bernardo de Gálvez ordered the building of a resting house in Chapultepec, on the site of an old hermitage dedicated to the Archangel Michael, with the participation of the engineers Francisco Bambitelli and Manuel Agustín Mascaró. The work was left unfinished that same year and put up for auction. In 1806 it was acquired by the City Council.',
        observe: [],
      },
      {
        title: 'Colegio Militar y batalla',
        title_en: 'Military College and battle',
        body: 'El inmueble, deteriorado durante años, se convierte en sede del Heroico Colegio Militar en 1833. Se construye el torreón "Caballero Alto", que le da el nombre de castillo. En 1847, durante la intervención estadounidense, resiste catorce horas de asedio al mando del general Nicolás Bravo, con 832 soldados y cadetes. Es parte fundamental de su historia, pero no la resume: el edificio acumuló otras funciones antes y después.',
        body_en:
          'The building, in poor condition for years, became the seat of the Heroic Military College in 1833. The "Caballero Alto" tower was built, and it is what gives the complex the air of a fortress and the name of a castle. In 1847, during the US intervention, it held out for fourteen hours of siege under General Nicolás Bravo, with 832 soldiers and cadets. It is a fundamental part of its history, but it does not summarise it: the building accumulated other functions before and after.',
        observe: [],
      },
      {
        title: 'Maximiliano y Carlota',
        title_en: 'Maximiliano and Carlota',
        body: 'Entre 1864 y 1867, durante el Segundo Imperio Mexicano, Maximiliano de Habsburgo y la emperatriz Carlota eligen el castillo como residencia, cautivados por la vista al valle de México. Se añaden arcadas neoclásicas inspiradas en París, balcones en la fachada sur, un pórtico central, un torreón para comunicar plantas, galerías con columnas de hierro, los murales Las Bacantes de Santiago Rebull, salas de billar y de carruajes, y la rampa de acceso que comunicaría con el Paseo de la Emperatriz. El recinto fue conocido como Palacio Imperial de Chapultepec, o "Miravalle".',
        body_en:
          'Between 1864 and 1867, during the Second Mexican Empire, Maximilian of Habsburg and the empress Carlota chose the castle as their residence, captivated by the view over the valley of Mexico. Neoclassical arcades inspired by Paris were added, along with balconies on the south facade, a central portico, a tower linking the floors, loggias with iron columns, the Las Bacantes murals by Santiago Rebull, billiard and carriage rooms, and the ramp that connected to the Paseo de la Emperatriz. The complex became known as the Palacio Imperial de Chapultepec, or "Miravalle".',
        observe: [],
      },
      {
        title: 'El Porfiriato',
        title_en: 'The Porfiriato',
        body: 'Desde 1872 el castillo vuelve a ser residencia presidencial. En 1878 se inaugura el Observatorio Astronómico Nacional en el Caballero Alto y se construye la escalera de los leones; ese mismo año se realizó desde la oficina telegráfica del torreón la primera transmisión telefónica experimental en México. Porfirio Díaz lo usa primero como casa de veraneo y desde el 14 de abril de 1896 como residencia principal. Instala ascensores, un pararrayos, la Galería de Emplomados con vitrales procedentes de París y un boudoir privado en el antiguo salón de té de Carlota.',
        body_en:
          'From 1872 the castle became the presidential residence again. In 1878 the Astronomical Observatory was inaugurated in the Caballero Alto and the staircase of lions was built; that same year the first experimental telephone transmission in Mexico was made from the telegraph office in the tower. Porfirio Díaz used it first as a summer house and from 14 April 1896 as his main residence. He installed lifts, a lightning rod, the Galería de Emplomados with its Paris-made stained glass, and a private boudoir in Maximilian’s old tea room.',
        observe: [],
      },
      {
        title: 'El Castillo como museo',
        title_en: 'The Castle as museum',
        body: 'En 1934, Lázaro Cárdenas elige Los Pinos como residencia presidencial porque el castillo le parecía "muy ostentoso" para un país en reconstrucción. El 27 de septiembre de 1944, por decreto suyo, el castillo se convierte en sede del Museo Nacional de Historia y abre sus puertas al público. Hoy administra el recinto el INAH, con salas que recrean desde el periodo virreinal hasta la Revolución mexicana, y más de cien mil piezas en su acervo.',
        body_en:
          'In 1934, Lázaro Cárdenas chose Los Pinos as the presidential residence because the castle seemed "too sumptuous" for a country under reconstruction. On 27 September 1944, by his decree, the castle became the National Museum of History and opened to the public that same day. Today the INAH runs the site, with rooms that recreate everything from the viceregal period to the Mexican Revolution, and more than a hundred thousand objects in its collection.',
        observe: [],
      },
      {
        title: 'Mirar la ciudad desde arriba',
        title_en: 'Looking at the city from above',
        body: 'No todo tiene que convertirse en una ficha histórica. El Castillo está a 2,325 metros sobre el nivel del mar y su terraza forma parte de la historia del lugar. Detente ahí un momento: la vista explica por qué los virreyes eligieron este punto, y por qué después todo el mundo quiso poner una casa, un gobierno o un museo encima de él.',
        body_en:
          'Not everything has to become an historical fact sheet. The Castle stands at 2,325 metres above sea level, and its terrace is part of the story of the place. Stop there for a moment: the view explains why the viceroys chose this spot, and why afterwards everyone else wanted to build on top of it.',
        observe: [
          'La extensión del bosque que se ve desde la terraza',
          'El paisaje de la ciudad que aparece al otro lado de la copa de los árboles',
          'El cambio de escala entre el bosque y los edificios',
        ],
        observe_en: [
          'The extent of the forest seen from the terrace',
          'The city appearing on the other side of the tree line',
          'The change of scale between the trees and the buildings',
        ],
      },
    ],
    timeline: CASTILLO_TIMELINE,
    operational_note:
      'El Castillo alberga el Museo Nacional de Historia. El acceso interior y los horarios de las salas dependen de la agenda del museo y de los montajes: confirma el dia de la visita. Las tres horas de referencia NO incluyen una visita completa al museo: el bloque de 60 minutos es para el edificio, sus murales y las vistas.',
    comparison: {
      before: {
        src: CHAPULTEPEC_PHOTOS.castillo1880.src,
        alt: CHAPULTEPEC_PHOTOS.castillo1880.alt,
        label: '1880-1900',
        credit: CHAPULTEPEC_PHOTOS.castillo1880.credit,
      },
      after: {
        src: CHAPULTEPEC_PHOTOS.castilloAereo.src,
        alt: CHAPULTEPEC_PHOTOS.castilloAereo.alt,
        label: 'Hoy',
        credit: CHAPULTEPEC_PHOTOS.castilloAereo.credit,
      },
      note: 'Mismo edificio, distinta epoca y distinto punto de vista.',
    },
  },
  {
    id: 'regreso',
    duration_min: 20,
    number: 6,
    title: 'Volver al presente',
    title_en: 'Back to the present',
    location: 'Descenso del Castillo → lago → Metro Chapultepec',
    kicker: 'El bosque sigue',
    next_hint: 'Termina de vuelta en el Metro Chapultepec.',
    image: 'lago',
    secondaryImage: 'bosque',
    lead: 'After gods, battles and emperors, the forest goes back to its everyday rhythm. The water, the trees and the people who visit them are part of a story that is still being written.',
    lead_en:
      'After gods, battles and emperors, the forest goes back to its everyday rhythm. The water, the trees and the people who visit them are part of a story that is still being written.',
    steps: [
      {
        title: 'El descenso',
        title_en: 'The descent',
        body: 'El cambio de perspectiva hace el trabajo de transición: al bajar, el Castillo se aleja y el bosque recupera su forma de bosque. Es un momento para volver a mirar lo que ya habías visto al subir, que ahora parece distinto.',
        body_en:
          'The change of perspective does the work of transition: going down, the Castle moves away and the forest becomes a forest again. It is a moment to look again at what you already saw on the way up, which now looks different.',
        observe: [],
      },
      {
        title: 'El lago',
        title_en: 'The lake',
        body: 'El Lago Mayor es la pausa del final del recorrido. Detente a observar el movimiento del agua, las embarcaciones y la vida cotidiana. Las lanchitas son una actividad opcional y no forman parte de un tiempo garantizado: no asumas disponibilidad sin verificarla el día de la visita.',
        body_en:
          'The big lake is the pause at the end of the walk. Stop and watch the movement of the water, the boats and everyday life. The paddle boats are an optional activity and are not part of any guaranteed time: do not assume availability without checking on the day.',
        observe: [
          'El movimiento del agua en la orilla',
          'La diferencia entre el ruido del bosque y el del lago',
          'Las actividades de la gente alrededor',
        ],
        observe_en: [
          'The movement of the water at the shore',
          'The difference between the noise of the forest and the noise of the lake',
          'What people are doing along the edge',
        ],
      },
      {
        title: 'Regresar al Metro',
        title_en: 'Back to the Metro',
        body: 'El recorrido cierra donde abrió, en la estación de Chapultepec. Volver por el mismo camino es parte de la lectura del lugar: ahora reconoces cosas que no existían para ti en la primera pasada.',
        body_en:
          'The route closes where it opened, at Chapultepec station. Coming back along the same ground is part of reading the place: now you recognise things that did not exist for you on the first pass.',
        observe: [],
      },
    ],
    closing:
      'Los imperios cambian. Las ciudades se transforman. Chapultepec sigue guardando las huellas de quienes pasaron por él.',
  },
]

/**
 * La ruta, por tramos. `walk` son minutos a pie estimados entre zonas; no son
 * una distancia verificada sobre el sitio y no se presentan como exactos.
 */
export const CHAPULTEPEC_ROUTE = [
  { zone: 'Metro Chapultepec', walk: 0, note: 'Punto de partida y de regreso.' },
  {
    zone: 'Puerta de los Leones',
    walk: 2,
    note: 'La entrada al bosque, al otro lado de la avenida.',
  },
  { zone: 'Puente del Tiempo', walk: 5, note: 'El puente peatonal y la galeria fotografica.' },
  { zone: 'Altar a la Patria', walk: 3, note: 'El monumento, en la entrada de la calzada.' },
  { zone: 'Audiorama y Cincalco', walk: 8, note: 'Baja por la arboleda, entre el bosque alto.' },
  { zone: 'Baños de Moctezuma', walk: 4, note: 'Junto al Audiorama, sobre el camino de subida.' },
  { zone: 'Castillo de Chapultepec', walk: 9, note: 'La subida al cerro. Es el tramo exigente.' },
  { zone: 'Lago', walk: 5, note: 'El descenso hacia el agua.' },
  { zone: 'Metro Chapultepec', walk: 10, note: 'Regreso por la calzada y la avenida.' },
]

/**
 * Escenarios de duracion. Son estimaciones: el recorrido no tiene una duracion
 * garantizada y las tres horas de referencia no incluyen una visita completa
 * al interior del Castillo.
 */
export const CHAPULTEPEC_DURATIONS = {
  minimo: '3 h 10 min',
  realista: '3 h 45 min',
  relajado: '4 h 20 min',
}

/** Advertencias de verificación que se muestran al visitante. */
export const CHAPULTEPEC_NOTES = [
  'El recorrido no tiene una duración garantizada. Calcula un margen amplio y confirma horarios de acceso el día de la visita.',
  'El acceso al interior de la cueva de Cincalco está restringido. Se visita desde el exterior.',
  'La lanchita del lago es una actividad opcional, no incluida en el recorrido.',
]

export const CHAPULTEPEC_JOURNEY = {
  id: 'chapultepec',
  slug: 'chapultepec',
  experience: 'chapultepec',
  title_es: 'Chapultepec — De los Dioses a Emperadores',
  title_en: 'Chapultepec — From Gods to Emperors',
  subtitle_es:
    'Un recorrido por las capas del bosque que fue territorio sagrado, campo de batalla y palacio.',
  subtitle_en:
    'A walk through the layers of a forest that was sacred ground, battlefield and palace.',
  intro_es:
    'Chapultepec no es un solo lugar. Es un acumulador de épocas que se leen en el mismo cerro. Este recorrido sigue seis momentos: del Metro al león de la entrada, del altar a la patria a la cueva, del bosque de los dioses al castillo de los emperadores, y de vuelta al agua.',
  intro_en:
    'Chapultepec is not a single place. It is an accumulation of eras readable on the same hill. This route follows six moments: from the Metro to the lion at the gate, from the national altar to the cave, from the forest of the gods to the castle of the emperors, and back to the water.',
  eyebrow_es: 'Primera Sección · Bosque de Chapultepec',
  eyebrow_en: 'First Section · Chapultepec Forest',
  duration_note_es:
    'Recorrido de unas tres horas como estimación. No es una duración garantizada: depende del acceso al Castillo y al Audiorama el día de la visita.',
  duration_note_en:
    'A walk of about three hours as an estimate. It is not a guaranteed duration: it depends on access to the Castle and the Audiorama on the day of the visit.',
  accents: ['talavera', 'cempasuchil'],
  // Precio de referencia, en pesos. Se muestra siempre en el detalle.
  price: 849,
  heroImage: `${IMG}/castillo-aereo.jpg`,
  // Calificacion: null mientras el journey no tenga reseñas.
  rating: null,
  reviewCount: 0,
  photos: CHAPULTEPEC_PHOTOS,
  moments: CHAPULTEPEC_MOMENTS,
  discoveries: CHAPULTEPEC_DISCOVERIES,
  route: CHAPULTEPEC_ROUTE,
  durations: CHAPULTEPEC_DURATIONS,
  notes: CHAPULTEPEC_NOTES,
  sources: SOURCES,
}
