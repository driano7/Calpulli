// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Journey editorial: Coyoacán — La casa de Frida y el pueblo dentro de la ciudad.
 *
 * Séptimo journey del catálogo. A diferencia de los seis capítulos con
 * componente dedicado, Coyoacán se renderiza con la presentación editorial
 * genérica de pages/journeys/[slug].js, así que sus Moments viven en el
 * registro de data/journeysData.js (campo `moments`) con el esquema
 * title_es/title_en, intro_es/intro_en y steps con body_es/body_en.
 *
 * Fotografías: pendientes de verificación, `image: null` a propósito,
 * igual que marca la convención del módulo de journeys.
 *
 * Nota operativa: la Casa Azul se recorre por cuenta propia; el relato
 * del guía va antes de entrar (briefing) y al salir (cierre). Boletos
 * solo en línea, con franja horaria; el museo cierra los lunes.
 */

const COYOACAN_MOMENTS = [
  {
    id: 'pueblo',
    title_es: 'El pueblo que la ciudad se tragó',
    title_en: 'The village the city swallowed',
    intro_es:
      'Coyoacán no empezó como una colonia de la Ciudad de México: empezó como un pueblo con nombre propio —"lugar de coyotes" en náhuatl— que la ciudad terminó rodeando. Los dos jardines gemelos, Centenario e Hidalgo, siguen funcionando como su sala de estar.',
    intro_en:
      'Coyoacán did not begin as a Mexico City neighbourhood: it began as a town with its own name —"place of coyotes" in Nahuatl— that the city eventually surrounded. The twin gardens, Centenario and Hidalgo, still work as its living room.',
    image: null,
    steps: [
      {
        title_es: 'Dos jardines, un pueblo',
        title_en: 'Two gardens, one town',
        body_es:
          'El Jardín Centenario y el Jardín Hidalgo están separados por una calle y unidos por la costumbre: el kiosco, los portales, las nieves, las parejas, los vendedores de globos. Aquí el recorrido baja el ritmo a propósito. Antes de ver monumentos conviene ver esto: un pueblo que se niega a volverse ciudad aunque la ciudad lo rodea por los cuatro lados.',
        body_en:
          'Jardín Centenario and Jardín Hidalgo are separated by one street and joined by habit: the bandstand, the arcades, the ice-cream carts, the couples, the balloon sellers. Here the walk deliberately slows down. Before any monument, notice this: a town that refuses to become city even though the city surrounds it on all four sides.',
        observe_es: [
          'La fuente de los coyotes, el símbolo del barrio',
          'Los portales y sus cafés, ocupados a cualquier hora',
          'El kiosco como centro social, no como decoración',
        ],
        observe_en: [
          'The coyote fountain, the emblem of the neighbourhood',
          'The arcades and their cafés, busy at any hour',
          'The bandstand as a social centre, not decoration',
        ],
        image: null,
      },
      {
        title_es: 'La sede de Cortés',
        title_en: "Cortés's headquarters",
        body_es:
          'Tras la caída de Tenochtitlan en 1521, Hernán Cortés se instaló en Coyoacán mientras se reconstruía la capital sobre las ruinas mexicas. Aquí funcionó el primer ayuntamiento de la Nueva España y aquí se tomaron decisiones que redibujaron un continente. El pueblo "periférico" fue, por unos años, el centro del poder.',
        body_en:
          "After the fall of Tenochtitlan in 1521, Hernán Cortés settled in Coyoacán while the capital was rebuilt over the Mexica ruins. The first city council of New Spain worked here, and decisions that redrew a continent were taken here. The 'peripheral' town was, for a few years, the centre of power.",
        observe_es: [
          'La escala baja y doméstica de las construcciones coloniales',
          'Los nombres de las calles: santos, héroes y oficios',
        ],
        observe_en: [
          'The low, domestic scale of the colonial buildings',
          'Street names: saints, heroes and trades',
        ],
        image: null,
      },
    ],
  },
  {
    id: 'parroquia',
    title_es: 'La parroquia y el convento',
    title_en: 'The parish church and the convent',
    intro_es:
      'La parroquia de San Juan Bautista es una de las iglesias más antiguas de México continental, levantada por franciscanos en el siglo XVI sobre el antiguo centro ceremonial de Coyoacán. El relato se cuenta en el atrio; adentro, silencio: es una iglesia viva, no una pieza de museo.',
    intro_en:
      "The parish church of San Juan Bautista is one of the oldest churches on the Mexican mainland, raised by Franciscans in the 16th century over Coyoacán's old ceremonial centre. The story is told in the atrium; inside, silence: it is a living church, not a museum piece.",
    image: null,
    steps: [
      {
        title_es: 'Piedra sobre piedra',
        title_en: 'Stone upon stone',
        body_es:
          'El templo y su antiguo convento dominicano-franciscano se construyeron con la piedra del mundo anterior, una práctica literal en todo el centro de México: el nuevo orden se edificó con los bloques del viejo. La portada plateresca y los murales del interior, restaurados en el siglo XX, cuentan esa superposición mejor que cualquier placa.',
        body_en:
          "The church and its old convent were built with stone from the world before, a literal practice across central Mexico: the new order was raised with the old world's blocks. The Plateresque façade and the murals inside, restored in the 20th century, tell that layering better than any plaque.",
        observe_es: [
          'Los bloques reutilizados en los muros exteriores',
          'La cruz del atrio, pensada para evangelizar a cielo abierto',
          'La vida parroquial de hoy: bodas, misas, vendedores en la puerta',
        ],
        observe_en: [
          'Reused blocks in the exterior walls',
          'The atrium cross, meant for open-air evangelisation',
          "Today's parish life: weddings, masses, sellers at the door",
        ],
        image: null,
      },
    ],
  },
  {
    id: 'casa-azul',
    title_es: 'La Casa Azul',
    title_en: 'The Blue House',
    intro_es:
      'En la calle de Londres 247 está la casa donde Frida Kahlo nació, vivió con Diego Rivera y murió. No es un museo montado en una casa: es una casa que se quedó detenida, con sus camas, su cocina de talavera y su jardín. La visita se hace por cuenta propia; nuestro trabajo es llegar con los boletos resueltos y saber qué buscar adentro.',
    intro_en:
      "At Londres 247 stands the house where Frida Kahlo was born, lived with Diego Rivera and died. It is not a museum installed in a house: it is a house that stopped in time, with its beds, its Talavera-tiled kitchen and its garden. The visit is self-paced; our job is to arrive with the tickets solved and to know what to look for inside.",
    image: null,
    steps: [
      {
        title_es: 'El boleto que se acaba',
        title_en: 'The ticket that sells out',
        body_es:
          'La Casa Azul vende sus boletos solo en línea y con franja horaria; en temporada alta se agotan con una o dos semanas de anticipación y el museo cierra los lunes. Por eso este journey se confirma únicamente con el boleto asegurado: es la parte que el visitante no quiere resolver solo, y es la parte que nosotros resolvemos.',
        body_en:
          'The Blue House sells its tickets online only, in timed slots; in high season they sell out one to two weeks ahead, and the museum closes on Mondays. That is why this journey is only confirmed with the ticket secured: it is the part visitors least want to solve alone, and it is the part we solve.',
        observe_es: [
          'La fila de quienes llegan sin boleto, a la vuelta de la esquina',
          'La fachada azul cobalto, inconfundible desde la calle',
        ],
        observe_en: [
          'The line of people who arrive without a ticket, around the corner',
          'The cobalt-blue façade, unmistakable from the street',
        ],
        image: null,
      },
      {
        title_es: 'Qué buscar adentro (briefing)',
        title_en: 'What to look for inside (briefing)',
        body_es:
          'Antes de entrar, el briefing: la cocina de azulejo con las ollas de barro y los nombres de Frida y Diego en la pared; el estudio unido por un puente, con la silla de ruedas frente al caballete; las camas —la de noche y la de día—; la colección de exvotos y arte popular que alimentaba su pintura; y en el jardín, la pirámide escalonada que Diego mandó construir para su colección prehispánica. Al salir, cerramos en un café: la casa se entiende mejor conversada.',
        body_en:
          "Before going in, the briefing: the tiled kitchen with its clay pots and Frida and Diego's names on the wall; the studio joined by a bridge, with the wheelchair before the easel; the beds —the night bed and the day bed—; the ex-voto and folk-art collection that fed her painting; and in the garden, the stepped pyramid Diego had built for his pre-Hispanic collection. Afterwards we close over coffee: the house is best understood in conversation.",
        observe_es: [
          'Los exvotos: Frida coleccionaba el arte que la coleccionaba a ella',
          'El espejo sobre la cama, para pintarse acostada',
          'Los últimos cuadros: las sandías de "Viva la Vida"',
        ],
        observe_en: [
          'The ex-votos: Frida collected the art that collected her',
          'The mirror above the bed, for painting lying down',
          'The last paintings: the "Viva la Vida" watermelons',
        ],
        image: null,
      },
      {
        title_es: 'A unas calles: Trotsky',
        title_en: 'A few streets away: Trotsky',
        body_es:
          'El barrio guardaba a otro exiliado famoso. León Trotsky vivió primero en la Casa Azul y luego en su casa-fortaleza de la calle Viena, donde fue asesinado en 1940. Si el tiempo y el grupo lo piden, el Museo Casa de León Trotsky queda a unas calles y completa el mapa de la Coyoacán refugio de exilios.',
        body_en:
          "The neighbourhood sheltered another famous exile. Leon Trotsky lived first at the Blue House and later in his fortress-house on Viena street, where he was murdered in 1940. If time and the group allow, the Leon Trotsky House Museum is a few streets away and completes the map of Coyoacán as a refuge for exiles.",
        observe_es: ['Las marcas del atentado en los muros de la casa de Viena'],
        observe_en: ['The bullet marks on the walls of the Viena house'],
        image: null,
      },
    ],
  },
  {
    id: 'mercado',
    title_es: 'El mercado y los sabores',
    title_en: 'The market and the flavours',
    intro_es:
      'El Mercado de Coyoacán es la cocina del pueblo: quesadillas, tostadas famosas en todo el sur de la ciudad, aguas frescas y puestos de dulces. Aquí el recorrido se come. Y de postre, los churros del jardín y el café de El Jarocho, institución coyoacanense desde 1953.',
    intro_en:
      "Coyoacán Market is the town's kitchen: quesadillas, tostadas famous across the south of the city, fresh fruit waters and sweet stalls. Here the walk is eaten. And for dessert, the churros by the garden and coffee at El Jarocho, a Coyoacán institution since 1953.",
    image: null,
    steps: [
      {
        title_es: 'Comer como vecino',
        title_en: 'Eating like a neighbour',
        body_es:
          'La regla del mercado es mirar dónde comen los de aquí. Las tostadas de pata, tinga y mariscos mueven filas enteras; las quesadillas abren el debate eterno de la ciudad —en la capital, la quesadilla puede ir sin queso— y las aguas de horchata y jamaica cierran el trato. Comer en el mercado no es una pausa del recorrido: es el recorrido.',
        body_en:
          "The market's rule is to watch where the locals eat. The tostadas —pata, tinga, seafood— draw whole lines; the quesadillas open the city's eternal debate —in the capital, a quesadilla may come without cheese— and the horchata and hibiscus waters seal the deal. Eating at the market is not a break from the walk: it is the walk.",
        observe_es: [
          'Los puestos con más fila de vecinos, no de turistas',
          'Los precios escritos a mano: aquí se come con poco',
          'La sección de dulces típicos y piñatas',
        ],
        observe_en: [
          'The stalls with lines of neighbours, not tourists',
          'Handwritten prices: here you eat well for little',
          'The traditional sweets and piñata section',
        ],
        image: null,
      },
      {
        title_es: 'Churros y café de olla',
        title_en: 'Churros and café de olla',
        body_es:
          'El cierre dulce es en el jardín: churros recién hechos con chocolate y una banca para ver pasar el pueblo. Si el grupo es de café, El Jarocho sirve desde 1953 a estudiantes, escritores y vecinos en la misma esquina. Coyoacán se despide como se presentó: sentado en su sala de estar.',
        body_en:
          "The sweet close is in the garden: fresh churros with chocolate and a bench to watch the town go by. If the group runs on coffee, El Jarocho has served students, writers and neighbours on the same corner since 1953. Coyoacán says goodbye as it introduced itself: sitting in its living room.",
        observe_es: ['El ritual de la banca: nadie tiene prisa en Coyoacán'],
        observe_en: ["The bench ritual: nobody is in a hurry in Coyoacán"],
        image: null,
      },
    ],
  },
  {
    id: 'calles',
    title_es: 'Calles de escritores',
    title_en: 'Streets of writers',
    intro_es:
      'Coyoacán fue refugio de escritores, pintores y exiliados, y sus calles empedradas guardan las casas. La calle Francisco Sosa, con sus casonas y su puente, es de las más hermosas de la ciudad; el Callejón del Aguacate guarda la leyenda que todo vecino conoce y ningún historiador confirma.',
    intro_en:
      "Coyoacán was a refuge for writers, painters and exiles, and its cobbled streets keep their houses. Francisco Sosa street, with its old homes and its bridge, is among the city's most beautiful; the Callejón del Aguacate keeps the legend every neighbour knows and no historian confirms.",
    image: null,
    steps: [
      {
        title_es: 'La "casa de Cortés" que no es de Cortés',
        title_en: 'The "house of Cortés" that is not Cortés\'s',
        body_es:
          'Sobre el Jardín Centenario se levanta un edificio que la tradición popular llama desde hace siglos la Casa de Hernán Cortés. El problema: se construyó en el siglo XVIII, doscientos años después. El mito vale oro porque enseña cómo funciona la memoria de un pueblo: a veces importa menos quién vivió en la casa que el hecho de que el barrio decidió recordarla así.',
        body_en:
          "Overlooking Jardín Centenario stands a building popular tradition has called the House of Hernán Cortés for centuries. The problem: it was built in the 18th century, two hundred years too late. The myth is gold because it shows how a town's memory works: sometimes who lived in the house matters less than the fact that the neighbourhood chose to remember it that way.",
        observe_es: [
          'El escudo y la placa que alimentan el mito',
          'La diferencia entre la fecha del edificio y la fecha de la leyenda',
        ],
        observe_en: [
          'The coat of arms and plaque that feed the myth',
          'The gap between the building\'s date and the legend\'s date',
        ],
        image: null,
      },
      {
        title_es: 'Cierre: el pueblo dentro de la ciudad',
        title_en: 'Close: the village inside the city',
        body_es:
          'El recorrido termina donde empezó, en los jardines, con la idea completa: la Ciudad de México no es una ciudad, es un archipiélago de pueblos que la mancha urbana fue uniendo. Coyoacán es el más famoso de esos pueblos, pero la misma lectura sirve para el Centro, para Jamaica, para todo el mapa de Calpulli: cada barrio —cada calpulli— guarda su propio centro del mundo.',
        body_en:
          'The walk ends where it began, in the gardens, with the whole idea: Mexico City is not one city, it is an archipelago of towns that the urban sprawl stitched together. Coyoacán is the most famous of those towns, but the same reading works for the Centro, for Jamaica, for the whole Calpulli map: every neighbourhood —every calpulli— keeps its own centre of the world.',
        observe_es: ['La distancia entre Coyoacán y el Zócalo: otra ciudad, la misma ciudad'],
        observe_en: ['The distance between Coyoacán and the Zócalo: another city, the same city'],
        image: null,
      },
    ],
  },
]

