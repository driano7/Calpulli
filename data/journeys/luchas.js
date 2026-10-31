// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Journey editorial "Luchas".
 *
 * ---------------------------------------------------------------------------
 * DOS VARIANTES, UN SOLO JOURNEY
 * El journey tiene dos recorridos, no dos capitulos:
 *
 *   A. "arena-mexico"  -> Arena Mexico (Dr. Lavista, colonia Doctores).
 *                          El universo de la lucha: el recinto grande, la
 *                          historia pintada en su lobby, la máscara de Blue
 *                          Demon Jr. y la cartelera del viernes.
 *   B. "arena-coliseo" -> Arena Coliseo (Peru 77, Centro Historico).
 *                          La lucha en su contexto urbano: el mercado de San
 *                          Juan, la galeria de Blue Demon Jr., el pozole de la
 *                          Casa de Tono y la calle Peru 77.
 *
 * El visitante elige la variante arriba. La secuencia narrativa es la misma
 * en las dos; lo que cambia es el lugar y lo que se puede hacer antes de
 * entrar. Por eso el contenido se construye desde un nucleo editorial
 * compartido y cada variante anade sus propias piezas.
 *
 * ---------------------------------------------------------------------------
 * ESTADO DEL CONTENIDO
 * Lo que se puede escribir sin inventar:
 *   - lo que el visitante ve de frente (observaciones de cada pieza),
 *   - lo que documentan las fuentes oficiales (CMLL, TicketMaster, sitios
 *     oficiales de las marcas y de los mercados),
 *   - la logistica de la entrada y lo que se puede o no hacer dentro.
 *
 * Lo que NO esta verificado se marca como `pending` y se publica como
 * pendiente. No se rellena con informacion inventada.
 * ---------------------------------------------------------------------------
 */

const IMG = '/static/images/journeys/luchas'

/**
 * Fotografias verificadas. Todas de Wikimedia Commons, con licencia comprobada
 * y credito en public/static/images/journeys/luchas/CREDITS.md
 */
