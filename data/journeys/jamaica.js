// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Journey editorial "Jamaica: mirar más allá de las flores".
 *
 * ---------------------------------------------------------------------------
 * SEIS MOMENTOS
 *   M01  Entrar en un mundo de flores
 *   M02  Detrás de cada flor hay un oficio
 *   M03  Un mercado con memoria
 *   M04  Las flores también hablan
 *   M05  La vida que ocurre alrededor
 *   M06  Un ramo para recordar   (cierre participativo, ver JamaicaBouquet)
 *
 * ---------------------------------------------------------------------------
 * REGLAS DE ESTE CONTENIDO
 *   - No se inventan testimonios, nombres ni escenas de comerciantes. Las
 *     fotografías son de archivo, de Wikimedia Commons, y se presentan como
 *     lo que son: imágenes del mercado, no imágenes de nuestra visita.
 *   - No se atribuye un significado universal a ninguna especie, color o
 *     arreglo. El significado depende de cada persona.
 *   - El taller de M06 es una PROPUESTA pendiente de coordinación con el
 *     florista. No se publica como disponible, reservable ni confirmado.
 *   - La reflexión de M06 no se guarda ni se envía: vive en el navegador.
 * ---------------------------------------------------------------------------
 */

const IMG = '/static/images/journeys/jamaica'

/**
 * Fotografías verificadas. Todas de Wikimedia Commons, con licencia comprobada
 * y credito en public/static/images/journeys/jamaica/CREDITS.md
 *
 * Las tres primeras son imágenes del Archivo Fotográfico (Library of
 * Congress): el mercado en construcción en 1957 y una ceremonia de
 * abanderamiento en 1962. Muestran el mismo techo de paraguas de concreto.
 */