export const COYOACAN_JOURNEY = {
  id: 'coyoacan',
  slug: 'coyoacan',
  experience: 'coyoacan',
  title_es: 'Coyoacán — La casa de Frida y el pueblo dentro de la ciudad',
  title_en: "Coyoacán — Frida's House and the Village Inside the City",
  subtitle_es:
    'El pueblo que la ciudad rodeó sin tragárselo: la Casa Azul de Frida Kahlo, su parroquia del siglo XVI, su mercado y sus calles de escritores.',
  subtitle_en:
    "The village the city surrounded without swallowing: Frida Kahlo's Blue House, its 16th-century parish, its market and its writers' streets.",
  intro_es:
    'Coyoacán se recorre como un pueblo, no como una colonia: dos jardines que son una sala de estar, una parroquia de quinientos años, la casa más famosa de México con su boleto resuelto de antemano, un mercado que se come caminando y las calles donde se refugiaron escritores y exiliados. Cuatro horas para entender que la Ciudad de México es un archipiélago de pueblos.',
  intro_en:
    "Coyoacán is walked like a village, not a neighbourhood: two gardens that work as a living room, a five-hundred-year-old parish, Mexico's most famous house with its ticket solved in advance, a market you eat as you walk, and the streets where writers and exiles took refuge. Four hours to understand that Mexico City is an archipelago of towns.",
  eyebrow_es: 'Coyoacán · Sur de la ciudad',
  eyebrow_en: 'Coyoacán · South of the city',
  duration_note_es:
    'Recorrido de unas cuatro horas como estimación. La salida se confirma solo con el boleto de la Casa Azul asegurado; el museo cierra los lunes.',
  duration_note_en:
    'A walk of about four hours as an estimate. The departure is only confirmed with the Blue House ticket secured; the museum closes on Mondays.',
  accents: ['terracota', 'talavera'],
  // Precio de lanzamiento, en pesos, con el boleto de la Casa Azul incluido.
  price: 849,
  heroImage: null,
  // Calificacion: null mientras el journey no tenga reseñas.
  rating: null,
  reviewCount: 0,
  moments: COYOACAN_MOMENTS,
}
