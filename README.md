# Intercambio navideño

Sorteo de intercambio navideño para hacer en un solo teléfono, estilo juego de pasar el teléfono. Sitio estático: sin base de datos ni servidor.

## Estructura

```
Intercambio/
├── README.md
├── servir.bat              servidor local de prueba (http://localhost:5500)
├── sitio/                  lo único que se publica
│   ├── index.html          estructura de la página
│   ├── css/
│   │   └── styles.css      estilos
│   └── js/
│       ├── app.js          interfaz: vistas, render y eventos (punto de entrada)
│       ├── sorteo.js       lógica del sorteo (sin dependencias de la interfaz)
│       ├── estado.js       estado y guardado en localStorage
│       ├── util.js         utilidades ($, esc, fmtDate)
│       └── iconos.js       iconos SVG
└── extras/
    └── intercambio-schema.sql   esquema de BD para una posible versión futura (no se usa)
```

El JavaScript usa módulos ES (`<script type="module">`), así que **no funciona abriendo `index.html` con doble clic**. Para probar en local usa `servir.bat` (requiere Node.js) o la extensión Live Server de VS Code.

## Cómo funciona

Dos vistas:

- **Organizador**: lista de nombres, detalles (nombre, presupuesto, fecha), parejas que no se pueden tocar y estado de cada persona (pendiente o ya lo vio).
- **Entrega** (pantalla completa), un ciclo por persona:
  1. Verde: "Pásale el teléfono a Ana". Solo aparece su etiqueta cerrada.
  2. Rojo: Ana toca "Ver a quién le regalo" y la etiqueta se abre con el nombre, presupuesto y fecha.
  3. Casi negro: Ana toca "Ocultar" y la pantalla pide devolver el teléfono. El organizador toca "Siguiente".

Reglas:

- El sorteo pide crear un PIN de 4 números. El PIN se pide para entrar a la entrega, repetir el sorteo y editar la lista.
- Cada etiqueta se abre una sola vez; queda bloqueada aunque se recargue la página.
- "Saltar por ahora" deja a una persona para el final si no está presente.

Los datos se guardan en el `localStorage` del navegador con la clave `intercambio-navideno-v3`.

## Marca

El footer lleva siempre la firma "Desarrollado por boa. estudio" con enlace a https://boaestudio.com (Outfit Bold/Light, punto en verde Selva #2F7D5B). La vista de entrega también la muestra.

## Publicación

- Destino previsto: subdominio de boaestudio.com (por ejemplo `intercambio.boaestudio.com`).
- Hosting estático: solo se sube la carpeta `sitio/`.

## Pendientes

- Meta tags Open Graph (vista previa al compartir por WhatsApp) y favicon.
- Publicar en hosting estático y apuntar el subdominio.