export const JAMAICA_PHOTOS = {
  puestoFlores: {
    src: `${IMG}/puesto.jpg`,
    alt: 'Muro de ramos de flores cortadas, envueltos en plástico, en un puesto del Mercado de Jamaica.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  girasoles: {
    src: `${IMG}/girasoles.jpg`,
    alt: 'Girasoles a la venta en el Mercado de Jamaica.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  oficiante: {
    src: `${IMG}/mercado-2.jpg`,
    alt: 'Un comerciante sentado entre cajas de verdura con una balanza en el pasillo del mercado.',
    credit: 'Wikimedia Commons, CC BY-SA 2.0',
  },
  esferasPaja: {
    src: `${IMG}/mercado-1.jpg`,
    alt: 'Esferas de paja trenzada colgadas en un puesto del mercado.',
    credit: 'Wikimedia Commons, CC BY-SA 2.0',
  },
  construccion1957: {
    src: `${IMG}/archivo-1957-a.jpg`,
    alt: 'El Mercado de Jamaica en construcción, en 1957, con la estructura de paraguas de concreto ya levantada.',
    credit: 'Wikimedia Commons, CC0 (Archivo Fotográfico)',
  },
  archivo1957: {
    src: `${IMG}/archivo-1957-b.jpg`,
    alt: 'El Mercado de Jamaica recién inaugurado, en 1957, con los puestos cerrados y la calle frente a las naves.',
    credit: 'Wikimedia Commons, CC0 (Archivo Fotográfico)',
  },
  abanderamiento1962: {
    src: `${IMG}/archivo-1962.jpg`,
    alt: 'Ceremonia de abanderamiento de mercados en Jamaica, en 1962, con un grupo escolar bajo el techo de las naves.',
    credit: 'Wikimedia Commons, CC0 (Archivo Fotográfico)',
  },
  cempasuchil: {
    src: `${IMG}/mercado-3.jpg`,
    alt: 'Dos mujeres con canastas de cempasúchil en un pasillo del mercado, entre una multitud.',
    credit: 'Wikimedia Commons, CC BY-SA 2.0',
  },
  dulceria: {
    src: `${IMG}/dulceria.jpg`,
    alt: 'Dulcería mexicana en un puesto del Mercado de Jamaica.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
  dulceriaPanoramica: {
    src: `${IMG}/dulceria-panoramica.jpg`,
    alt: 'Vista panoramica de la dulceria mexicana dentro del Mercado de Jamaica.',
    credit: 'Wikimedia Commons, CC BY-SA 4.0',
  },
}

export const JAMAICA_JOURNEY = {
  id: 'jamaica',
  slug: 'jamaica',
  experience: 'jamaica',
  title_es: 'Jamaica',
  title_en: 'Jamaica',
  subtitle_es: 'Mirar más allá de las flores',
  subtitle_en: 'Looking beyond the flowers',
  intro_es:
    'Todo el mundo entra a Jamaica por las flores. Casi nadie se queda por el resto. Este Journey recorre el mercado como se recorre un lugar: primero mirando, después preguntando, y al final con las manos ocupadas, porque aquí se aprende haciendo.',
  intro_en:
    'Everyone enters Jamaica for the flowers. Almost nobody stays for the rest. This route walks the market the way you walk a place: first looking, then asking, and at the end with your hands busy, because here you learn by doing.',
  eyebrow_es: 'Ciudad de México',
  eyebrow_en: 'Mexico City',
  heroImage: `${IMG}/puesto.jpg`,
  heroTitleLines: ['Jamaica:', 'mirar más allá de las flores'],
  accents: ['talavera', 'cempasuchil'],
  photos: JAMAICA_PHOTOS,
  verified_on: '2026-10-21',
  price: 649,
  notes: [
    'El mercado está en Guillermo Prieto 45, colonia Jamaica, alcaldía Venustiano Carranza, en el cruce de la Calzada de la Viga con Morelos. La estación del Metro Jamaica de la línea 9 queda debajo del mercado; la de la línea 4 es elevada y lleva el mismo nombre.',
    'Este recorrido no es una visita guiada con horario. Es una forma de mirar: qué observar, qué preguntar y con qué cuidado.',
    'Las fotografías son de archivo, de Wikimedia Commons, y muestran el mercado en distintas épocas. No son imágenes de una visita de Calpulli CDMX.',
    'El taller de ramo del último momento es una propuesta. Está pendiente de acordarse con el florista: no se puede reservar ni está confirmado.',
    'Pedir permiso antes de retratar a alguien no es una formalidad. Quien trabaja aquí no es parte del decorado.',
  ],
  moments: [
    {
      id: 'jamaica-1-mundo',
      number: 1,
      title_es: 'Entrar en un mundo de flores',
      title_en: 'Entering a world of flowers',
      location_es: 'Mercado de Jamaica',
      location_en: 'Mercado de Jamaica',
      kicker_es: 'Antes de la foto, la mirada',
      kicker_en: 'Before the photo, the look',
      question_es: '¿Qué viniste a buscar?',
      question_en: 'What did you come looking for?',
      lead_es:
        'Un mercado donde las flores son mercancía, oficio, lenguaje y parte de la vida cotidiana de la ciudad.',
      lead_en:
        'A market where flowers are merchandise, craft, language and part of the daily life of the city.',
      image: 'puestoFlores',
      steps: [
        {
          title_es: 'La primera imprimiría es la que no importa',
          title_en: 'The first impression is the one that does not matter',
          body_es:
            'Entrar por la nave de flores es entrar por el ruido, el color y la humedad. Todo ocurre al mismo tiempo: alguien graba el precio, alguien empuja una carretilla, alguien riega el piso para que las flores no se marchiten. La primera impresión es la más fuerte y la menos informativa. Quédate un poco más: el mercado se ordena cuando dejas de mirar el conjunto.',
          body_en:
            'Entering through the flower nave means entering through noise, color and humidity. Everything happens at once: someone calls out a price, someone pushes a cart, someone wets the floor so the flowers will not wilt. The first impression is the strongest and the least informative. Stay a little longer: the market organizes itself once you stop looking at the whole thing.',
          observe_es: [
            'Las flores no se venden sueltas: se venden en ramo, en manojo, con el tallo cortado en diagonal.',
            'Cada puesto tiene su manera de presentar: el color agrupado, el precio en cartel, la del manojo.',
            'El piso se riega. Es trabajo, no limpieza decorativa: una flor mojada dura más.',
          ],
          observe_en: [
            'Flowers are not sold loose: they are sold in bunches, with the stem cut on the diagonal.',
            'Every stall has its own way of presenting: color grouped together, price on a sign, the presence of the bunch.',
            'The floor is wet. It is work, not decorative cleaning: a wet flower lasts longer.',
          ],
          image: 'girasoles',
        },
      ],
      operational_es:
        'El mercado abre las 24 horas, los 365 días. A las cinco de la mañana llegan los camiones; a media tarde el pasillo se llena de gente. Los dos horarios muestran oficios distintos.',
      operational_en:
        'The market is open 24 hours, 365 days. Trucks arrive around five in the morning; in the afternoon the aisle fills with people. Both hours show different crafts.',
    },
    {
      id: 'jamaica-2-oficio',
      number: 2,
      title_es: 'Detrás de cada flor hay un oficio',
      title_en: 'Behind every flower there is a craft',
      location_es: 'Nave mayorista de flores',
      location_en: 'Wholesale flower nave',
      kicker_es: 'Selección, manejo, conservación, composición',
      kicker_en: 'Selection, handling, conservation, composition',
      question_es: '¿Cuánto trabajo hay antes de que una flor sea un regalo?',
      question_en: 'How much work is there before a flower becomes a gift?',
      lead_es:
        'Un ramo no es un objeto que se compra: es un trabajo que se hace. Alguien eligió, alguien cortó, alguien hidrató, alguien compuso. El mercado funciona porque hay gente que sabe de flores, y ese saber se transmite en la familia, de un puesto a otro, durante décadas.',
      lead_en:
        'A bouquet is not an object you buy: it is work that gets done. Someone selected, someone cut, someone hydrated, someone composed. The market works because there are people who know flowers, and that knowledge travels inside families, from stall to stall, for decades.',
      image: 'oficiante',
      steps: [
        {
          title_es: 'Las cuatro manos',
          title_en: 'The four hands',
          body_es:
            'El recorrido de un ramo tiene cuatro momentos. Primero la selección: qué se compra, de qué calidad y por qué hoy. Después el manejo: el corte en diagonal, el agua limpia, la eliminación de las hojas que se tocan el agua. Luego la conservación: los productores del mercado están integrados en siete asociaciones, y de ahí viene la de lo que llega cada madrugada. Y al final la composición: el color, la forma, la altura, el papel. Nadie entrega un ramo igual a otro, ni con la misma flor.',
          body_en:
            'A bouquet has four stages. First selection: what is bought, at what quality and why today. Then handling: the diagonal cut, clean water, removing the leaves that would sit in the water. Then conservation: the market producers are organized in seven associations, and that is where the strength of what arrives every dawn comes from. And finally composition: color, shape, height, paper. Nobody hands over the same bouquet twice, not even with the same flower.',
          observe_es: [
            'El tallo cortado en diagonal no es un detalle: es lo que hace que la flor siga tomando agua.',
            'Las hojas bajas se quitan porque ensucian el agua del jarro.',
            'La diferencia entre un manojo de calidad básica y uno premium es de horas de trabajo, no de especie.',
          ],
          observe_en: [
            'The diagonal cut is not a detail: it is what lets the flower keep drinking.',
            'Low leaves are removed because they dirty the water in the jar.',
            'The difference between a basic bunch and a premium one is hours of work, not species.',
          ],
          image: 'esferasPaja',
        },
      ],
      operational_es:
        'La nave mayorista trabaja con pedido y volumen. Para ver el oficio completo conviene buscar a alguien que componga un arreglo, no solo a quien vende el manojo.',
      operational_en:
        'The wholesale nave works with orders and volume. To see the full craft, look for someone composing an arrangement, not just someone selling the bunch.',
    },
    {
      id: 'jamaica-3-memoria',
      number: 3,
      title_es: 'Un mercado con memoria',
      title_en: 'A market with memory',
      location_es: 'El recinto y su entorno',
      location_en: 'The building and its surroundings',
      kicker_es: '1957, y lo que había antes',
      kicker_en: '1957, and what came before',
      question_es: '¿Qué se está sobreescribiendo cuando se construye un mercado?',
      question_en: 'What gets overwritten when a market is built?',
      lead_es:
        'El Mercado de Jamaica se inauguró el 23 de septiembre de 1957, en el marco de un plan que modernizó los mercados del lado este de la ciudad, junto con el de Sonora y el de La Merced. Fue obra de Félix Candela y Pedro Ramírez Vázquez, y su decisión más visible son los paraguas de concreto: una cubierta que resuelve la caída del agua de lluvia letting a la luz entrar de lado. Pero el edificio no se levanta en un lugar vacío: se levanta sobre un paisaje comercial que llevaba siglos funcionando en la orilla de un canal.',
      lead_en:
        'The Mercado de Jamaica opened on September 23, 1957, as part of a plan that modernized the markets on the east side of the city, together with Sonora and La Merced. It was designed by Felix Candela and Pedro Ramirez Vazquez, and their most visible decision are the concrete parasols: a roof that solves rainwater runoff while letting light in from the side. But the building did not rise on empty ground: it rose over a commercial landscape that had been working for centuries on the bank of a canal.',
      image: 'construccion1957',
      steps: [
        {
          title_es: 'Antes del edificio',
          title_en: 'Before the building',
          body_es:
            'La zona estuvo en el borde oriental de México-Tenochtitlan, frente al lago de Xochimilco, con chinampas y un tráfico de canoas que surtían hacia el mercado de Tlatelolco. En el siglo XIX la actividad se concentró en el Canal de la Viga: en 1895 el desembarcadero de Jamaica era uno de los once mercados de la ciudad, donde se vendían flores y legumbres que venían de Xochimilco, y donde había que registrar y pagar para meter productos a la capital. En la década de 1920 el espacio se desbordó con puestos de madera y lámina. Son capas distintas —el canal, el tianguis, el mercado construido— y no son la misma historia: lo que se inaugurated en 1957 fue un edificio, no una continuidad.',
          body_en:
            'The area sat on the eastern edge of Mexico-Tenochtitlan, facing Xochimilco lake, with chinampas and a traffic of canoes heading to the Tlatelolco market. In the nineteenth century the activity concentrated along the Canal de la Viga: in 1895 the Jamaica dock was one of eleven markets in the city, where flowers and legumes from Xochimilco were sold, and where products had to be registered and paid for to enter the capital. In the 1920s the space overflowed with wooden and tin stalls. These are different layers — the canal, the open-air market, the built market — and they are not one continuous story: what opened in 1957 was a building, not a continuity.',
          observe_es: [
            'Las fotografías de archivo muestran el techo de paraguas de concreto con la misma forma que tiene hoy.',
            'La terminal del Metro Jamaica de la línea 9 queda bajo las naves; la de la línea 4, elevada, lleva el mismo nombre y es otra estación.',
            'El edificio se construyó sobre terreno rellenado: el canal y sus están debajo.',
          ],
          observe_en: [
            'The archive photographs show the concrete parasol roof with the same shape it has today.',
            'The line 9 Metro terminal sits under the naves; the line 4 one, elevated, has the same name and is a different station.',
            'The building was built on filled land: the canal and its trade are underneath.',
          ],
          image: 'abanderamiento1962',
        },
        {
          title_es: 'El año del temblor',
          title_en: 'The year of the earthquake',
          body_es:
            'El 19 de septiembre de 1985 una de las naves no resistió el movimiento telúrico. Los comerciantes pasaron la noche en el recinto y, según el libro Jamaica Vive, unidos por un mismo pensamiento: "Mi mercado no lo dejo, es mi casa, es mi vida". Después vinieron las manifestaciones, los plantones en el Zócalo y la reubicación de algunos puestos en la Central de Abasto. El mercado reabrió. Desde entonces, cada 23 de septiembre se celebra el aniversario con actividades y con una costumbre que los locatarios no cambian: dar obsequios a sus clientes frecuentes, bolsas de mandado, cestos, utensilios de cocina, algún recuerdo del aniversario.',
          body_en:
            'On September 19, 1985, one of the naves did not withstand the earthquake. The merchants spent the night inside the building and, according to the book Jamaica Vive, united by the same thought: "I am not leaving my market, it is my home, it is my life". Then came the demonstrations, the sit-ins in the Zocalo and the relocation of some stalls to the Central de Abasto. The market reopened. Since then, every September 23 the anniversary is celebrated with activities and with a custom the stallholders do not change: giving gifts to their regular customers, shopping bags, baskets, kitchen utensils, some anniversary memento.',
          observe_es: [
            'El 23 de septiembre se cumple el aniversario: el mercado se viste con motivo.',
            'El edificio se reconstruyó después de 1985 y su estructura ya no es la original en su totalidad.',
            'Los obsequios del aniversario son objetos de uso, no adornos: son para llevar a casa.',
          ],
          observe_en: [
            'Every September 23 the anniversary comes around and the market dresses up for it.',
            'The building was rebuilt after 1985 and its structure is no longer entirely the original one.',
            'The anniversary gifts are useful objects, not decoration: they are meant to be taken home.',
          ],
          image: 'archivo1957',
        },
      ],
      operational_es:
        'El Mercado de Sonora y el de La Merced quedan a unas cuadras, hacia el norte. Los tres se inauguraron el mismo día de 1957 y comparten la misma lógica de nave.',
      operational_en:
        'The Sonora and La Merced markets are a few blocks north. All three opened on the same day in 1957 and share the same nave logic.',
    },
    {
      id: 'jamaica-4-lenguaje',
      number: 4,
      title_es: 'Las flores también hablan',
      title_en: 'Flowers speak too',
      location_es: 'Nave de flores',
      location_en: 'Flower nave',
      kicker_es: 'El significado lo pone quien regala',
      kicker_en: 'The giver sets the meaning',
      question_es: '¿Qué dice un ramo?',
      question_en: 'What does a bouquet say?',
      lead_es:
        'Es fácil quedarse con las frases hechas: el cempasúchil para los muertos, las rosas para el amor, el girasol para la alegría. Son útiles para una tarjeta, pero no explican nada. El significado de un ramo no está en la flor: está en la relación entre la persona que lo pide, la persona a quien va dirigido y lo que pasó entre las dos. La misma especie significa cosas distintas en dos casas diferentes.',
      lead_en:
        'It is easy to hold on to the ready-made phrases: marigold for the dead, roses for love, sunflower for joy. They are useful for a card, but they explain nothing. The meaning of a bouquet is not in the flower: it is in the relationship between the person who asks for it, the person it is for, and what happened between the two. The same species means different things in two different homes.',
      image: 'cempasuchil',
      steps: [
        {
          title_es: 'Cempasúchil',
          title_en: 'Marigold',
          body_es:
            'El cempasúchil es la flor que más se ve en el mercado y la que más se explica mal. Se usa en el altar de muertos, sí, y es cierto que su color se asocia al duelo en muchas familias. Pero también se vende para coronas de sfail, para centros de mesa y para ramo de casa. Que se le associe con la muerte no dice nada de lo que va a significar en tu ramo: eso lo decide la persona que lo entrega y la historia que tiene con quien lo recibe.',
          body_en:
            'Marigold is the flower you see most in the market and the one that is most badly explained. It is used on the Day of the Dead altar, yes, and its color is associated with mourning in many families. But it is also sold for funeral wreaths, for table centers and for a bouquet at home. The fact that it is associated with death says nothing about what it is going to mean in your bouquet: that is decided by the person who delivers it and by the story they have with whoever receives it.',
          observe_es: [
            'El cempasúchil se vende en canasto y en manojo, con el tallo largo y el precio por pieza.',
            'En temporada alta el color se va: la demanda cambia la mezcla del puesto.',
            'Nadie en el mercado va a decidir por ti qué dice un ramo: el consejo es del florista, no de una tabla.',
          ],
          observe_en: [
            'Marigold is sold in baskets and in bunches, with a long stem and a price per piece.',
            'In high season the color changes: demand changes the mix on the stall.',
            'Nobody at the market will decide for you what a bouquet says: the advice comes from the florist, not from a chart.',
          ],
        },
      ],
      operational_es:
        'La temporada fuerte del cempasúchil coincide con el Día de Muertos, y con ella sube la demanda y el precio. Fuera de esa fecha, el mercado tiene un ritmo distinto.',
      operational_en:
        'Marigold season lines up with the Day of the Dead, and with it demand and price rise. Outside that date, the market runs at a different pace.',
    },
    {
      id: 'jamaica-5-alrededor',
      number: 5,
      title_es: 'La vida que ocurre alrededor',
      title_en: 'The life that happens around it',
      location_es: 'Mercado de zona y nave de comidas',
      location_en: 'Zona market and food nave',
      kicker_es: 'No todo aquí son flores',
      kicker_en: 'Not everything here is flowers',
      question_es: '¿Vienes a comprar o vienes a estar?',
      question_en: 'Did you come to buy, or to be here?',
      lead_es:
        'El mercado de Jamaica tiene tres naves y no todas son de flores: una es el mercado mayorista, otra el mercado de zona, y la tercera el área de comidas. También hay plantas de ornato, macetas, adornos y artículos de fiesta. Es un mercado de comercio y de vida cotidiana, no un fondo de fotos: aquí se viene a hacer mandado, a comer, a resolver y también a comprar flores.',
      lead_en:
        'The Mercado de Jamaica has three naves and not all of them are for flowers: one is the wholesale market, another the local market, and the third the food area. There are also ornamental plants, pots, decorations and party goods. It is a market of trade and daily life, not a photo backdrop: people come here to run errands, to eat, to sort things out, and also to buy flowers.',
      image: 'dulceriaPanoramica',
      steps: [
        {
          title_es: 'Pedir permiso',
          title_en: 'Asking permission',
          body_es:
            'Quien trabaja en el mercado no es parte del decorado. Si vas a retratar a alguien, se lo preguntas antes y aceptas un no sin discutir. Si vas a tomar una foto de cerca de un puesto, también. Visitor significa relacionarse con personas que viven de su trabajo, y esa relación empieza por reconocerlas.',
          body_en:
            'The people who work here are not part of the set. If you are going to photograph someone, ask them first and accept a no without arguing. If you are going to take a close-up of a stall, ask that too. To visit means to relate to people who make a living from their work, and that relation starts by recognizing them.',
          observe_es: [
            'El trato es de persona a persona: el puesto se atiende, se pregunta y se paga.',
            'Los productos de temporada y de región conviven con los de siempre.',
            'La dulcería mexicana es parte de la nave de comidas: el mercado no se agota en las flores.',
          ],
          observe_en: [
            'The exchange is person to person: the stall is attended to, asked about and paid for.',
            'Seasonal and regional products sit next to the everyday ones.',
            'Mexican sweets are part of the food nave: the market does not run out at the flowers.',
          ],
          image: 'dulceria',
        },
      ],
      operational_es:
        'La entrada general es por Morelos. La línea 9 del Metro tiene su terminal debajo del mercado y es la forma más simple de llegar sin depender de estacionamiento.',
      operational_en:
        'The main entrance is on Morelos. Metro line 9 has its terminal under the market and it is the simplest way to get there without relying on parking.',
    },
  ],
  discoveries: [
    {
      id: 'observado',
      kind: 'observacion',
      title: 'Lo que se observa de frente',
      title_en: 'What is observed first hand',
      body: 'El ramo que llega con el tallo cortado en diagonal, las hojas bajas ya eliminadas, el piso mojado, el manojo de cempasúchil que cambia de color con la temporada, la fila de canastas, el toldo de la dulcería. Es la parte del recorrido que no depende de ninguna fuente.',
      body_en:
        'The bunch that arrives with a diagonal stem, the low leaves already removed, the wet floor, the marigold bunch that changes color with the season, the row of baskets, the sweets stall canopy. It is the part of the route that depends on no source.',
    },
    {
      id: 'documentado',
      kind: 'documentado',
      title: 'Lo que documentan las fuentes',
      title_en: 'What the sources document',
      body: 'La inauguración del 23 de septiembre de 1957, los arquitectos, las tres naves, los 36 mil metros cuadrados, los puestos, las cinco mil variedades de flores y plantas, el canal de la Viga, el desembarcadero de 1895 y el temblor de 1985.',
      body_en:
        'The opening on September 23, 1957, the architects, the three naves, the 36,000 square meters, the stalls, the five thousand varieties of flowers and plants, the Canal de la Viga, the 1895 dock and the 1985 earthquake.',
    },
    {
      id: 'pendiente',
      kind: 'pendiente',
      title: 'Lo que falta verificar',
      title_en: 'What still needs checking',
      body: 'El listado vigente de las siete asociaciones de productores, la carta de precios de un ramo en la fecha de la visita, el nombre y el acuerdo del florista para el taller, y la disponibilidad de material de archivo que muestre el trabajo de composición de cerca.',
      body_en:
        'The current list of the seven producers associations, the price list for a bunch on the day of the visit, the name of the florist and the agreement for the workshop, and archive material showing the composition work up close.',
    },
  ],
  sources: [
    {
      id: 'wiki-jamaica',
      label_es: 'Wikipedia - Mercado de Jamaica',
      label_en: 'Wikipedia - Mercado de Jamaica',
      url: 'https://es.wikipedia.org/wiki/Mercado_de_Jamaica',
    },
    {
      id: 'cdmx-jamaica',
      label_es: 'Ciudad de México - Mercado de Jamaica',
      label_en: 'Mexico City - Mercado de Jamaica',
      url: 'https://mexicocity.cdmx.gob.mx/venues/jamaica-market/',
    },
    {
      id: 'eluniversal-63',
      label_es: 'El Universal - El mercado de Jamaica, 63 años de ser la florería de México',
      label_en: 'El Universal - The Jamaica market, 63 years of being the flower market of Mexico',
      url: 'https://www.eluniversal.com.mx/espectaculos/el-mercado-de-jamaica-63-anos-de-ser-la-floreria-de-mexico/',
    },
    {
      id: 'confabulario-mercados',
      label_es:
        'El Universal / Confabulario - Tres mercados en un cucurucho (origen del nombre, 1885, 1895)',
      label_en: 'El Universal / Confabulario - Three markets in one curl (name origin, 1885, 1895)',
      url: 'https://confabulario.eluniversal.com.mx/tres-mercados-en-un-cucurucho/',
    },
    {
      id: 'unam-jamaica',
      label_es:
        'UNAM, Escuela Preparatoria 2 - Ficha del Mercado de Jamaica (arquitectos,opened, locales)',
      label_en: 'UNAM, High School 2 - Mercado de Jamaica fact sheet (architects, opening, stalls)',
      url: 'http://www.prepa2.unam.mx/Academia/infocab/docs/Jamaica.pdf',
    },
    {
      id: 'commons-jamaica',
      label_es: 'Wikimedia Commons - Categoría Mercado de Jamaica (fotografías de archivo)',
      label_en: 'Wikimedia Commons - Mercado de Jamaica category (archive photographs)',
      url: 'https://commons.wikimedia.org/wiki/Category:Mercado_de_Jamaica',
    },
  ],
}

/** Etiquetas de las tarjetas de descubrimiento. */
export const JAMAICA_DISCOVERY_KINDS = {
  documentado: { label: 'Documentado', tone: 'documentado' },
  observacion: { label: 'Lo que se observa', tone: 'curiosidad' },
  pendiente: { label: 'Pendiente de documentar', tone: 'tradicion' },
}

/**
 * El bloque participativo del momento 06. Vive aparte porque no es un
 * momento editorial: es una interacción local, opcional y no persistida.
 */
export const JAMAICA_TALLER = {
  intro_es:
    'La última parte del recorrido propone hacer un ramo. No es un taller reservado ni un servicio confirmado: es una idea que estamos negociando con quien lleva el puesto, y que se pública como propuesta para que se vea en qué consiste.',
  intro_en:
    'The last part of the route proposes making a bouquet. It is not a booked workshop nor a confirmed service: it is an idea we are negotiating with the stallholder, published as a proposal so that you can see what it involves.',
  pending_es:
    'Pendiente de coordinación: falta acordar con el florista la fecha, el lugar exacto dentro del mercado, el número de participantes y qué se puede ofrecer. Hasta que exista ese acuerdo, esta sección no se puede reservar.',
  pending_en:
    'Pending coordination: the date, the exact place inside the market, the number of participants and what can be offered still have to be agreed with the florist. Until that agreement exists, this section cannot be booked.',
}

/**
 * Adaptadores al formato que consumen los componentes de journeys.
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
export function jamaicaMoments() {
  return JAMAICA_JOURNEY.moments.map(toEditorialMoment)
}

export default JAMAICA_JOURNEY
