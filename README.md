# US Basketball League Manager

Aplicación web completa para gestionar una liga profesional de baloncesto ficticia de Estados Unidos. Incluye equipos, jugadores, calendario, resultados, clasificación calculada, estadísticas individuales y un módulo de análisis de enfrentamientos con probabilidades y cuotas **simuladas**.

> **Aviso:** proyecto de demostración. Los equipos, jugadores, partidos y resultados son ficticios. No está afiliado a la NBA ni a ninguna liga real. Las cuotas de la sección Favoritos son un ejercicio estadístico y no provienen de una casa de apuestas ni deben usarse para apostar dinero real.

## Funcionalidades

- **Panel principal** con resumen de temporada, próximo partido, últimos resultados, líderes, clasificación rápida y gráficos de rendimiento.
- **Equipos**: alta, edición y eliminación con confirmación; escudo generado a partir de colores, conferencia, pabellón, entrenador y plantilla.
- **Jugadores**: alta, edición, ficha individual, búsqueda, filtros por equipo/posición, ordenación y paginación.
- **Eliminación de jugadores**: módulo administrativo dedicado con búsqueda, filtros, confirmación y eliminación en cascada de sus estadísticas de temporada.
- **Partidos**: programación, registro y edición de resultados, filtros por temporada/equipo/estado, ordenación y eliminación.
- **Clasificación**: calculada automáticamente a partir de los partidos finalizados, separada por conferencia Este/Oeste.
- **Favoritos y cuotas**: selector de próximos encuentros, probabilidad del modelo, cuota decimal simulada, marcador proyectado, forma reciente y comparación estadística.
- **Datos y respaldo**: exportación e importación JSON con validación de estructura, integridad referencial e IDs únicos; restauración de los datos demo.
- **Persistencia local** automática, notificaciones, validaciones de formularios, estados vacíos y diseño responsive.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3.4
- React Router 7 (`BrowserRouter`)
- Lucide React (iconografía)
- Oxlint (linting)
- Gráficos propios con SVG/CSS, sin librerías de charts

## Requisitos

- Node.js 20.19+ o 22.12+ (recomendado: última versión LTS)
- npm 10+

## Puesta en marcha

```bash
npm install
npm run dev
```

Vite mostrará la URL local, normalmente <http://localhost:5173>.

### Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprobación de TypeScript y compilación de producción en `dist/` |
| `npm run preview` | Sirve localmente la compilación de producción |
| `npm run lint` | Ejecuta Oxlint sobre el proyecto |

## Rutas

| Ruta | Módulo |
| --- | --- |
| `/` | Panel principal |
| `/teams` | Listado de equipos |
| `/teams/:teamId` | Detalle del equipo y plantilla |
| `/players` | Listado de jugadores |
| `/players/:playerId` | Perfil del jugador |
| `/players/delete` | Administración de bajas de jugadores |
| `/games` | Calendario y resultados |
| `/standings` | Clasificación por conferencia |
| `/favorites` | Favoritos, probabilidades y cuotas demo |
| `/data` | Exportación, importación y gestión de datos |

La aplicación usa `BrowserRouter`. En un despliegue estático hay que configurar un **fallback SPA** para que cualquier ruta devuelva `index.html`; por ejemplo, una regla de rewrite en Netlify/Vercel o `try_files $uri /index.html` en nginx.

## Arquitectura

```text
src/
  components/
    charts/        Gráficos y comparaciones reutilizables
    dialogs/       Confirmaciones de eliminación en cascada
    games/         Tarjetas y modales de partidos
    layout/        Shell, navegación lateral y topbar
    players/       Formulario de jugador
    teams/         Formulario de equipo
    ui/            Botones, tarjetas, modales, campos, toasts, etc.
  data/seed.ts     Generador determinista del conjunto demo
  lib/
    format.ts      Formatos en español (fechas, números, porcentajes)
    id.ts          Generación de IDs
    random.ts      RNG determinista para datos demo
    stats.ts       Clasificación, récords, promedios, líderes y modelo de enfrentamientos
    storage.ts     Adaptador de localStorage, validación e import/export
  pages/           Vistas de la aplicación
  store/
    LeagueContext.tsx  Estado global, CRUD, cascadas y persistencia
  types.ts         Modelo de dominio TypeScript
```

