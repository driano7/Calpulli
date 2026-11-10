// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Journey editorial "Roma-Condesa: la ciudad que se puso de moda".
 *
 * ---------------------------------------------------------------------------
 * CINCO MOMENTOS, UN RECORRIDO
 *   M01  La Romita    la ciudad que ya estaba aqui
 *   M02  Roma         la ciudad que quiso ser moderna
 *   M03  Alvaro Obregon  el barrio que cambia de valor
 *   M04  Hipodromo    caminar una geometria distinta
 *   M05  Parque Mexico  la ciudad como espacio compartido
 *
 * El itinerario (La Romita -> Plaza Rio de Janeiro -> Alvaro Obregón ->
 * Avenida Amsterdam -> Parque Mexico) esta validado por el fundador. Los
 * tiempos son de referencia: el recorrido cabe en tres horas y media sin
 * correr.
 *
 * ---------------------------------------------------------------------------
 * LO QUE ESTA SEPARADO Y LO QUE NO
 *   - `observe_es` / `observe_en`: lo que el visitante ve de frente.
 *   - `body_es` / `body_en`: lo que documentan las fuentes.
 *   - `pending_es` / `pending_en`: lo que falta y NO se rellena.
 *   - La capa tecnologica se presenta como HIPOTESIS editorial (la mirada
 *     del fundador) y como observacion, nunca como dato de mercado.
 *   - La comparacion con otras capitales latinoamericanas se hace por
 *     dimensiones concretas y nunca como equivalencia entre barrios.
 *
 * No se incluye la pelicula "Roma" de Alfonso Cuaron: se decidio no usarla
 * como puente en este recorrido.
 * ---------------------------------------------------------------------------
 */

const IMG = '/static/images/journeys/roma'

/**
 * Fotografias verificadas. Todas de Wikimedia Commons, con licencia comprobada
 * y credito en public/static/images/journeys/roma/CREDITS.md
 */
