# Database schema visualizer

An Vscode extension to visualize the database schema in ERD from dbml or prisma file in your vscode.

## Demo

![DBML Demo](./assets/demo.gif)

## Features

- Create entity relations diagrams from your DBML/Prisma code
- Available in light and dark modes

## How to install and use it

Follow this article: <https://juste.bocovo.me/preview-dbml-code-from-vscode>

## Downloads

- [The DBML extension](https://marketplace.visualstudio.com/items?itemName=bocovo.dbml-erd-visualizer)
- [The Prisma extension](https://marketplace.visualstudio.com/items?itemName=bocovo.prisma-erd-visualizer)

## Extensions

- [The DBML extension](./packages/dbml-vs-code-extension/README.md)
- [The Prisma extension](./packages/prisma-vs-code-extension/README.md)

## Contribute

If you want to contribute to this project please read the [contribution note](./CODE_OF_CONDUCT.md)

## Empaquetado e instalación local (VSIX)

Si quieres empaquetar las extensiones y probarlas localmente en tu VS Code (instalando los VSIX), este repositorio incluye un script útil:

- Script: `scripts/package-and-install.sh`

Requisitos previos

- Tener `yarn` o `npm` instalado globalmente. Este repo puede usarse con Yarn (recomendado aquí) o con npm — no mezcles ambos gestores.
- Tener disponible la CLI de VS Code `code` en el PATH para poder instalar los `.vsix` automáticamente.

Uso recomendado (usar Yarn — coherente con este repositorio):

1. Instalar dependencias con Yarn (genera `yarn.lock` si falta):

```bash
yarn install
```


1. Ejecutar el script para empaquetar e instalar ambas extensiones (prisma + dbml):

```bash
bash ./scripts/package-and-install.sh all
```

El script también acepta `prisma` o `dbml` como argumento para empaquetar/instalar sólo uno de los paquetes.

Notas y consideraciones

- `vsce` detecta la presencia de `.yarnrc` y preferirá `yarn` si existe; por eso es importante usar un único gestor de paquetes en el repositorio.
- Durante el empaquetado `vsce` puede preguntar por confirmaciones (por ejemplo licencia o activación). El script está pensado para automatizar el flujo (responde afirmativamente en el entorno donde lo ejecutamos).
- Si prefieres usar npm en lugar de Yarn:

  - Elimina/renombra `.yarnrc` y `yarn.lock` del repo y ejecuta `npm ci`.
  - Actualiza los scripts que llamen explícitamente a `yarn run ...` si es necesario.

- Si ves advertencias sobre `can i use`/`browserslist` o chunks grandes, son advertencias del build y no impiden la creación del `.vsix`.

Solución de problemas rápida

- Si `vsce` falla indicando problemas con dependencias tipo `npm list` o `yarn list`, normaliza `node_modules` con el gestor elegido (`npm ci` o `yarn install`) y vuelve a ejecutar el script.
- Si el empaquetado se queja por falta de `LICENSE`, `vsce` preguntará; puedes añadir un `LICENSE` o `LICENSE.md` en el paquete correspondiente para evitar la confirmación interactiva.

Si quieres, puedo añadir un pequeño `README` dentro de `scripts/` con estos pasos y/o crear automáticamente un `LICENSE` en `packages/dbml-vs-code-extension` para evitar el prompt — dime si lo haces y lo añado.