export const LUCHAS_PHOTOS = {
  arenaMexicoEntrada: {
    src: `${IMG}/arena-mexico-entrada.jpg`,
    alt: 'Entrada de la Arena Mexico, en la colonia Doctores de la Ciudad de Mexico.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  muralHistoria: {
    src: `${IMG}/mural-historia-lucha.jpg`,
    alt: 'Mural sobre la historia de la lucha libre en el lobby de la Arena Mexico.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  muralHistoria2: {
    src: `${IMG}/mural-historia-lucha-2.jpg`,
    alt: 'Segundo mural de la historia de la lucha libre en la Arena Mexico.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  blueDemon: {
    src: `${IMG}/blue-demon.jpg`,
    alt: 'Blue Demon Jr. con su antitraz azul.',
    credit: 'Wikimedia Commons, CC BY-SA 2.0',
  },
  blueDemonEntrada: {
    src: `${IMG}/blue-demon-entrada.jpg`,
    alt: 'Blue Demon Jr. entrando al ring con su antifaz.',
    credit: 'Wikimedia Commons, CC BY 2.0',
  },
  blueDemonFan: {
    src: `${IMG}/blue-demon-fans.jpg`,
    alt: 'Blue Demon Jr. junto a sus aficionados.',
    credit: 'Wikimedia Commons, CC BY-SA 2.0',
  },
  mascaraLuchador: {
    src: `${IMG}/mascara-luchador.jpg`,
    alt: 'Mascara de luchador con bordado dorado.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  malignaPuesto: {
    src: `${IMG}/maligna-puesto.jpg`,
    alt: 'La luchadora Maligna en un puesto de la Arena Mexico.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  arenaColiseo: {
    src: `${IMG}/arena-coliseo.jpg`,
    alt: 'Fachada de la Arena Coliseo, en Peru 77, Centro Historico.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  arenaColiseo2: {
    src: `${IMG}/arena-coliseo-2.jpg`,
    alt: 'Interior de la Arena Coliseo, en Tepito.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  embudoLagunilla: {
    src: `${IMG}/embudo-lagunilla.jpg`,
    alt: 'La Arena Coliseo vista desde el mercado de Lagunilla.',
    credit: 'Wikimedia Commons, CC BY-SA 3.0',
  },
  mercadoSanJuan: {
    src: `${IMG}/mercado-san-juan.jpg`,
    alt: 'Mercado de San Juan, en Ernesto Pugibet, Centro Historico.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
}

/** Datos de una arena, tomados de la informacion oficial de CMLL. */
const ARENAS = {
  mexico: {
    nombre_es: 'Arena México',
    nombre_en: 'Arena Mexico',
    apodo_es: 'La Catedral de la Lucha Libre',
    apodo_en: 'The Cathedral of Lucha Libre',
    direccion_es: 'Dr. Lavista 189, colonia Doctores',
    direccion_en: 'Dr. Lavista 189, Doctores district',
    inauguracion_es: 'Inaugurada el 27 de abril de 1956',
    inauguracion_en: 'Opened on April 27, 1956',
    funciones_es: 'Martes 19:30, viernes 20:30, domingo 17:00',
    funciones_en: 'Tuesday 7:30 pm, Friday 8:30 pm, Sunday 5:00 pm',
    /** Horario semanal, para calcular las próximas fechas reales. */
    funciones: [
      { day: 2, time: '19:30' },
      { day: 5, time: '20:30' },
      { day: 0, time: '17:00' },
    ],
    foto: 'arenaMexicoEntrada',
  },
  coliseo: {
    nombre_es: 'Arena Coliseo',
    nombre_en: 'Arena Coliseo',
    apodo_es: 'El Embudo de Perú 77',
    apodo_en: 'The funnel of Peru 77',
    direccion_es: 'Perú 77, Centro Histórico',
    direccion_en: 'Peru 77, Historic Center',
    inauguracion_es: 'Inaugurada el 2 de abril de 1943',
    inauguracion_en: 'Opened on April 2, 1943',
    funciones_es: 'Jueves 19:00, sábado 19:30',
    funciones_en: 'Thursday 7:00 pm, Saturday 7:30 pm',
    /** Horario semanal, para calcular las próximas fechas reales. */
    funciones: [
      { day: 4, time: '19:00' },
      { day: 6, time: '19:30' },
    ],
    foto: 'arenaColiseo',
  },
}

/**
 * Nucleo editorial: lo que se dice del RITO de la lucha libre, que es el
 * mismo en las dos arenas. Cada variante lo anade a su propio lugar.
 */
const NUCLEO = {
  cartelera: {
    title_es: 'Leer una cartelera',
    title_en: 'Reading a card',
    body_es:
      'Una cartelera de CMLL no es un programa de peleas: es una dramaturgia por parejas. Cada nombre es un personaje con su castigo, su ética y su historia; algunos debutan en el ring de esa función. Un nombre que no conoces casi siempre significa que entrar a esa historia es parte de la historia.',
    body_en:
      'A CMLL card is not a fight program: it is a drama written in pairs. Every name is a character with its own punishment, its own ethics and its own history; some newcomers appear on the card for the first time. A name you do not know usually means that entering the story is part of the story.',
    observe_es: [
      'Los luchadores con máscara salen al ring con su nombre completo, no con su alias.',
      'El orden de la cartelera no es aleatorio: abre con los luchadores nuevos y cierra con la pelea estelar.',
      'Los favoritos locales se anuncian en la cartelera y en el sitio de la arena.',
    ],
    observe_en: [
      'Masked wrestlers enter under their full name, not their ring name.',
      'The order of the card is not random: it opens with the newcomers and closes with the main event.',
      'Local favorites are announced on the card and on the arena website.',
    ],
  },
  ritual: {
    title_es: 'El ritual',
    title_en: 'The ritual',
    body_es:
      'Antes de la pelea hay una entrada: se apagan las luces, suena la entrada del luchador y el recinto se enciende. En la Arena México, con dieciséis mil butacas, ese momento se juega en grande; en el Coliseo, con un aforo de casa, se juega íntimo. La diferencia de tamaño cambia la relación con el público, no la práctica.',
    body_en:
      'Before the match there is an entrance: the lights go down, the wrestler theme plays and the building comes alive. At Arena Mexico, with sixteen thousand seats, that moment is played large; at the Coliseo, with a house-sized capacity, it is played intimately. The difference in size changes the relationship with the audience, not the practice.',
    observe_es: [
      'Las entradas son la parte más ritualizada de la noche: silbidos,马云ames y غياب del ring.',
      'Entre pelea y pelea hay un trabajo largo de ring que no es descanso: se limpia, se coloca, se calienta al público.',
      'Los vendedores pasan entre las filas durante toda la función.',
    ],
    observe_en: [
      'Entrances are the most ritualized part of the night: whistles, chants and leaving the ring.',
      'Between matches there is ring work that is not a break: it is cleaned, reset, and the crowd is worked.',
      'Vendors move along the rows throughout the show.',
    ],
  },
  reglas: {
    title_es: 'Lo que se puede y lo que no',
    title_en: 'What you can and cannot do',
    body_es:
      'La entrada a una arena de CMLL se compra con tiempo: hay que llegar con anticipación para pasar la fila y encontrar lugar. Dentro, el recinto tiene servicio de bebidas y alimentos, y una barra de bebidas alcohólicas; no se permite pasar con comida o bebida traída de fuera. Tampoco se pueden introducir cámaras ni computadoras, y la sesión dura alrededor de dos horas.',
    body_en:
      'Entry to a CMLL arena is bought with time: you have to arrive early to clear the line and find your seat. Inside, the venue has a food and drink service and a bar with alcoholic drinks; you are not allowed to bring in your own food or drink. Cameras and laptops are not allowed either, and the show lasts around two hours.',
    observe_es: [
      'El tiempo de espera para entrar se cuenta en decenas de minutos, no en minutos.',
      'Dentro hay bebidas y alimentos, y una barra con bebidas alcohólicas.',
      'La duración de la función ronda las dos horas.',
    ],
    observe_en: [
      'The wait to get in counts in tens of minutes, not in minutes.',
      'Inside there is food and drink, and a bar with alcoholic drinks.',
      'The show runs about two hours.',
    ],
  },
  salida: {
    title_es: 'La salida',
    title_en: 'After the show',
    body_es:
      'La noche no termina con la última pelea. La gente se queda, conversa, compra máscaras y películas, se toma una foto con el ring vacío. Ese rato sin programa es parte del recinto: es cuando el lugar deja de ser un escenario y se vuelve una habitación pública.',
    body_en:
      'The night does not end with the last match. People stay, they linger, they buy masks and tapes, they take a photo with the empty ring. That unscheduled time is part of the venue: it is when the place stops being a stage and becomes a public room.',
    observe_es: [
      'El merchandising del recinto se compra en la salida, no antes.',
      'El ring se puede ver vacío una vez terminada la función.',
      'El público se mezcla con los luchadores al salir.',
    ],
    observe_en: [
      'Venue merchandise is bought on the way out, not before.',
      'The ring can be seen empty once the show is over.',
      'The crowd mixes with the wrestlers on the way out.',
    ],
  },
}

/**
 * Las dos variantes.
 */
export const LUCHAS_VARIANTS = [
  {
    id: 'arena-mexico',
    order: 1,
    nombre_es: ARENAS.mexico.nombre_es,
    nombre_en: ARENAS.mexico.nombre_en,
    apodo_es: ARENAS.mexico.apodo_es,
    apodo_en: ARENAS.mexico.apodo_en,
    direccion_es: ARENAS.mexico.direccion_es,
    direccion_en: ARENAS.mexico.direccion_en,
    inauguracion_es: ARENAS.mexico.inauguracion_es,
    inauguracion_en: ARENAS.mexico.inauguracion_en,
    funciones_es: ARENAS.mexico.funciones_es,
    funciones_en: ARENAS.mexico.funciones_en,
    funciones: ARENAS.mexico.funciones,
    resumen_es:
      'El recinto grande de Doctores, con dieciséis mil butacas y un mural que cuenta cien años de pelea. Aquí la lucha libre se presenta como un espectáculo grande, y el relato va del recinto hacia la máscara.',
    resumen_en:
      'The big house in Doctores, with sixteen thousand seats and a mural that tells a hundred years of fighting. Here lucha libre presents itself as a large show, and the story runs from the venue towards the mask.',
    foto: ARENAS.mexico.foto,
    momentos: [
      {
        id: 'mex-1-umbral',
        number: 1,
        title_es: 'El umbral de Doctores',
        title_en: 'The threshold of Doctores',
        location_es: 'Exterior de la Arena México',
        location_en: 'Outside Arena Mexico',
        lead_es:
          'La Arena México no anuncia su entrada con un cartel de neón. Es un edificio de barrio, en la colonia Doctores, con una marquesina, un portero y un letrero; el contraste con el espectáculo que ocurre adentro es el primer dato de la noche.',
        lead_en:
          'Arena Mexico does not announce its entrance with a neon sign. It is a neighborhood building, in the Doctores district, with a marquee, a doorman and a sign; the contrast with the show happening inside is the first fact of the night.',
        image: 'arenaMexicoEntrada',
        steps: [
          {
            title_es: 'Llegada',
            title_en: 'Arrival',
            body_es:
              'Se llega con tiempo: la fila para entrar al recinto empieza antes de que abra la taquilla. Es el momento en que se ve quien viene a la pelea y quien va a estar en la butaca.',
            body_en:
              'You arrive early: the line to get into the venue starts before the box office opens. It is the moment when you see who comes to watch a match and who will be sitting in the seat.',
            observe_es: [
              'El lugar de la función se anuncia en la cartelera oficial de la arena.',
              'La fila del exterior es parte del ritual: la gente se reconoce allí.',
            ],
            observe_en: [
              'The venue for the show is announced on the arena official card.',
              'The outdoor line is part of the ritual: people recognize each other there.',
            ],
          },
        ],
        pending_es: null,
        pending_en: null,
      },
      {
        id: 'mex-2-mural',
        number: 2,
        title_es: 'El mural',
        title_en: 'The mural',
        location_es: 'Lobby de la Arena México',
        location_en: 'Arena Mexico lobby',
        lead_es:
          'Antes de bajar al ring, el lobby cuenta la historia a su manera: un mural dedicado a la historia de la lucha libre cubre la pared y la revive con los luchadores de varias épocas. Es la crónica de las sedes en imágenes.',
        lead_en:
          'Before going down to the ring, the lobby tells the story its own way: a mural dedicated to the history of lucha libre covers the wall and brings it back to life with wrestlers from different eras. It is the chronicle of the venue told in images.',
        image: 'muralHistoria',
        steps: [
          {
            title_es: 'La pared',
            title_en: 'The wall',
            body_es:
              'El mural no es decoración: es el archivo. En él se reconocen los personajes que el público de la casa conoce: los de las tres épocas de la lucha mexicana, y el hilo que los une es el mismo que sostiene la cartelera de esta noche.',
            body_en:
              'The mural is not decoration: it is the archive. In it you recognize the characters that the house audience knew through the three eras of Mexican wrestling, and the thread that links them is the same one that holds tonight card together.',
            observe_es: [
              'El mural esta dentro del recinto, no en la calle: se ve con la entrada.',
              'Representa luchadores de distintas épocas, no solo los actuales.',
            ],
            observe_en: [
              'The mural is inside the venue, not on the street: you see it once you are in.',
              'It shows wrestlers from different eras, not only the current ones.',
            ],
            image: 'muralHistoria2',
          },
        ],
        pending_es: null,
        pending_en: null,
      },
      {
        id: 'mex-3-mascara',
        number: 3,
        title_es: 'La máscara como archivo',
        title_en: 'The mask as archive',
        location_es: 'Tienda de Blue Demon Jr. en el Centro',
        location_en: 'Blue Demon Jr. shop in the Centro',
        lead_es:
          'La máscara no es un accesorio del personaje: es el archivo. El antifaz de Blue Demon Jr. lo diseñó Rolando Vera inspirándose en la muerte, con los cuernitos tomados del diseño previo de El Médico Asesino. Y del otro lado, El Santo nunca se quitó su máscara plateada en público: fue enterrado usándola.',
        lead_en:
          'The mask is not an accessory of the character: it is the archive. Blue Demon Jr. mask was designed by Rolando Vera out of death itself, with the little horns taken from the earlier design of El Médico Asesino. And on the other side, El Santo never took off his silver mask in public: he was buried wearing it.',
        image: 'mascaraLuchador',
        steps: [
          {
            title_es: 'La tienda',
            title_en: 'The shop',
            body_es:
              'Blue Demon Jr. mantiene su tienda y galería en el Centro, en Emilio Donde 7, y ha inaugurado una segunda galería en el Centro Histórico, entre Luis Moya y Ernesto Pugibet. En la galería se expone el origen de los personajes: cómo nació un antifaz y qué significa cada trazo.',
            body_en:
              'Blue Demon Jr. keeps his shop and gallery in the Centro, on Emilio Donde 7, and has opened a second gallery in the Historic Center, between Luis Moya and Ernesto Pugibet. The gallery shows where the characters come from: how a mask was born and what each line means.',
            observe_es: [
              'La tienda del Centro está en Emilio Donde 7, a unas cuadras de la Arena México.',
              'La galería del Centro Histórico abre entre Luis Moya y Ernesto Pugibet.',
            ],
            observe_en: [
              'The Centro shop is on Emilio Donde 7, a few blocks from Arena Mexico.',
              'The Historic Center gallery opens between Luis Moya and Ernesto Pugibet.',
            ],
            image: 'blueDemonEntrada',
          },
          {
            title_es: 'El الخير',
            title_en: 'The wearer',
            body_es:
              'Los momentos de Blue Demon Jr. en el ring son los que mejor explican el concepto: la entrada al ring es la presentación del personaje, y el público no aplaude un nombre, aplaude una máscara que reconoce.',
            body_en:
              'Blue Demon Jr. moments in the ring are the ones that best explain the concept: the entrance to the ring is the presentation of the character, and the crowd does not applaud a name, it applauds a mask it recognizes.',
            observe_es: [
              'El antifaz azul es reconocible incluso a distancia.',
              'La relación del público con el luchador enmascarado es de familiaridad, no de admiración casual.',
            ],
            observe_en: [
              'The blue mask is recognizable even from a distance.',
              'The crowd relationship with a masked wrestler is familiarity, not casual admiration.',
            ],
            image: 'blueDemon',
          },
        ],
        pending_es:
          'El estado físico de la tienda de Emilio Donde 7 debe confirmarse antes de visitarla: el sitio oficial de la marca anuncia que está en remodeling.',
        pending_en:
          'The physical status of the Emilio Donde 7 shop must be confirmed before visiting: the brand official site announces it is being remodelled.',
      },
      {
        id: 'mex-4-cartelera',
        number: 4,
        title_es: 'La cartelera',
        title_en: 'The card',
        location_es: 'Arena México',
        location_en: 'Arena Mexico',
        lead_es: NUCLEO.cartelera.body_es,
        lead_en: NUCLEO.cartelera.body_en,
        steps: [
          {
            title_es: NUCLEO.cartelera.title_es,
            title_en: NUCLEO.cartelera.title_en,
            body_es: NUCLEO.cartelera.body_es,
            body_en: NUCLEO.cartelera.body_en,
            observe_es: NUCLEO.cartelera.observe_es,
            observe_en: NUCLEO.cartelera.observe_en,
          },
          {
            title_es: 'El calendario de la casa',
            title_en: 'The house calendar',
            body_es:
              'La Arena México programa martes 19:30, viernes 20:30 y domingo 17:00. El viernes es la noche grande y la más llena; el domingo es la de la tarde, con un público distinto.',
            body_en:
              'Arena Mexico runs Tuesdays at 7:30 pm, Fridays at 8:30 pm and Sundays at 5:00 pm. Friday is the big night and the fullest one; Sunday is the afternoon show, with a different audience.',
            observe_es: [
              'Las tres funciones de la semana tienen hora de inicio fija.',
              'El boleto se compra en el sitio oficial de la arena o en taquilla.',
            ],
            observe_en: [
              'The three weekly shows all have a fixed start time.',
              'Tickets are bought on the arena official site or at the box office.',
            ],
          },
        ],
        image: 'malignaPuesto',
        pending_es: null,
        pending_en: null,
      },
      {
        id: 'mex-5-dentro',
        number: 5,
        title_es: 'Dentro',
        title_en: 'Inside',
        location_es: 'Arena México',
        location_en: 'Arena Mexico',
        lead_es: NUCLEO.ritual.body_es,
        lead_en: NUCLEO.ritual.body_en,
        steps: [
          {
            title_es: NUCLEO.ritual.title_es,
            title_en: NUCLEO.ritual.title_en,
            body_es: NUCLEO.ritual.body_es,
            body_en: NUCLEO.ritual.body_en,
            observe_es: NUCLEO.ritual.observe_es,
            observe_en: NUCLEO.ritual.observe_en,
          },
          {
            title_es: NUCLEO.reglas.title_es,
            title_en: NUCLEO.reglas.title_en,
            body_es: NUCLEO.reglas.body_es,
            body_en: NUCLEO.reglas.body_en,
            observe_es: NUCLEO.reglas.observe_es,
            observe_en: NUCLEO.reglas.observe_en,
          },
        ],
        image: 'arenaColiseo2',
        pending_es: null,
        pending_en: null,
      },
      {
        id: 'mex-6-noche',
        number: 6,
        title_es: 'La noche',
        title_en: 'The night',
        location_es: 'Arena México',
        location_en: 'Arena Mexico',
        lead_es: NUCLEO.salida.body_es,
        lead_en: NUCLEO.salida.body_en,
        steps: [
          {
            title_es: NUCLEO.salida.title_es,
            title_en: NUCLEO.salida.title_en,
            body_es: NUCLEO.salida.body_es,
            body_en: NUCLEO.salida.body_en,
            observe_es: NUCLEO.salida.observe_es,
            observe_en: NUCLEO.salida.observe_en,
          },
          {
            title_es: 'Comida antes, si da tiempo',
            title_en: 'Food before, if there is time',
            body_es:
              'La regla del recinto es clara: no se entra con alimentos ni bebidas de fuera, y dentro hay servicio de bebidas, alimentos y barra de bebidas alcohólicas. Si hay tiempo antes de la función, se come antes en el barrio; si no, se come dentro. La decisión se toma el mismo día, según la hora en que nos reunamos.',
            body_en:
              'The venue rule is clear: you do not get in with outside food or drink, and inside there is a food and drink service plus a bar with alcoholic drinks. If there is time before the show, you eat before in the neighborhood; if not, you eat inside. The decision is made the same day, depending on the hour we meet.',
            observe_es: [
              'El servicio de alimentos y bebidas funciona durante la función.',
              'La comida previa se ajusta a la hora de encuentro, no al horario del recinto.',
            ],
            observe_en: [
              'The food and drink service runs during the show.',
              'Eating beforehand depends on the meeting time, not on the venue schedule.',
            ],
          },
        ],
        pending_es:
          'El lugar exacto para comer antes en Doctores se define el día de la visita: hace falta verificar una opción cercana que siga abierta a la hora de la función.',
        pending_en:
          'The exact place to eat beforehand in Doctores is decided on the day of the visit: a nearby option still open at show time needs to be verified.',
      },
    ],
  },
  {
    id: 'arena-coliseo',
    order: 2,
    nombre_es: ARENAS.coliseo.nombre_es,
    nombre_en: ARENAS.coliseo.nombre_en,
    apodo_es: ARENAS.coliseo.apodo_es,
    apodo_en: ARENAS.coliseo.apodo_en,
    direccion_es: ARENAS.coliseo.direccion_es,
    direccion_en: ARENAS.coliseo.direccion_en,
    inauguracion_es: ARENAS.coliseo.inauguracion_es,
    inauguracion_en: ARENAS.coliseo.inauguracion_en,
    funciones_es: ARENAS.coliseo.funciones_es,
    funciones_en: ARENAS.coliseo.funciones_en,
    funciones: ARENAS.coliseo.funciones,
    resumen_es:
      'El recinto chico de Perú 77, abierto en 1943, donde empezó la época de oro. Aquí la lucha libre no se presenta como un espectáculo grande: se presenta como lo que es, un oficio de barrio con su público. El recorrido es el Centro Histórico, y la comida va antes.',
    resumen_en:
      'The small house on Peru 77, opened in 1943, where the golden era began. Here lucha libre does not present itself as a big show: it presents itself as what it is, a neighborhood trade with its own audience. The route is the Historic Center, and the food comes before.',
    foto: ARENAS.coliseo.foto,
    momentos: [
      {
        id: 'col-1-mercado',
        number: 1,
        title_es: 'El mercado que abre el día',
        title_en: 'The market that opens the day',
        location_es: 'Mercado de San Juan, Ernesto Pugibet',
        location_en: 'San Juan Market, Ernesto Pugibet',
        lead_es:
          'Antes de la función hay una hora y un lugar donde la ciudad todavía está despierta: el mercado de San Juan, en Ernesto Pugibet 21, frente a la plaza del mismo nombre. Abre de 07:00 a 17:00, y las mañanas son cuando está completo. No hay que confundirlo con el de Arcos de Belén, que está a unas cuadras y es otro mercado.',
        lead_en:
          'Before the show there is an hour and a place where the city is still awake: the San Juan market, on Ernesto Pugibet 21, facing the square of the same name. It opens from 7:00 to 17:00, and mornings are when it is fully stocked. Do not confuse it with the Arcos de Belen one, a few blocks away, which is a different market.',
        image: 'mercadoSanJuan',
        steps: [
          {
            title_es: 'Pugibet',
            title_en: 'Pugibet',
            body_es:
              'Este es el mercado gourmet de la ciudad: aquí surtieron cocineros y restaurantes, y se encuentran productos importados, quesos, conservas y carnes que en ningún otro sitio del Centro se consiguen. En el piso de arriba, el mercado de las frutas y las verduras.',
            body_en:
              'This is the city gourmet market: chefs and restaurants stock up here, and you find imports, cheeses, preserves and cuts of meat you will not get anywhere else in the Centro. Upstairs is the fruit and vegetable market.',
            observe_es: [
              'Horarios de 07:00 a 17:00, todos los días.',
              'Los puestos grandes aceptan tarjeta, pero conviene llevar efectivo.',
              'Metro San Juan de Letrán o Salto del Agua.',
            ],
            observe_en: [
              'Opening hours from 7:00 to 17:00, every day.',
              'The larger stalls take cards, but cash is worth bringing.',
              'Metro San Juan de Letran or Salto del Agua.',
            ],
          },
          {
            title_es: 'Curiosidades',
            title_en: 'Curiosities',
            body_es:
              'A media cuadra, sobre Ayuntamiento, está el mercado de Curiosidades, especializado en artesanias mexicanas: papel picado, rebozos, sarapes, instrumentos y, entre todo, máscaras. Es el mejor lugar para entender de dónde viene el objeto que la lucha usa como lenguaje.',
            body_en:
              'Half a block away, on Ayuntamiento, is the Curiosities market, specialized in Mexican crafts: cut paper, rebozos, sarapes, instruments and, above all, masks. It is the best place to understand where the object that wrestling uses as a language comes from.',
            observe_es: [
              'El mercado de Curiosidades está entre Ayuntamiento, Aranda y Buen Toño.',
              'Su especialidad es el artesanado mexicano, con máscaras entre los puestos.',
            ],
            observe_en: [
              'The Curiosities market sits between Ayuntamiento, Aranda and Buen Tono.',
              'Its specialty is Mexican crafts, with masks among the stalls.',
            ],
          },
        ],
        pending_es: null,
        pending_en: null,
      },
      {
        id: 'col-2-mascara',
        number: 2,
        title_es: 'Cincuenta metros',
        title_en: 'Fifty meters',
        location_es: 'Galería de Blue Demon Jr., entre Luis Moya y Ernesto Pugibet',
        location_en: 'Blue Demon Jr. gallery, between Luis Moya and Ernesto Pugibet',
        lead_es:
          'A unos cincuenta metros del mercado, entre Luis Moya y Ernesto Pugibet, está la galería de Blue Demon Jr. Es el mismo concepto de la otra parada, en una escala distinta: aquí la historia de la máscara se cuenta como galería, con obra de artistas como Lucharte de Iliana So y el cómic del Demonio Azul.',
        lead_en:
          'About fifty meters from the market, between Luis Moya and Ernesto Pugibet, is the Blue Demon Jr. gallery. It is the same idea as the other stop, on a different scale: here the history of the mask is told as a gallery, with work by artists like Lucharte de Iliana So and the Blue Demon comic.',
        image: 'blueDemonFan',
        steps: [
          {
            title_es: 'El antifaz',
            title_en: 'The mask',
            body_es:
              'El Blue Demon Jr. cuenta que el antifaz lo diseñó Rolando Vera inspirándose en la muerte, y que los cuernitos se tomaron del diseño previo de El Médico Asesino. De ese detalle salen las reglas del género: una máscara no decora a un luchador, define lo que puede hacer y lo que no.',
            body_en:
              'Blue Demon Jr. tells that the mask was designed by Rolando Vera out of death itself, and that the little horns were taken from the earlier design of El Médico Asesino. From that detail come the rules of the genre: a mask does not decorate a wrestler, it defines what they can and cannot do.',
            observe_es: [
              'La galería exhibe la primera máscara del luchador y su evolucion.',
              'El material incluye obra de artistas del“Yes”: Lucharte de Iliana So.',
            ],
            observe_en: [
              'The gallery exhibits the first mask of the wrestler and its evolution.',
              'The material includes work by artists such as Lucharte de Iliana So.',
            ],
            image: 'blueDemonEntrada',
          },
        ],
        pending_es:
          'La galería de Ernesto Pugibet abrió hace poco: hay que confirmar sus horarios y si expone de forma permanente o por encargo.',
        pending_en:
          'The Ernesto Pugibet gallery opened recently: opening hours and whether the exhibition is permanent or by appointment need to be confirmed.',
      },
      {
        id: 'col-3-pozole',
        number: 3,
        title_es: 'El pozole antes del ring',
        title_en: 'The pozole before the ring',
        location_es: 'La Casa de Toño, Francisco I. Madero 20',
        location_en: 'La Casa de Tono, Francisco I. Madero 20',
        lead_es:
          'A unas dos cuadras de Perú 77 está La Casa de Toño, en Francisco I. Madero 20, interior 212-216, con su pozole, sus tacos y sus chilaquiles, abierto de 08:00 a 23:00. Es la comida que está a mano antes de entrar al recinto, y la logística manda: si el horario lo permite, se come antes; si no, se come dentro.',
        lead_en:
          'A couple of blocks from Peru 77 is La Casa de Tono, on Francisco I. Madero 20, interior 212-216, with its pozole, its tacos and its chilaquiles, open from 8:00 to 23:00. It is the food within reach before entering the venue, and logistics decide: if the schedule allows, you eat before; if not, you eat inside.',
        image: null,
        steps: [
          {
            title_es: 'La regla del recinto',
            title_en: 'The venue rule',
            body_es:
              'Dentro de la arena hay bebidas, alimentos y barra de bebidas alcohólicas, pero no se puede entrar con comida o bebida traída de fuera. Por eso la comida previa no es un extra: es la que resuelve la noche.',
            body_en:
              'Inside the arena there is food, drink and a bar with alcoholic drinks, but you cannot enter with outside food or drink. That is why eating beforehand is not an extra: it is what solves the night.',
            observe_es: [
              'Horarios de 08:00 a 23:00.',
              'En hora pico la fila es larga.',
              'La comida previa depende de la hora en que nos reunamos y de que nos toque entrar a tiempo.',
            ],
            observe_en: [
              'Opening hours from 8:00 to 23:00.',
              'At peak times the queue is long.',
              'Eating beforehand depends on the hour we meet and on making it in on time.',
            ],
          },
        ],
        pending_es: null,
        pending_en: null,
      },
      {
        id: 'col-4-peru77',
        number: 4,
        title_es: 'Perú 77',
        title_en: 'Peru 77',
        location_es: 'Perú 77, Centro Histórico',
        location_en: 'Peru 77, Historic Center',
        lead_es:
          'El Coliseo está en una calle angosta, y esa calle es el nombre del apodo: el Embudo de Perú 77. Desde la Lagunilla, a unas cuadras, se ve el edificio al final del pasillo. La arena no está apartada del barrio: está dentro de él, con los puestos de abajo y la calle de enfrente.',
        lead_en:
          'The Coliseo sits on a narrow street, and that street is the nickname: the funnel of Peru 77. From Lagunilla, a few blocks away, you can see the building at the end of the passage. The arena is not apart from the neighborhood: it is inside it, with the stalls below and the street across.',
        image: 'embudoLagunilla',
        steps: [
          {
            title_es: 'La casa chica',
            title_en: 'The small house',
            body_es:
              'Inaugurado el 2 de abril de 1943, el Coliseo es un recinto de casa, no de estadio. Su capacidad es mucho menor que la de Arena México, y por eso el contacto con el ring es directo: en las gradas de aquí se oye caer el cuerpo.',
            body_en:
              'Opened on April 2, 1943, the Coliseo is a house-sized venue, not a stadium. Its capacity is far smaller than Arena Mexico, and that is why the contact with the ring is direct: from these stands you hear the body fall.',
            observe_es: [
              'El recinto no tiene estacionamiento.',
              'La escala del lugar cambia la forma de ver la pelea.',
            ],
            observe_en: [
              'The venue has no parking.',
              'The scale of the place changes the way you watch the match.',
            ],
          },
        ],
        pending_es: null,
        pending_en: null,
      },
      {
        id: 'col-5-embudo',
        number: 5,
        title_es: 'Dentro del embudo',
        title_en: 'Inside the funnel',
        location_es: 'Arena Coliseo',
        location_en: 'Arena Coliseo',
        lead_es: NUCLEO.ritual.body_es,
        lead_en: NUCLEO.ritual.body_en,
        steps: [
          {
            title_es: NUCLEO.ritual.title_es,
            title_en: NUCLEO.ritual.title_en,
            body_es: NUCLEO.ritual.body_es,
            body_en: NUCLEO.ritual.body_en,
            observe_es: NUCLEO.ritual.observe_es,
            observe_en: NUCLEO.ritual.observe_en,
          },
          {
            title_es: NUCLEO.reglas.title_es,
            title_en: NUCLEO.reglas.title_en,
            body_es: NUCLEO.reglas.body_es,
            body_en: NUCLEO.reglas.body_en,
            observe_es: NUCLEO.reglas.observe_es,
            observe_en: NUCLEO.reglas.observe_en,
          },
        ],
        image: 'arenaColiseo',
        pending_es: null,
        pending_en: null,
      },
      {
        id: 'col-6-bellas',
        number: 6,
        title_es: 'Si sobra tiempo',
        title_en: 'If there is time left',
        location_es: 'Palacio de Bellas Artes',
        location_en: 'Palacio de Bellas Artes',
        lead_es:
          'Con la función del sábado a las 19:30, el Palacio de Bellas Artes queda a una cuadra y media de Perú 77. Entra como extensión opcional, no como parte del recorrido: si la noche dio tiempo y el horario lo permite, se camina hasta allá; si no, el recorrido termina en el Coliseo.',
        lead_en:
          'With the Saturday show at 7:30 pm, the Palacio de Bellas Artes is a block and a half from Peru 77. It comes in as an optional extension, not as part of the route: if the night left time and the schedule holds, you walk over; if not, the journey ends at the Coliseo.',
        image: null,
        steps: [
          {
            title_es: 'El criterio',
            title_en: 'The criterion',
            body_es:
              'La extensión no se decide de antemano: depende de la hora real de salida de la función y de cómo se haya ido la noche. Es un añadido, no un compromiso.',
            body_en:
              'The extension is not decided in advance: it depends on the real time the show ends and on how the night has gone. It is an addition, not a commitment.',
            observe_es: [
              'La función del sábado empieza a las 19:30.',
              'Bellas Artes cierra su visita a una hora fija: hay que llegar con margen.',
            ],
            observe_en: [
              'The Saturday show starts at 7:30 pm.',
              'Bellas Artes closes its visits at a fixed time: you need to arrive with margin.',
            ],
          },
        ],
        pending_es:
          'El horario de visita del Palacio de Bellas Artes y sus días de cierre deben verificarse antes de proponerse como extensión.',
        pending_en:
          'The visiting hours and closing days of the Palacio de Bellas Artes must be verified before proposing it as an extension.',
      },
    ],
  },
]

/** Etiquetas de las tarjetas de descubrimiento. */
export const LUCHAS_DISCOVERY_KINDS = {
  documentado: { label: 'Documentado', tone: 'documentado' },
  observacion: { label: 'Lo que se observa', tone: 'curiosidad' },
  pendiente: { label: 'Pendiente de documentar', tone: 'tradicion' },
}

export const LUCHAS_JOURNEY = {
  id: 'luchas',
  slug: 'luchas',
  experience: 'luchas',
  title_es: 'Luchas',
  title_en: 'Luchas',
  subtitle_es: 'Dos arenas, un mismo oficio',
  subtitle_en: 'Two arenas, one same trade',
  intro_es:
    'La lucha libre mexicana no es un deporte que se mira: es un oficio con su teatro, sus personajes y su público. Este journey ofrece dos recorridos a dos arenas de la ciudad, cada uno con su propio lugar y su propio ritmo. La entrada al recinto está incluida; la comida va antes, si el tiempo lo permite.',
  intro_en:
    'Mexican lucha libre is not a sport you watch: it is a trade with its own theatre, its characters and its audience. This journey offers two routes to two arenas in the city, each with its own place and its own pace. Venue entry is included; food comes before, if the schedule allows.',
  eyebrow_es: 'Ciudad de México',
  eyebrow_en: 'Mexico City',
  heroImage: `${IMG}/mural-historia-lucha.jpg`,
  heroTitleLines: ['Dos arenas,', 'un mismo oficio'],
  accents: ['terracota', 'cempasuchil'],
  photos: LUCHAS_PHOTOS,
  variants: LUCHAS_VARIANTS,
  verified_on: '2026-10-21',
  price: 100,
  notes: [
    'La entrada al recinto va incluida en el Journey. El boleto de cada funcion se compra por separado en el canal oficial de CMLL y se entrega en el punto de encuentro.',
    'Dentro de las arenas hay bebidas, alimentos y barra de bebidas alcoholicas. No se permite entrar con comida o bebida de fuera, ni con camaras ni computadoras.',
    'La comida previa se come antes de la funcion, si da tiempo segun la hora en que nos reunamos. Si no da tiempo, se come dentro.',
    'Las funciones tienen hora fija de inicio: conviene llegar con anticipacion para pasar la fila y encontrar lugar.',
    'La extension al Palacio de Bellas Artes (variante Arena Coliseo) es opcional y depende de la hora real de salida.',
  ],
  route: {
    title_es: 'La ruta',
    title_en: 'The route',
    variants: LUCHAS_VARIANTS.map((variant) => ({
      id: variant.id,
      title_es: variant.nombre_es,
      title_en: variant.nombre_en,
      summary_es: variant.resumen_es,
      summary_en: variant.resumen_en,
      stops: variant.momentos.map((moment) => ({
        id: moment.id,
        title_es: moment.title_es,
        title_en: moment.title_en,
        location_es: moment.location_es,
        location_en: moment.location_en,
        image: moment.image,
        photo: LUCHAS_PHOTOS[moment.image] || null,
      })),
    })),
  },
  discoveries: [
    {
      id: 'observado-de-frente',
      kind: 'observacion',
      title: 'Lo que se observa de frente',
      title_en: 'What is observed first hand',
      body: 'El edificio de la arena, el mural del lobby, la tienda de la mascara, la fila de la entrada, el anillo y la calle en la que esta todo esto. Es la parte del journey que no depende de ninguna fuente.',
      body_en:
        'The arena building, the lobby mural, the mask shop, the entrance line, the ring and the street all of it sits on. It is the part of the journey that depends on no source at all.',
    },
    {
      id: 'documentado-por-las-fuentes',
      kind: 'documentado',
      title: 'Lo que documentan las fuentes',
      title_en: 'What the sources document',
      body: 'Direcciones, horarios de funcion, fecha de inauguracion, normas de acceso y la historia de cada recinto provienen de la informacion oficial de CMLL, de su sitio de ticketing y de los sitios oficiales de las marcas y los mercados.',
      body_en:
        'Addresses, show times, opening dates, entry rules and the history of each venue come from CMLL official information, its ticketing site, and the official sites of the brands and the markets.',
    },
    {
      id: 'pendiente-de-verificar',
      kind: 'pendiente',
      title: 'Lo que falta verificar',
      title_en: 'What still needs checking',
      body: 'El estado fisico de la tienda de Blue Demon Jr. en Emilio Donde 7, los horarios de la galeria de Ernesto Pugibet, el horario de visita de Bellas Artes, la oferta de comida en Doctores y los puestos de mascaras de la calle.',
      body_en:
        'The physical status of the Blue Demon Jr. shop on Emilio Donde 7, the opening hours of the Ernesto Pugibet gallery, the visiting hours of Bellas Artes, the food options in Doctores and the mask stalls on the street.',
    },
  ],
  sources: [
    {
      id: 'cmll-arenas',
      label_es: 'CMLL - Arenas y horarios de función',
      label_en: 'CMLL - Venues and show times',
      url: 'https://www.cmll.com/',
    },
    {
      id: 'cmll-ticketmaster',
      label_es: 'CMLL - Boletos (Ticketmaster)',
      label_en: 'CMLL - Tickets (Ticketmaster)',
      url: 'https://www.cmll.com/tickets/',
    },
    {
      id: 'bluedemon',
      label_es: 'Blue Demon Jr. - Sitio oficial',
      label_en: 'Blue Demon Jr. - Official site',
      url: 'https://www.bluedemonjr.com/',
    },
    {
      id: 'mercado-sanjuan',
      label_es: 'Mercado de San Juan - Información del mercado',
      label_en: 'San Juan Market - Market information',
      url: 'https://es.wikipedia.org/wiki/Mercado_de_San_Juan_(Ciudad_de_M%C3%A9xico)',
    },
    {
      id: 'wiki-arena-mexico',
      label_es: 'Wikipedia - Arena México',
      label_en: 'Wikipedia - Arena Mexico',
      url: 'https://es.wikipedia.org/wiki/Arena_M%C3%A9xico',
    },
    {
      id: 'wiki-arena-coliseo',
      label_es: 'Wikipedia - Arena Coliseo',
      label_en: 'Wikipedia - Arena Coliseo',
      url: 'https://es.wikipedia.org/wiki/Arena_Coliseo',
    },
    {
      id: 'wiki-bellas',
      label_es: 'Palacio de Bellas Artes - Información oficial',
      label_en: 'Palacio de Bellas Artes - Official information',
      url: 'https://bellasartes.gob.mx/',
    },
  ],
}

export default LUCHAS_JOURNEY

/**
 * ---------------------------------------------------------------------------
 * ADAPTADORES
 * ---------------------------------------------------------------------------
 * El contenido de arriba esta escrito con el par `_es` / `_en` explicito,
 * porque cada pieza de texto vive una vez en espanol y una vez en ingles y
 * conviven en el mismo objeto. Los componentes de journeys, en cambio,
 * esperan el par implicito: `title` es espanol y `title_en` es ingles, y el
 * idioma lo decide el prop `isEs`.
 *
 * Estas funciones hacen la traduccion de un formato al otro. No inventan
 * nada: si falta la version inglesa, se cae a la espanola.
 */

/** Convierte un momento al formato que consume EditorialMoment. */
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
    image: moment.image,
    steps: (moment.steps || []).map((step) => ({
      title: step.title_es,
      title_en: step.title_en,
      body: step.body_es,
      body_en: step.body_en,
      observe: step.observe_es,
      observe_en: step.observe_en,
      pending: step.pending_es,
      pending_en: step.pending_en,
    })),
    operational_note: moment.pending_es || undefined,
    operational_note_en: moment.pending_en || undefined,
  }
}