## Modelo de datos

Persistencia bajo la clave `usblm.league.v1` de `localStorage`, con esta forma:

```ts
LeagueDB {
  version: number
  teams: Team[]
  seasons: Season[]
  players: Player[]
  playerStats: PlayerSeasonStat[]
  games: Game[]
  updatedAt: string
}
```

Relaciones principales:

- `Player.teamId → Team.id` (un equipo tiene muchos jugadores).
- `PlayerSeasonStat.playerId → Player.id` (totales por jugador y temporada).
- `PlayerSeasonStat.seasonId → Season.id`.
- `Game.seasonId → Season.id`, `Game.homeTeamId / awayTeamId → Team.id`.
- Cada entidad tiene una clave primaria `id` única.

Al importar un respaldo se comprueba que la estructura sea válida, que los IDs no estén duplicados, que exista una temporada activa y que todas las referencias entre entidades apunten a registros existentes. Las eliminaciones en cascada se aplican a jugadores y equipos:

- Eliminar un jugador borra sus filas de estadísticas.
- Eliminar un equipo borra sus jugadores, las estadísticas de esos jugadores y los partidos en los que participó.

La clasificación y las estadísticas de equipo **no se almacenan**: se calculan siempre a partir de los partidos finalizados, por lo que cualquier resultado editado se refleja de inmediato.

## Datos de demostración

El conjunto inicial se genera de forma determinista:

- 12 franquicias ficticias: 6 de la Conferencia Este y 6 de la Oeste.
- 120 jugadores (10 por equipo).
- Temporada activa `2026-27`: 48 partidos finalizados y 18 programados.
- Temporada archivada `2025-26`: calendario completo.
- 240 filas de estadísticas individuales (jugador × temporada).
- 132 partidos en total.

Los nombres de equipos y jugadores son inventados y solo se inspiran en la estética del deporte profesional estadounidense.

## Análisis de favoritos

`analyzeMatchup` calcula para cada partido programado:

- Récord, puntos anotados/recibidos y diferencia por partido de ambos equipos.
- Probabilidad local/visitante mediante una función logística con ventaja de cancha.
- Cuota decimal simulada con un margen de demostración del 5 %.
- Marcador proyectado a partir del ataque y la defensa de cada equipo.

La página muestra la fecha de última actualización y una advertencia visible de que los datos y las cuotas son simulados. El modelo es local y explicable; no hay llamadas a APIs deportivas ni de apuestas.

## Persistencia y limitaciones

- Los datos se guardan automáticamente en el navegador y perfil actuales.
- No existe backend, base de datos remota, autenticación, permisos ni multiusuario.
- `localStorage` suele limitarse a unos 5 MB por origen. La página Datos muestra el espacio utilizado y advierte si el guardado falla.
- Borrar los datos del sitio, usar modo privado o limpiar el navegador elimina la liga.
- Para conservar o mover la información hay que usar **Exportar respaldo** y luego **Importar respaldo**.
- La aplicación funciona sin conexión una vez cargada; no simula servicios remotos.

Para una versión con backend real, el límite natural es `src/lib/storage.ts` y `LeagueContext`: se puede sustituir el adaptador local por una API REST, Supabase o PostgreSQL manteniendo las mismas entidades y relaciones.

## Verificación

```bash
npm run build
npm run lint
```

`npm run build` debe completar sin errores de TypeScript. El lint puede mostrar advertencias de Fast Refresh y de `setState` dentro de efectos; no son errores de compilación. Las rutas, el CRUD, las cascadas, el registro de resultados, la clasificación, la exportación/importación y la restauración demo se comprueban en el navegador durante el desarrollo.