export const ROMA_PHOTOS = {
  plazaRomita: {
    src: `${IMG}/plaza-romita.jpg`,
    alt: 'Plaza de la Romita, con sus strange azoteas y el caserio de la colonia Roma.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  romita1: {
    src: `${IMG}/romita-1.jpg`,
    alt: 'Casas bajas frente a la Plaza de la Romita en la colonia Roma.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  temploRomita: {
    src: `${IMG}/templo-romita.jpg`,
    alt: 'Ermita de Santa Maria de la Natividad de Aztacalco, en la Plaza de la Romita.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  muralRomita: {
    src: `${IMG}/mural-romita.jpg`,
    alt: 'Mural frente a la Plaza de la Romita, con la Virgen de Guadalupe y una motocicleta.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  plazaRio: {
    src: `${IMG}/plaza-rio-de-janeiro.jpg`,
    alt: 'Plaza Rio de Janeiro, con el arbolado y las casas porfirianas que la rodean.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  casasPlazaRio: {
    src: `${IMG}/casas-plaza-rio.jpg`,
    alt: 'Fachadas de las casas clasicas que rodean la Plaza Rio de Janeiro.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  davidPlaza: {
    src: `${IMG}/david-plaza-rio.jpg`,
    alt: 'Replica del David de Miguel Angel en la Plaza Rio de Janeiro.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  casaBrujas: {
    src: `${IMG}/casa-de-las-brujas.jpg`,
    alt: 'Costado del edificio Rio de Janeiro, conocido popularmente como la Casa de las Brujas.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  letreroBrujas: {
    src: `${IMG}/letrero-las-brujas.jpg`,
    alt: 'Letrero que dice "Las brujas" en el costado del edificio Rio de Janeiro.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  contraEsquina: {
    src: `${IMG}/contra-esquina-brujas.jpg`,
    alt: 'Contra esquina de la Casa de las Brujas en la Plaza Rio de Janeiro.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  obregonPanoramica: {
    src: `${IMG}/alvaro-obregon-panoramica.jpg`,
    alt: 'Panoramica de la calle Medellin y la Avenida Alvaro Obregon, en la colonia Roma.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  floresObregon: {
    src: `${IMG}/flores-alvaro-obregon.jpg`,
    alt: 'Flores en el camellon de la Avenida Alvaro Obregon.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  farolObregon: {
    src: `${IMG}/farol-alvaro-obregon.jpg`,
    alt: 'Farol en la Avenida Alvaro Obregon, en la colonia Roma.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  obregonInsurgentes: {
    src: `${IMG}/alvaro-obregon-insurgentes.jpg`,
    alt: 'Panoramica de la Avenida Alvaro Obregon en su cruce con Insurgentes.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  amsterdam1: {
    src: `${IMG}/amsterdam-1.jpg`,
    alt: 'Avenida Amsterdam, con su trazado curvo en la colonia Hipodromo Condesa.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  amsterdam2: {
    src: `${IMG}/amsterdam-2.jpg`,
    alt: 'Avenida Amsterdam y su camellon arbolado, en la colonia Hipodromo Condesa.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  amsterdamSonora: {
    src: `${IMG}/amsterdam-sonora.jpg`,
    alt: 'Camellon de la Avenida Amsterdam en su cruce con la Avenida Sonora.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  casaAmsterdam: {
    src: `${IMG}/casa-amsterdam.jpg`,
    alt: 'Casa de la Avenida Amsterdam, en la colonia Hipodromo Condesa.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  parqueEspana: {
    src: `${IMG}/parque-espana.jpg`,
    alt: 'Parque Espana, uno de los espacios verdes de la colonia Hipodromo.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  parqueEspanaVegetacion: {
    src: `${IMG}/parque-espana-vegetacion.jpg`,
    alt: 'Vegetacion del Parque Espana, en la colonia Hipodromo Condesa.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  foroLindbergh: {
    src: `${IMG}/foro-lindbergh.jpg`,
    alt: 'Foro Lindbergh en el Parque Mexico, con su estilo art deco.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  foroLindberghDetalle: {
    src: `${IMG}/foro-lindbergh-detalle.jpg`,
    alt: 'Detalle de los relieves de la tragedia y la comedia en el Foro Lindbergh.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  vistaForo: {
    src: `${IMG}/vista-foro-lindbergh.jpg`,
    alt: 'Vista del Foro Lindbergh desde el Parque Mexico.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  parqueMexicoAerea: {
    src: `${IMG}/parque-mexico-aerea.jpg`,
    alt: 'Vista aerea del Parque Mexico, con su trazo eliptico.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
}

/**
 * Los tres restaurantes de la misma cuadra, verificados. La comida es una
 * parada del recorrido, no un extra: esta en la calle que se esta contando.
 */
export const ROMA_COMIDA = {
  principal: {
    nombre_es: 'Taquería Álvaro Obregón',
    nombre_en: 'Taquería Álvaro Obregón',
    direccion_es: 'Av. Álvaro Obregón 90, Roma Norte',
    direccion_en: 'Av. Álvaro Obregón 90, Roma Norte',
    horario_es: 'Lunes a sábado de 13:00 a 04:45; domingo de 13:00 a 22:15',
    horario_en: 'Monday to Saturday 1:00 pm to 4:45 am; Sunday 1:00 pm to 10:15 pm',
    desde_es: 'Abierta desde 1996',
    desde_en: 'Open since 1996',
    detalle_es:
      'Trompo de cerdo, suadero, longaniza, cabeza cocida al vapor y lengüita. Una sopa del día de regalo de lunes a viernes, de 13:00 a 17:00, con un mínimo de cinco tacos.',
    detalle_en:
      'Pork trompo, suadero, longaniza, steamed beef head and tongue. A soup of the day on the house from Monday to Friday, 1:00 pm to 5:00 pm, with a minimum of five tacos.',
  },
  alternativa1: {
    nombre_es: 'Taquería Orinoco',
    nombre_en: 'Taquería Orinoco',
    direccion_es: 'Av. Álvaro Obregón 100, a diez metros de la anterior',
    direccion_en: 'Av. Álvaro Obregón 100, ten meters from the previous one',
    horario_es:
      'Lunes a miércoles de 13:00 a 03:30; jueves hasta 04:00; viernes y sábado hasta 05:30; domingo de 13:00 a 03:30',
    horario_en:
      'Monday to Wednesday 1:00 pm to 3:30 am; Thursday until 4:00 am; Friday and Saturday until 5:30 am; Sunday 1:00 pm to 3:30 am',
    desde_es:
      'La que puso el nombre: en 2015 inventó la "orinificación", el estilo de taquería de mercado con azulejos, mobiliario de metal y cumbia',
    desde_en:
      'The one that named the style: in 2015 it invented "orinificación", the market taquería look with tiles, metal furniture and cumbia',
    detalle_es:
      'Al pastor, al carbón, campechanos, chicharrón y suadero. La fila se hace larga entre las nueve de la noche y la medianoche.',
    detalle_en:
      'Al pastor, charcoal, campechanos, pork crackling and suadero. The queue gets long between nine at night and midnight.',
  },
  alternativa2: {
    nombre_es: 'Tacos Atarantados',
    nombre_en: 'Tacos Atarantados',
    direccion_es: 'Córdoba 113, Roma Norte, a una cuadra del camellón',
    direccion_en: 'Córdoba 113, Roma Norte, one block from the median',
    horario_es: 'Todos los días de 13:00 a 01:00; viernes y sábado hasta las 02:00',
    horario_en: 'Every day from 1:00 pm to 1:00 am; Friday and Saturday until 2:00 am',
    desde_es:
      'Franquicia regiomontana: abrió su primera sucursal en Monterrey en 2022 y llegó a la Roma Norte en 2024',
    desde_en:
      'A franchise from Monterrey: it opened its first branch in Monterrey in 2022 and reached Roma Norte in 2024',
    detalle_es:
      'Cuatro trompos: cerdo, arrachera, negro y chicharrón. La orden surtida de cuatro piezas cuesta alrededor de 155 pesos.',
    detalle_en:
      'Four trompos: pork, arrachera, black pork and pork crackling. The four-piece mixed order costs about 155 pesos.',
  },
}

/** Etiquetas de las tarjetas de descubrimiento. */
export const ROMA_DISCOVERY_KINDS = {
  documentado: { label: 'Documentado', tone: 'documentado' },
  observacion: { label: 'Lo que se observa', tone: 'curiosidad' },
  pendiente: { label: 'Pendiente de documentar', tone: 'tradicion' },
}

export const ROMA_JOURNEY = {
  id: 'roma',
  slug: 'roma',
  experience: 'roma',
  title_es: 'Roma–Condesa',
  title_en: 'Roma–Condesa',
  subtitle_es: 'La ciudad que se puso de moda',
  subtitle_en: 'The city that became fashionable',
  intro_es:
    'Roma y Condesa son dos barrios que se inventaron a principios del siglo pasado y que hoy se venden como una sola idea: la de un lugar donde vive, se come y se trabaja con gusto. Este recorrido no explica por qué se puso de moda. Explica qué se construyó aquí, quién lo habitó, qué pasó con el valor del suelo y qué preguntas deja una ciudad que se rehízo para habitarse.',
  intro_en:
    'Roma and Condesa are two neighborhoods invented at the beginning of the last century and now sold as a single idea: a place where you live, eat and work with pleasure. This route does not explain why it became fashionable. It explains what was built here, who lived in it, what happened to the value of the land, and what questions a city leaves behind when it rebuilds itself to be lived in.',
  eyebrow_es: 'Ciudad de México',
  eyebrow_en: 'Mexico City',
  heroImage: `${IMG}/plaza-rio-de-janeiro.jpg`,
  heroTitleLines: ['Roma–Condesa:', 'la ciudad que se puso de moda'],
  accents: ['terracota', 'cempasuchil'],
  photos: ROMA_PHOTOS,
  comida: ROMA_COMIDA,
  notes: [
    'El recorrido son 1.7 kilometros a pie, de La Romita a Parque Mexico, con una comida en el camino. Se hace en unas tres horas y media sin correr.',
    'La comida es una parte del recorrido, no una pausa: esta en la calle que se esta contando, en la misma cuadra.',
    'Los horarios de las taquerias y del recinto son los publicados por cada uno. La fila depende del dia y de la hora.',
    'Lo que se documenta y lo que se observa van separados en cada momento. Lo que no esta verificado aparece como pendiente, nunca rellenado.',
    'La comparacion con otras capitales latinoamericanas es por dimensiones concretas, no una equivalencia entre barrios.',
  ],
  verified_on: '2026-10-21',
  price: 649,
  moments: [
    {
      id: 'roma-1-romita',
      number: 1,
      title_es: 'La Romita',
      title_en: 'La Romita',
      location_es: 'Plaza de la Romita, colonia Roma',
      location_en: 'Plaza de la Romita, Colonia Roma',
      duration_min: 30,
      kicker_es: 'La ciudad que ya estaba aquí',
      kicker_en: 'The city that was already here',
      question_es: '¿Qué había aquí antes de que existiera una colonia?',
      question_en: 'What was here before there was a neighborhood?',
      lead_es:
        'El nombre del barrio más joven de la ciudad viene de un lugar mucho más viejo. Antes de las calles trazadas y las fachadas porfirianas, este era un pueblo: Aztacalco, en casa de las garzas. Cuando en 1902 se fraccionó la colonia, el pueblo no desaparece: se queda, con su plaza, con su templo chiquito y con su gente, y la colonia se construyó alrededor y a un lado suyo.',
      lead_en:
        'The name of the city youngest district comes from a much older place. Before the planned streets and the Porfirian facades, this was a village: Aztacalco, in the house of the herons. When the neighborhood was laid out in 1902, the village did not disappear: it stayed, with its square, its small chapel and its people, and the neighborhood was built around and beside it.',
      image: 'plazaRomita',
      steps: [
        {
          title_es: 'El pueblo antes de la colonia',
          title_en: 'The village before the neighborhood',
          body_es:
            'El asentamiento tenía nombre prehispánico: Aztacalco, "en la casa de las garzas". Sobre una ermita de la Natividad levantada en 1530 por fray Pedro de Gante se bautizó hacia 1537 a los primeros indígenas, según la cronología de la ciudad. Su territorio era el potrero: pastos, ganado y el contrato del "obligado" que abastecía de carne a la capital. Cuando en 1856 la desamortizacion puso a la venta las bienes de las comunidades, vecinos de la Romita compraron sus terrenos por sumas muy pequeñas, y con el tiempo las tierras pasaron a formar parte de la hacienda de la Condesa, una de las más prosperas de la época.',
          body_en:
            'The settlement had a pre-Hispanic name: Aztacalco, "in the house of the herons". On a chapel of the Nativity raised in 1530 by friar Pedro de Gante, the first Indigenous people were baptized around 1537, according to the city chronicle. Its territory was the grazing ground: pasture, cattle and the contract of the "obligado" who supplied meat to the capital. When the 1856 disentailment put communal property up for sale, neighbors of the Romita bought their land for very small sums, and over time those lands became part of the Condesa estate, one of the most prosperous of its time.',
          observe_es: [
            'La plaza conserva una escala de pueblo: casas bajas alrededor, un templete pequeño al fondo y una sola arboleda.',
            'Los ahuehuetes que flanquearon el atrio se ven todavía en el entorno; dos de ellos aparecen en Los Olvidados, de Luis Buñuel, filmada aquí en 1950.',
            'El templo se ve desde la calle, seis escalones más arriba que la plaza: hay que subir a el para entrar.',
          ],
          observe_en: [
            'The square keeps a village scale: low houses around it, a small chapel at the end and a single cluster of trees.',
            'The ahuehuete trees that flanked the atrium are still around; two of them appear in Los Olvidados, by Luis Buñuel, filmed here in 1950.',
            'The chapel is visible from the street, six steps above the square: you have to climb up to get in.',
          ],
          image: 'temploRomita',
        },
        {
          title_es: 'El nombre',
          title_en: 'The name',
          body_es:
            'Porque un cura dijo que la calzada de cipreses que llevaba a la capilla se parecia a las avenidas de Roma, en Italia, el lugar empezó a ser conocido como la Romita. El nombre está documentado desde 1752. Cuando en 1902 se fraccionó la colonia, los fundadores eligieron el nombre de Roma, y el diminutivo del pueblo quedó como la excepción: un lugar con nombre propio dentro de una colonia que se nombraba como una capital europea.',
          body_en:
            'Because a priest said that the cypress-lined causeway leading to the chapel looked like the avenues of Rome, Italy, the place came to be known as the Romita. The name is documented from 1752. When the neighborhood was laid out in 1902, the founders chose the name Roma, and the village diminutive remained as the exception: a place with its own name inside a neighborhood named after a European capital.',
          observe_es: [
            'El templo actual se llama San Francisco Javier: los jesuitas llegaron en 1929 y lo dedicaron al nombre de su santo.',
            'La iglesia fue declarada monumento en 1944, y la plaza se reconocio como parte del acervo cultural de la ciudad en 1980.',
          ],
          observe_en: [
            'The church is now called San Francisco Javier: the Jesuits arrived in 1929 and dedicated it to their saint.',
            'The church was declared a monument in 1944, and the square was recognized as part of the city cultural heritage in 1980.',
          ],
          image: 'muralRomita',
        },
      ],
      operational_es:
        'La plaza es pequeña y el acceso vehicular es cómodo en el centro, pero el camellon de la avenida Chapultepec, a media cuadra, es la via más ancha y la más ruidosa de la zona. Mejor llegar por Orizaba.',
      operational_en:
        'The square is small and driving access is easy in the middle, but the median of Chapultepec avenue, half a block away, is the widest and noisiest road around. Better to arrive on Orizaba.',
    },
    {
      id: 'roma-2-proyecto',
      number: 2,
      title_es: 'La ciudad que quiso ser moderna',
      title_en: 'The city that wanted to be modern',
      location_es: 'Plaza Río de Janeiro y sus alrededor',
      location_en: 'Plaza Río de Janeiro and its surroundings',
      duration_min: 40,
      kicker_es: 'Roma, 1902',
      kicker_en: 'Roma, 1902',
      question_es: '¿Se puede construir una colonia para la ciudad que se quiere tener?',
      question_en: 'Can you build a neighborhood for the city you want to have?',
      lead_es:
        'El 24 de enero de 1902, Edward Walter Orrin pidió al Ayuntamiento permiso para fraccionar los potreros de Romita. No pidió solo lotes: se comprometió a hacer drenaje, pavimentación, agua potable y banquetas, y a ceder áreas para jardines, iglesias, un cuartel, un mercado y una escuela. Las calles se llamarían con nombres de ciudades, en memoria de las giras del circo que era suyo, donde la 말이 en el payaso Bell y donde el circo había sido más aplaudido.',
      lead_en:
        'On January 24, 1902, Edward Walter Orrin asked the City Council for permission to subdivide the Romita grazing lands. He did not ask for lots alone: he committed to drainage, paving, potable water and sidewalks, and to give up land for gardens, churches, a police station, a market and a school. The streets would carry the names of cities, in memory of the tours of his circus, where the draw was the clown Bell and where the circus had been most applauded.',
      image: 'plazaRio',
      steps: [
        {
          title_es: 'Un fraccionamiento con obligaciones',
          title_en: 'A subdivision with obligations',
          body_es:
            'Los lotes eran grandes: entre mil y cinco mil metros cuadrados, con frentes de veinte a treinta y siete metros y fondos de cincuenta y dos a sesenta. A veinticinco pesos el metro cuadrado, el resultado son las casas grandes con jardín y las primeras casas de departamentos de la ciudad. La colonia se dibujo como bulevares: las avenidas Orizaba, Veracruz y Jalisco, que despues serian Orizaba, Veracruz y Álvaro Obregón. En 1905, los dos fraccionadores pidieron al Ayuntamiento nombrar sus calles con nombres de estados y territorios, porque la nomenclatura numérica introducida en 1887 había resultado confusa.',
          body_en:
            'The lots were large: between one thousand and five thousand square meters, with fronts of twenty to thirty-seven meters and depths of fifty-two to sixty. At twenty-five pesos per square meter, the result is the big houses with gardens and the first apartment buildings in the city. The neighborhood was drawn as boulevards: the avenues Orizaba, Veracruz and Jalisco, later Orizaba, Veracruz and Alvaro Obregon. In 1905, the two developers asked the City Council to name their streets after states and territories, because the numeric street naming introduced in 1887 had proved confusing.',
          observe_es: [
            'Los frentes de las casas porfirianas miden varias veces el ancho de una calle actual: la escala de la manzana es de otro siglo.',
            'Las esquinas recortadas y los portales se mezclan con edificios de departamentos de los anos treinta a cincuenta.',
            'Plaza Río de Janeiro se creo en 1903, en Durango y Orizaba, en un terreno que donaron los fraccionadores para áreas verdes.',
          ],
          observe_en: [
            'The fronts of the Porfirian houses measure several times the width of a street today: the block scale belongs to another century.',
            'Chamfered corners and porches mix with apartment buildings from the thirties to the fifties.',
            'Plaza Rio de Janeiro was created in 1903, at Durango and Orizaba, on land the developers donated for green space.',
          ],
          image: 'casasPlazaRio',
        },
        {
          title_es: 'El nombre de la plaza y el del edificio',
          title_en: 'The name of the square and of the building',
          body_es:
            'La plaza se llamó primero Parque Roma, luego Parque Orizaba, y en 1922 pasó a llamarse Plaza Río de Janeiro por iniciativa de José Vasconcelos, entonces titular de Educación Pública, con motivo posible del centenario de la independencia de Brasil. Los colonos no lo aceptaron. Alrededor, en la esquina, el edificio de ladrillo que le da nombre fue obra en 1908 del ingeniero británico Regis A. Pigeon, que también diseño el Castillo Colorado de la colonia Juárez. Su torre de techo cónico parece un sombrero de bruja y sus vanos sugieren un rostro: por eso todo el mundo le dice la Casa de las Brujas. En su interior se le agregaron detalles art deco en los anos treinta.',
          body_en:
            'The square was first called Parque Roma, then Parque Orizaba, and in 1922 it became Plaza Rio de Janeiro at the initiative of Jose Vasconcelos, then Secretary of Public Education, possibly because of the centenary of Brazilian independence. The residents did not accept it. Next to it, on the corner, the brick building that gives it its name was built in 1908 by the British engineer Regis A. Pigeon, who also designed the Red Castle in Colonia Juarez. Its tower with a conical roof looks like a witch hat and its openings suggest a face: that is why everyone calls it the House of the Witches. Art deco details were added to its interior in the thirties.',
          observe_es: [
            'El techo cónico de la torre se ve desde Orizaba, por encima de los árboles de la plaza.',
            'El David de bronce que esta en la fuente fue instalado en 1976, muchos anos despues de la plaza.',
            'La multiplicación del nombre popular (las brujas) sobre el nombre oficial (edificio Río de Janeiro) es la regla del barrio: manda el apodo.',
          ],
          observe_en: [
            "The conical roof of the tower is visible from Orizaba, above the square's trees.",
            'The bronze David in the fountain was installed in 1976, many years after the square itself.',
            'The popular name (the witches) winning over the official one (Rio de Janeiro building) is the neighborhood rule: the nickname rules.',
          ],
          image: 'casaBrujas',
        },
      ],
      operational_es:
        'La Plaza Río de Janeiro funciona como pasó: es una plaza de barrio, con bancas y perritos. Dos o tres minutos bastan para ver el edificio y seguir. En hora de comida, los sentados de la esquina se llenan.',
      operational_en:
        'Plaza Rio de Janeiro works as a pass-through: it is a neighborhood square, with benches and dogs. Two or three minutes are enough to see the building and move on. Around lunch, the corner tables fill up.',
    },
    {
      id: 'roma-3-obregon',
      number: 3,
      title_es: 'El barrio que cambia de valor',
      title_en: 'The neighborhood that changes value',
      location_es: 'Avenida Álvaro Obregón, Roma Norte',
      location_en: 'Av. Álvaro Obregón, Roma Norte',
      duration_min: 45,
      kicker_es: 'Álvaro Obregón, la calle principal',
      kicker_en: 'Álvaro Obregón, the main street',
      question_es: '¿Qué pasa con una calle cuando su valor cambia de manos?',
      question_en: 'What happens to a street when its value changes hands?',
      lead_es:
        'Álvaro Obregón se llamaba Jalisco y era un camino de terracería con caballerizas. Hoy es el bulevar de la colonia: el camellón, los restaurantes, las librerías, los coworkings y las terrazas. Lo que cambió no fue solo el comercio: cambió para quién está la calle. Y para entenderlo conviene mirar dos mercados distintos, porque no se mueven igual.',
      lead_en:
        'Alvaro Obregon was called Jalisco and it was a dirt road with horse stables. Today it is the boulevard of the neighborhood: the median, the restaurants, the bookshops, the coworkings and the terraces. What changed was not only the commerce: it changed for whom the street is. And to understand it, it helps to look at two different markets, because they do not move the same way.',
      image: 'obregonPanoramica',
      steps: [
        {
          title_es: 'Dos mercados, dos velocidades',
          title_en: 'Two markets, two speeds',
          body_es:
            'En la venta, el ticket promedio de la zona subió de 5,152 a 5,716 pesos por metro cuadrado entre 2019 y 2024, un 11 por ciento: en línea con la inflación, según un análisis de Metric Analysis con datos de la Sociedad Hipotecaria Federal y del INEGI. En la renta, la historia es otra: los precios anunciados en portales inmobiliarios subieron más de 80 por ciento en la Roma Norte y casi 88 por ciento en la Condesa entre la pandemia y el primer semestre de 2025, mientras el ingreso laboral promedio de la ciudad creció alrededor de 25 por ciento. La oferta nueva se concentro en el tope del mercado: el segmento medio cayo 51 por ciento y el semilujo creció 56. No es que la colonia se haya vuelto más cara en todo: es que el borde del mercado se movio y los que estaban en el medio quedaron fuera.',
          body_en:
            'On the sales side, the average ticket in the area went from 5,152 to 5,716 pesos per square meter between 2019 and 2024, 11 percent: in line with inflation, according to a Metric Analysis study using Sociedad Hipotecaria Federal and INEGI data. On the rental side, the story is different: asking prices on property portals rose more than 80 percent in Roma Norte and close to 88 percent in Condesa between the pandemic and the first half of 2025, while the average labor income in the city grew by around 25 percent. New supply concentrated at the top of the market: the mid segment fell 51 percent and the semi-luxury segment grew 56 percent. The neighborhood did not simply become more expensive across the board: the edge of the market moved, and what was in the middle fell out of it.',
          observe_es: [
            'Es el mismo camellon porfiriano, con la misma geometría, y sin embargo el suelo vale distinto: el valor cambió por debajo de las fachadas.',
            'Un mismo restaurante puede tener dos precios en la misma cuadra: el del menu y el de la renta del local.',
            'Las buhardillas y los balcones que se renting por días conviven con los negocios de familia que llevan decades aquí.',
          ],
          observe_en: [
            'It is the same Porfirian median, with the same geometry, and yet the land is worth something else: the value changed underneath the facades.',
            'A single eating place can carry two price codes on the same block: the menu and the rent of the premises.',
            'Attic rooms and balconies rented by the day live alongside family businesses that have been here for decades.',
          ],
        },
        {
          title_es: 'La comida, a media cuadra',
          title_en: 'Food, half a block away',
          body_es:
            'En la misma cuadra de Álvaro Obregón hay tres taquerías que cuentan historias distintas de la ciudad. La más antigua abrió en 1996 y sigue sirviendo trompo, suadero y cabeza cocida al vapor, con una sopa del día de regalo entre semana. Orinoco, a diez metros, fue la que invento en 2015 la "orinificación", el estilo de taquería de mercado con azulejos, metal y cumbia, y es la que fija el ritmo de la noche: la fila se hace larga entre las nueve y la medianoche. Los Atarantados llegaron desde Monterrey en 2024 con cuatro trompos y un formato de franquicia. Comer aquí es observar el barrio: tres precios, tres públicos y tres formas de entender la misma calle.',
          body_en:
            'On the same block of Alvaro Obregon there are three taquerias that tell different stories about the city. The oldest opened in 1996 and still serves trompo, suadero and steamed beef head, with a soup of the day on the house on weekdays. Orinoco, ten meters away, invented "orinificacion" in 2015, the market taquería look with tiles, metal and cumbia, and it sets the rhythm of the night: the queue gets long between nine and midnight. The Atarantados arrived from Monterrey in 2024 with four trompos and a franchise format. Eating here is observing the neighborhood: three prices, three publics and three ways of reading the same street.',
          observe_es: [
            'La hora importa: los horarios van de la 13:00 a la madrugada, pero la fila cambia según el día y la hora.',
            'No se afirma que un lugar este vacío o lleno: la espera depende del día y de la hora, y la información publicada cambia cada semana.',
            'En las tres, el taco se come de pie o en la banqueta: la comida forma parte de la calle, no de un interior.',
          ],
          observe_en: [
            'Timing matters: the hours run from 1:00 pm into the night, but the queue changes with the day and the hour.',
            'No claim is made that a place is empty or full: the wait depends on the day and the hour, and the published information changes every week.',
            'In all three, the taco is eaten standing or on the curb: the food is part of the street, not of an interior.',
          ],
          image: 'floresObregon',
        },
        {
          title_es: 'La capa de la tecnología',
          title_en: 'The technology layer',
          body_es:
            'Una hipótesis de Calpulli CDMX, que se explicita como hipótesis: Roma se parece a un San Francisco latino no por su tecnología, sino por su forma de trabajar. Aquí el equipo chico no va a una oficina de corporación: usa una mesa de cafetería, un coworking en una casa porfiriana, o la terraza de un bar. Es un laboratorio de trabajo remoto, no un centro de innovación. Lo que si esta documentado es el efecto sobre el comercio: la aparicion de espacios de trabajo compartidos y de restaurantes de categoría superior en el lugar de las fondas, y el crecimiento de las plataformas de renta corta. La relacion entre una cosa y la otra es una hipótesis editorial, no un dato medido.',
          body_en:
            'A Calpulli CDMX hypothesis, stated as a hypothesis: Roma resembles a Latin American San Francisco not for its technology but for the way it works. A small team here does not go to a corporate office: it uses a cafe table, a coworking in a Porfirian house, or a bar terrace. It is a remote-work laboratory, not an innovation center. What is documented is the effect on the shops: the arrival of shared workspaces and higher-end restaurants where the fondas used to be, and the growth of short-term rental platforms. The link between one thing and the other is an editorial hypothesis, not a measured fact.',
          observe_es: [
            'Cafés con enchufes, mesas ocupadas con laptops, y el mismo local que por la tarde es una oficina.',
            'Coworkings como WeWork en Parque España, Iknal, Openhub o Uotan tienen su propia dirección y horario, verificables.',
            'No se afirma que esta zona sea el principal centro tecnológico del país: no hay evidencia para eso.',
          ],
          observe_en: [
            'Cafes with sockets, tables taken by people with laptops, and the same place that in the afternoon is an office.',
            'Coworkings such as WeWork in Parque Espana, Iknal, Openhub or Uotan have their own verifiable address and hours.',
            'No claim is made that this is the country main technology hub: there is no evidence for that.',
          ],
          image: 'farolObregon',
        },
      ],
      operational_es:
        'La avenida tiene tres carriles por sentido y el tráfico es denso en la tarde. El camellón es el lugar seguro para detenerse. Para comer, conviene llegar antes de las nueve de la noche en viernes y sábado.',
      operational_en:
        'The avenue has three lanes each way and traffic is heavy in the afternoon. The median is the safe place to stop. To eat, it is better to arrive before nine at night on Friday and Saturday.',
    },
    {
      id: 'roma-4-hipodromo',
      number: 4,
      title_es: 'Caminar una geometría distinta',
      title_en: 'Walking a different geometry',
      location_es: 'Avenida Ámsterdam, colonia Hipódromo',
      location_en: 'Avenida Ámsterdam, Colonia Hipódromo',
      duration_min: 25,
      kicker_es: 'Hipódromo, 1925',
      kicker_en: 'Hipódromo, 1925',
      question_es: '¿Qué pasa cuando una ciudad nueva adopta la forma de otra cosa?',
      question_en: 'What happens when a new city takes the shape of something else?',
      lead_es:
        'La Condesa no se traza como una retícula. Se traza como una pista de carreras. En 1910 se inauguró el hipódromo en esos terrenos; en 1924 o 1925, la compañía De la Lama y Basurto compró los predios al Jockey Club y el arquitecto José Luis Cuevas adaptó el fraccionamiento a la forma elíptica de la pista, en vez de imponer las manzanas cuadradas de la época. De ahí viene una calle que no termina nunca de ser recta.',
      lead_en:
        'Condesa was not laid out as a grid. It was laid out as a race track. The racecourse opened on those lands in 1910; in 1924 or 1925, the De la Lama and Basurto company bought the land from the Jockey Club and architect José Luis Cuevas adapted the subdivision to the elliptical shape of the track instead of imposing the square blocks of the time. That is where a street that never quite straightens comes from.',
      image: 'amsterdam1',
      steps: [
        {
          title_es: 'La pista que dura dos años',
          title_en: 'The track that lasted two years',
          body_es:
            'La pista del hipódromo de la Condesa se inauguró el 23 de octubre de 1910, con Porfirio Díaz a la cabeza. Su trazo es la actual Avenida Ámsterdam, que funcionó como pista poco más de dos años: la revolución y luego el fin de las carreras en 1913 la dejaron como pista velada para otras cosas: atletismo y competencias de autos, hasta que en los años veinte se vendió el terreno. El contrato de 1910 incluía una cláusula: si despues de quince años el Jockey Club dejaba de usar el suelo, podia fraccionarlo, pero debia donar 60 mil metros cuadrados para un parque. Ese parque es la condicion por la que hoy existe el Parque México.',
          body_en:
            'The Condesa racecourse opened on October 23, 1910, with Porfirio Diaz at the head of it. Its track is today Avenida Amsterdam, which worked as a track for barely two years: the revolution and then the end of racing in 1913 left it as a track for other things, athletics and motor competitions, until the land was sold in the twenties. The 1910 contract included a clause: if after fifteen years the Jockey Club stopped using the land, it could subdivide it, but it had to donate sixty thousand square meters for a park. That park is the condition by which Parque Mexico exists today.',
          observe_es: [
            'Camina el ovalo: es la única forma de comprobar que las manzanas no son cuadros.',
            'Las glorietas de Popocatépetl al norte, y de Ixtaccíhuatl y Citlaltépetl al sur, son los puntos donde el trazo se cierra.',
            'El trazo continua en las avenidas de Mazatlán, Durango, Alfonso Reyes y Veracruz: el mismo curva, con otro nombre.',
          ],
          observe_en: [
            'Walk the oval: it is the only way to check that the blocks are not squares.',
            'The Popocatepetl roundabout to the north and the Ixtaccíhuatl and Citlaltépetl ones to the south are where the line closes.',
            'The line continues on the Mazatlan, Durango, Alfonso Reyes and Veracruz avenues: the same curve, another name.',
          ],
          image: 'amsterdamSonora',
        },
        {
          title_es: 'La geometría que se planteria',
          title_en: 'The geometry that was planted',
          body_es:
            'El diseño del Parque México se atribuye a Leonardo Noriega y al ingeniero Javier Stávoli, y el foro que lo corona, a los mismos, en 1927, con relieves de Roberto Montenegro. No es un jardín cuadrado: es un estudio paisajístico de nueve hectáreas con trazo elíptico, estanques, cascadas y senderos que serpentean, al contrario que la Alameda. La colonia entera es hoy una de las más verdes de la ciudad, con el 40 por ciento de su superficie en áreas verdes, y 250 edificios catalogados como monumentos artísticos o históricos. En 1936 y 1937 Luis Barragan construyo dos casas en la avenida Parque México, 141 y 143, publicadas en la revista Architectural Record.',
          body_en:
            'The design of Parque Mexico is attributed to Leonardo Noriega and the engineer Javier Stavoli, and the forum that crowns it to the same, in 1927, with reliefs by Roberto Montenegro. It is not a square garden: it is a nine-hectare landscape study with an elliptical layout, ponds, waterfalls and winding paths, unlike the Alameda. The whole neighborhood is now one of the greenest in the city, with 40 percent of its surface in green space, and 250 buildings listed as artistic or historic monuments. In 1936 and 1937 Luis Barragan built two houses on Parque Mexico avenue, 141 and 143, published in Architectural Record.',
          observe_es: [
            'Las casas de Barragan son las de la fachada sobria, con una ventana horizontal larga en el primer piso.',
            'El verde no es decorativo: es el 40 por ciento de la superficie de la colonia, y el contrato de 1910 lo exigía.',
            'El Parque España, de 1921, es la otra pieza verde de la colonia, y también es obra de Cuevas.',
          ],
          observe_en: [
            "Barragan's houses are the sober facades, with a long horizontal window on the first floor.",
            'The greenery is not decorative: it is 40 percent of the neighborhood surface, and the 1910 contract required it.',
            'Parque Espana, from 1921, is the other green piece of the neighborhood, and also by Cuevas.',
          ],
          image: 'parqueEspana',
        },
      ],
      operational_es:
        'Avenida Ámsterdam es de un solo sentido en varios tramos y es la calle más caminada de la colonia. Conviene cruzarla por las glorietas: son las únicas partes anchas.',
      operational_en:
        'Avenida Amsterdam is one-way in several stretches and it is the most walked street in the neighborhood. It is best crossed at the roundabouts: they are the only wide parts.',
    },
    {
      id: 'roma-5-parque',
      number: 5,
      title_es: 'La ciudad como espacio compartido',
      title_en: 'The city as a shared space',
      location_es: 'Parque México, colonia Hipódromo',
      location_en: 'Parque México, Colonia Hipódromo',
      duration_min: 35,
      kicker_es: 'El cierre del recorrido',
      kicker_en: 'The end of the route',
      question_es: '¿Quién puede estar en un parque que la ciudad construyó con reglas?',
      question_en: 'Who gets to be in a park the city built with rules?',
      lead_es:
        'El Parque México se inauguró en diciembre de 1927 y lleva el nombre oficial de Parque General San Martín, en un gesto que la Secretaría de Relaciones Exteriores propuso a la ciudad para agradecer a Argentina. El nombre que la gente usa viene de otra cosa: de la avenida que lo rodea. Su foro, el Foro Lindbergh, se construyo el mismo ano y recibio ese nombre en enero de 1928, despues del vuelo sin escalas del aviador a través del que se quiso saludar a dos paises. El parque tiene placas que explican como comportarse en el. Se construye como educacion, no como decoración.',
      lead_en:
        'Parque Mexico opened in December 1927 and its official name is Parque General San Martin, a gesture the Foreign Ministry proposed to the city in order to thank Argentina. The name people use comes from something else: the avenue that surrounds it. Its forum, the Lindbergh Forum, was built the same year and got that name in January 1928, after the nonstop flight through which two countries wanted to be greeted. The park has plaques explaining how to behave in it. It was built as education, not as decoration.',
      image: 'foroLindbergh',
      steps: [
        {
          title_es: 'Un parque que enseña',
          title_en: 'A park that teaches',
          body_es:
            'El parque se entrega con un programa: fue el primer espacio verde de la ciudad concebido con un diseño arquitectónico, con fuentes, estanques, cascadas y puentes que imitan el jardín europeo. Las placas montadas en los senderos no son un adorno: explican las reglas de convivencia, como en una escuela al aire libre. La fuente de los Cántaros, a la entrada de Michoacán, es de José María Fernández Urbina, el mismo que restauro el Angel de la Independencia despues del terremoto de 1958. Y el reloj de la torre, con su ferreteria de art deco, emitía música clasica para marcar la hora.',
          body_en:
            'The park comes with a program: it was the first green space in the city conceived with an architectural design, with fountains, ponds, waterfalls and bridges that imitate the European garden. The plaques mounted along the paths are not decoration: they explain the rules of living together, as in an outdoor school. The Fountain of the Jars, at the Michoacan entrance, is by Jose Maria Fernandez Urbina, the same man who restored the Angel of Independence after the 1958 earthquake. And the clock in the tower, with its art deco ironwork, used to play classical music to mark the hour.',
          observe_es: [
            'El foro tiene cinco pilares monumentales y los camerinos llevan los relieves de la tragedia y la comedia, de Roberto Montenegro.',
            'El lago tiene patos y cisnes, y la flora incluye cipreses libaneses, mimosas, palmeras y bambú.',
            'Las bancas de concreto imitan pequeñas cabanas de madera: el parque se diseño como si fuera el campo.',
          ],
          observe_en: [
            'The forum has five monumental pillars, and the dressing rooms carry the reliefs of tragedy and comedy by Roberto Montenegro.',
            'The pond has ducks and swans, and the planting includes Lebanese cedars, mimosas, palms and bamboo.',
            'The concrete benches imitate small wooden cabins: the park was designed as if it were the countryside.',
          ],
          image: 'foroLindberghDetalle',
        },
        {
          title_es: 'La pregunta que queda',
          title_en: 'The question that remains',
          body_es:
            'La pregunta no es si Roma se puso de moda: eso ya pasó y se puede medir. La pregunta es que se pagó por ello, y quien lo pagó. En otras capitales latinoamericanas la misma tensión se resolvió de otra manera: en Ipanema, con altura frente al mar; en Palermo, con calles que se especializaron y torres; en Providencia, con el suburbio; en San Isidro, con la torre y las oficinas; en Barranco y Lince, con el borde del rio y el turismo. Ninguno de esos barrios es equivalente a este, y la propia literatura académica insiste en que no existe un único modelo de gentrificación latinoamericana. Lo que si se puede decir es que en todas partes la pregunta por quien puede permanecer en el lugar aparece con la misma frase: el precio de pertenecer. Parque México se construyo para que la gente viviera cerca, no para que viniera de visita. Tres horas y media despues, esa sigue siendo la pregunta.',
          body_en:
            'The question is not whether Roma became fashionable: that already happened and it can be measured. The question is what was paid for it, and who paid. In other Latin American capitals the same tension was resolved differently: in Ipanema, with height facing the sea; in Palermo, with streets that specialized and towers; in Providencia, with the suburb; in San Isidro, with the tower and the offices; in Barranco and Lince, with the river edge and tourism. None of those neighborhoods is equivalent to this one, and the academic literature itself insists there is no single Latin American model of gentrification. What can be said is that everywhere the question of who gets to stay comes with the same phrase: the price of belonging. Parque Mexico was built for people to live near, not for people to visit. Three and a half hours later, that is still the question.',
          observe_es: [
            'Mira quien esta sentado a esta hora: es la observación más honesta que se puede hacer en un espacio público.',
            'El parque es el único de la ruta que no es propiedad de nadie y que todos usan sin pagar.',
            'En los años noventa se quiso hacer un estacionamiento subterraneo aquí: la oposición vecinal fue lo que salvalo.',
          ],
          observe_en: [
            'Look at who is sitting down at this hour: it is the most honest observation one can make in a public space.',
            'This is the only stop on the route that belongs to nobody and that everyone uses without paying.',
            'In the nineties a underground parking was proposed here: neighborhood opposition is what saved it.',
          ],
          image: 'parqueMexicoAerea',
        },
      ],
      operational_es:
        'El cierre funciona mejor si se hace desde el foro, mirando hacia el lago, no desde la entrada de Michoacán. Si el grupo es grande, conviene rodear el parque antes de sentarse.',
      operational_en:
        'The closing works better from the forum, looking toward the pond, not from the Michoacan entrance. If the group is large, it is worth walking around the park before sitting down.',
    },
  ],
  route: {
    title_es: 'La ruta',
    title_en: 'The route',
    intro_es:
      'Un recorrido lineal de 1.7 kilómetros, de La Romita a Parque México, con una comida en el camino. Se hace en unas tres horas y media sin correr.',
    intro_en:
      'A linear route of 1.7 kilometers, from La Romita to Parque Mexico, with a meal along the way. It takes about three and a half hours without rushing.',
    legs: [
      {
        zone: 'Plaza de la Romita',
        walk: 0,
        note: 'Inicio. Templo, plaza y los ahuehuetes del atrio.',
      },
      { zone: 'Plaza Río de Janeiro', walk: 4, note: 'La plaza y el edificio de las brujas.' },
      { zone: 'Av. Álvaro Obregón', walk: 5, note: 'El bulevar, la comida y la capa tecnológica.' },
      { zone: 'Av. Ámsterdam', walk: 8, note: 'El óvalo y la geometría del hipódromo.' },
      { zone: 'Parque México', walk: 6, note: 'El foro y la pregunta final.' },
    ],
  },
  discoveries: [
    {
      id: 'observado',
      kind: 'observacion',
      title: 'Lo que se observa de frente',
      title_en: 'What is observed first hand',
      body: 'La escala de la plaza de pueblo, la dimensions de las fachadas, el techo cónico de la torre, el camellón, el óvalo de la avenida, los cinco pilares del foro y las placas del parque. Es la parte del recorrido que no depende de ninguna fuente.',
      body_en:
        'The scale of the village square, the dimensions of the facades, the conical roof of the tower, the median, the oval of the avenue, the five pillars of the forum and the park plaques. It is the part of the route that depends on no source.',
    },
    {
      id: 'documentado',
      kind: 'documentado',
      title: 'Lo que documentan las fuentes',
      title_en: 'What the sources document',
      body: 'Fechas, nombres,itectura y precios: la solicitud de fraccionamiento de 1902, la nomenclatura de 1905, la apertura del hipódromo en 1910, la compra de los terrenos en 1924-25, el contrato que exigía un parque, la comparación entre venta y renta entre 2019 y 2025, y los horarios y cartas de las tres taquerías.',
      body_en:
        'Dates, names, architecture and prices: the 1902 subdivision request, the 1905 street naming, the racecourse opening in 1910, the land purchase in 1924-25, the contract that required a park, the comparison between sales and rents between 2019 and 2025, and the hours and menus of the three taquerias.',
    },
    {
      id: 'pendiente',
      kind: 'pendiente',
      title: 'Lo que falta verificar',
      title_en: 'What still needs checking',
      body: 'El estado actual del caserío de la Romita y de la Ermita, los horarios de la plaza y del templo, la oferta de arbolado y la lista de catalogación de los 250 edificios de la Condesa, y los precios de menú en su versión más reciente.',
      body_en:
        'The current state of the Romita houses and of the chapel, the opening hours of the square and the church, the tree inventory and the listing of the 250 Condesa buildings, and the menu prices in their most recent version.',
    },
  ],
  sources: [
    {
      id: 'unam-romita',
      label_es: 'UNAM - La Romita y los factores históricos de su estructura y desarrollo',
      label_en: 'UNAM - La Romita and the historical factors of its structure and development',
      url: 'https://tesiunamdocumentos.dgb.unam.mx/ptd2015/noviembre/0737663/0737663_A4.pdf',
    },
    {
      id: 'wiki-romita',
      label_es: 'Wikipedia - La Romita',
      label_en: 'Wikipedia - La Romita',
      url: 'https://es.wikipedia.org/wiki/La_Romita',
    },
    {
      id: 'wiki-roma',
      label_es: 'Wikipedia - Colonia Roma (origen de la nomenclatura)',
      label_en: 'Wikipedia - Colonia Roma (origin of the street names)',
      url: 'https://es.wikipedia.org/wiki/Colonia_Roma',
    },
    {
      id: 'wiki-plaza-rio',
      label_es: 'Wikipedia - Plaza Río de Janeiro y el edificio de las brujas',
      label_en: 'Wikipedia - Plaza Río de Janeiro and the House of the Witches',
      url: 'https://es.wikipedia.org/wiki/Plaza_R%C3%ADo_de_Janeiro',
    },
    {
      id: 'cdmx-romita',
      label_es: 'Ciudad de México - Plaza La Romita',
      label_en: 'Mexico City - Plaza La Romita',
      url: 'https://mexicocity.cdmx.gob.mx/venues/plaza-romita/',
    },
    {
      id: 'cdmx-parque',
      label_es: 'Ciudad de México - Parque México y el Foro Lindbergh',
      label_en: 'Mexico City - Parque México and the Lindbergh Forum',
      url: 'https://mexicocity.cdmx.gob.mx/venues/parque-mexico/',
    },
    {
      id: 'wiki-parque',
      label_es: 'Wikipedia - Parque México (origen y diseño)',
      label_en: 'Wikipedia - Parque México (origin and design)',
      url: 'https://es.wikipedia.org/wiki/Parque_M%C3%A9xico',
    },
    {
      id: 'cuauhtemoc-hipodromo',
      label_es: 'Alcaldía Cuauhtémoc - Colonia Hipódromo',
      label_en: 'Cuauhtémoc Borough - Colonia Hipódromo',
      url: 'https://historico.alcaldiacuauhtemoc.mx/nope/colonia-hipodromo/',
    },
    {
      id: 'barragan',
      label_es: 'Barragán Foundation - Houses in Avenida Parque México',
      label_en: 'Barragán Foundation - Houses in Avenida Parque México',
      url: 'https://www.barragan-foundation.org/works/list/houses-in-avenida-parque-mexico',
    },
    {
      id: 'forbes-rentas',
      label_es: 'Forbes México - Rentas en la Roma-Condesa (Inmuebles24, 2025)',
      label_en: 'Forbes México - Rents in Roma-Condesa (Inmuebles24, 2025)',
      url: 'https://forbes.com.mx/una-burbuja-inmobiliaria-ha-disparado-mas-de-80-las-rentas-en-la-roma-condesa-protestan-contra-la-gentrificacion/',
    },
    {
      id: 'elfinanciero-m2',
      label_es: 'El Financiero - Precios de venta por m² (Metric Analysis con SHF e INEGI)',
      label_en: 'El Financiero - Sale prices per m² (Metric Analysis with SHF and INEGI)',
      url: 'https://www.elfinanciero.com.mx/cdmx/2025/07/10/plusvalias-y-gentrificacion-revelan-realidad-inmobiliaria-en-la-cdmx/',
    },
    {
      id: 'jornada-umaña',
      label_es: 'La Jornada - Gentrificación selectiva (Lorena Margarita Umaña Reyes, UNAM)',
      label_en: 'La Jornada - Selective gentrification (Lorena Margarita Umaña Reyes, UNAM)',
      url: 'https://www.jornada.com.mx/noticia/2025/07/09/capital/gentrificacion-selectiva-cdmx-corredores-reforma-roma-y-condesa-alquiler-aumento-1755',
    },
    {
      id: 'uam-rentas',
      label_es: 'UAM Xochimilco - El precio de las rentas en Roma, Condesa y Juárez (2020-2025)',
      label_en: 'UAM Xochimilco - Rent prices in Roma, Condesa and Juárez (2020-2025)',
      url: 'https://economia.xoc.uam.mx/publicaciones-academicas/el-precio-de-las-rentas-un-analisis-sobre-el-impacto-de-la-gentrificacion-en-el-mercado-inmobiliario-de-las-colonias-roma-condesa-y-juarez-durante-el-periodo-2020-2025/',
    },
    {
      id: 'salinas',
      label_es: 'Salinas Arreortúa - Gentrificación en Buenos Aires y Ciudad de México',
      label_en: 'Salinas Arreortúa - Gentrification in Buenos Aires and Mexico City',
      url: 'https://doi.org/10.14198/geogra2013.4.44',
    },
    {
      id: 'cdmx-mapa',
      label_es: 'Turismo CDMX - Mapa Roma-Condesa',
      label_en: 'CDMX Tourism - Roma-Condesa map',
      url: 'https://turismo.cdmx.gob.mx/storage/app/media/mapas-digitales/Mapa%20Roma%20-%20Condesa-%20CDMX.pdf',
    },
    {
      id: 'taqueria-alvaro',
      label_es: 'Taquería Álvaro Obregón - Sitio oficial',
      label_en: 'Taquería Álvaro Obregón - Official site',
      url: 'https://www.taqueriaalvaroo.com/',
    },
    {
      id: 'taqueria-orinoco',
      label_es: 'Taquería Orinoco - Sitio oficial',
      label_en: 'Taquería Orinoco - Official site',
      url: 'http://www.taqueriaorinoco.com/',
    },
  ],
}

/**
 * Adaptadores al formato que consumen los componentes de journeys.
 * El contenido vive con el par `_es` / `_en` explicito; los componentes
 * esperan el par implicito (el idioma lo decide `isEs`).
 */
export function toEditorialMoment(moment) {
  return {
    id: moment.id,
    number: moment.number,
    title: moment.title_es,
    title_en: moment.title_en,
    location: moment.location_es,
    location_en: moment.location_en,
    kicker: moment.kicker_es || '',
    kicker_en: moment.kicker_en || '',
    lead: moment.lead_es,
    lead_en: moment.lead_en,
    question: moment.question_es,
    question_en: moment.question_en,
    image: moment.image,
    duration_min: moment.duration_min,
    steps: (moment.steps || []).map((step) => ({
      title: step.title_es,
      title_en: step.title_en,
      body: step.body_es,
      body_en: step.body_en,
      observe: step.observe_es,
      observe_en: step.observe_en,
    })),
    operational_note: moment.operational_es || undefined,
    operational_note_en: moment.operational_en || undefined,
  }
}

/** Momentos del journey, ya en el formato de los componentes. */
export function romaMoments() {
  return ROMA_JOURNEY.moments.map(toEditorialMoment)
}

/** Paradas de la ruta, para la galeria horizontal. */
export function romaRouteStops() {
  return ROMA_JOURNEY.route.legs.map((leg) => ({
    zone: leg.zone,
    walk: leg.walk,
    note: leg.note,
  }))
}

export default ROMA_JOURNEY
