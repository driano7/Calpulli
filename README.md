# Calpulli CDMX — Tours y experiencias por la Ciudad de México

Plataforma de turismo local para descubrir la CDMX como un chilango: tours gastronómicos, jornadas culturales, guías de barrio, mapas interactivos y reservas con ticket QR. Todo en español e inglés.

## Qué puedes hacer en el sitio

| Función                | Qué ofrece                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tours**              | Recorridos guiados por la ciudad (comida callejera, museos, barrios) con precios, disponibilidad y reserva online.                                                                                |
| **Journeys**           | Caminatas editoriales culturales (Lucha Libre, Centro Histórico, Chapultepec, Roma-Condesa, Jamaica, Antropología) para leer y recorrer a tu ritmo. No se reservan: son contenido para disfrutar. |
| **Guías interactivas** | Recorridos autoguiados con mapa y audio: Condesa, Centro, Chapultepec, Chimalistac, UNAM.                                                                                                         |
| **Mapas de la ciudad** | 5 mapas curados: comida tradicional, zonas con precaución, vida nocturna, joyas escondidas y top atracciones.                                                                                     |
| **Local Picks**        | Guía mensual curada por chilangos con 3 festividades fijadas todo el año (Año Nuevo, 16 de Septiembre, Día de Muertos) y 6 recomendaciones que rotan cada mes.                                    |
| **Blog de emergencia** | Teléfonos de emergencia (911, Policía Turística +52 55 4891 1116, Protección Civil), qué hacer en caso de sismo, zonas con precaución y dónde encontrar a la Policía Turística.                   |
| **Reservas**           | Reserva tours y experiencias con tarjeta (Stripe), efectivo o cripto. Recibe tu ticket con QR por email o descárgalo. Puedes pagar como invitado sin crear cuenta.                                |
| **Mi perfil**          | Ve tus reservas, descarga tickets con QR, edita tu perfil y gestiona tu seguridad y datos (GDPR).                                                                                                 |
| **Pagos cripto**       | Ethereum, Base y Lightning Network con verificación on-chain.                                                                                                                                     |

## Cómo reservar

1. Elige un tour o experiencia en `/tours`.
2. Selecciona fecha, hora y número de personas.
3. Agrega al carrito y pasa a `/checkout`.
4. Paga con tarjeta (Stripe), efectivo (se paga en el punto de encuentro) o cripto.
5. Descarga tu ticket con QR desde el checkout o desde tu perfil.

## Para desarrolladores

El sitio usa Next.js 12, React 17, Tailwind CSS y Framer Motion. Los datos de tours y journeys viven en `data/`. Las reservas se guardan en Turso/Supabase. Las noticias y local picks se generan mensualmente con OpenRouter.

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run serve    # iniciar en producción
```

## Roles

- **Cliente**: ver perfil, reservas, tickets y comprar.
- **Empleado**: portal de operaciones con agenda del día y lector QR.
- **Socio/Admin**: panel de gestión, métricas avanzadas, analítica pasiva y exportación GDPR.

Los roles se resuelven por `ADMIN_EMAILS` y `EMPLOYEE_EMAILS` en las variables de entorno.

## Licencia

MIT — ver [LICENSE](LICENSE). © 2024–2026 Donovan Riaño / Calpulli CDMX.