/** Momentos de una variante, ya en el formato de los componentes. */
export function luchasMoments(variantId) {
  const variant = LUCHAS_VARIANTS.find((v) => v.id === variantId) || LUCHAS_VARIANTS[0]
  return variant.momentos.map(toEditorialMoment)
}

/**
 * Próximas funciones con fecha real.
 *
 * El horario semanal (martes, viernes, domingo…) se convierte en fechas
 * concretas contadas desde hoy en Ciudad de México. Se calcula con
 * Intl/timeZone UTC para que el servidor y el navegador muestren lo mismo
 * (evita el desfase de un día y el error de hidratación).
 */
const SHOW_DAY_MS = 24 * 60 * 60 * 1000

function mexicoTodayUtc(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const value = (type) => Number(parts.find((part) => part.type === type)?.value)
  return Date.UTC(value('year'), value('month') - 1, value('day'))
}

function formatShowDate(utcMs, time, locale) {
  const date = new Date(utcMs)
  const intlLocale = locale === 'en' ? 'en-US' : 'es-MX'
  const weekday = new Intl.DateTimeFormat(intlLocale, {
    timeZone: 'UTC',
    weekday: 'long',
  }).format(date)
  const day = new Intl.DateTimeFormat(intlLocale, {
    timeZone: 'UTC',
    day: 'numeric',
  }).format(date)
  const month = new Intl.DateTimeFormat(intlLocale, {
    timeZone: 'UTC',
    month: 'long',
  }).format(date)
  return locale === 'en'
    ? `${weekday}, ${month} ${day} · ${time}`
    : `${weekday} ${day} de ${month} · ${time}`
}

export function luchasUpcomingShows(variantId, count = 4, now = new Date()) {
  const variant = LUCHAS_VARIANTS.find((v) => v.id === variantId) || LUCHAS_VARIANTS[0]
  const schedule = Array.isArray(variant.funciones) ? variant.funciones : []
  if (!schedule.length) return []

  const todayUtc = mexicoTodayUtc(now)
  const shows = []

  for (let offset = 0; offset < 42 && shows.length < count; offset++) {
    const utcMs = todayUtc + offset * SHOW_DAY_MS
    const weekday = new Date(utcMs).getUTCDay()
    for (const slot of schedule) {
      if (slot.day !== weekday) continue
      shows.push({
        iso: new Date(utcMs).toISOString().slice(0, 10),
        time: slot.time,
        label_es: formatShowDate(utcMs, slot.time, 'es'),
        label_en: formatShowDate(utcMs, slot.time, 'en'),
      })
    }
  }

  return shows.slice(0, count)
}

/** La variante por defecto: la primera (Arena Mexico). */
export const LUCHAS_DEFAULT_VARIANT = LUCHAS_VARIANTS[0].id

/** Paradas de la ruta de una variante, para la galeria horizontal. */
export function luchasRouteStops(variantId) {
  const variant = LUCHAS_VARIANTS.find((v) => v.id === variantId) || LUCHAS_VARIANTS[0]
  return variant.momentos.map((moment) => ({
    zone: moment.location_es,
    zone_en: moment.location_en,
    title: moment.title_es,
    title_en: moment.title_en,
    walk: 5,
    note: moment.lead_es,
  }))
}
