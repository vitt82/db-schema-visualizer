# Scripts — Empaquetado e instalación de VSIX

Este directorio contiene utilidades para empaquetar e instalar localmente las extensiones VS Code incluidas en este repositorio.

Archivos principales

- `package-and-install.sh` — Script que construye y empaqueta los paquetes de extensión (`packages/prisma-vs-code-extension` y `packages/dbml-vs-code-extension`) y, si la CLI `code` está disponible, instala los `.vsix` resultantes en la instancia local de VS Code.

- `rebuild-and-install.sh` — **Script completo de desarrollo** que:
  1. Cierra todas las instancias de VS Code
  2. Limpia cache y builds anteriores
  3. Compila la extensión Prisma
  4. Empaqueta el `.vsix`
  5. Desinstala la versión anterior
  6. Instala la nueva versión
  7. Opcionalmente limpia datos persistentes (`.DBML`)
  8. Reabre VS Code
  
  **Uso recomendado durante desarrollo activo:**
  ```bash
  ./scripts/rebuild-and-install.sh
  ```

Requisitos

- Yarn (recomendado) o npm instalado globalmente. No mezclar gestores de paquetes en el mismo repositorio.
- La CLI de VS Code `code` en el PATH para que el script pueda instalar los `.vsix` automáticamente.
- vsce instalado indirectamente por el script (se usa en los `package.json` de cada paquete).

Uso (recomendado con Yarn)

```bash
# instalar dependencias del repo y crear yarn.lock
yarn install

# empaquetar e instalar ambas extensiones (prisma + dbml)
bash ./scripts/package-and-install.sh all

# o empaquetar/instalar solo una de ellas
bash ./scripts/package-and-install.sh prisma
bash ./scripts/package-and-install.sh dbml
```

Notas

- El script ejecuta los scripts de build definidos en cada paquete; pueden aparecer advertencias del build (chunks grandes, browserslist desactualizado) que no impiden la creación del `.vsix`.
- `vsce` detecta la presencia de `.yarnrc` y preferirá `yarn`. Si quieres forzar npm, elimina/renombra `.yarnrc` y `yarn.lock` y ejecuta `npm ci` antes de lanzar el script.
- Si `vsce` pregunta por la licencia (LICENSE) o por confirmaciones, el script puede requerir intervención si falta un `LICENSE`. Añadir un `LICENSE` o `LICENSE.md` en el paquete correspondiente evita el prompt.

Solución de problemas

- Error típico: `vsce` falla con mensajes tipo `yarn list --prod --json` / `npm list`:
  - Asegúrate de tener un lockfile válido para el gestor elegido (`yarn.lock` o `package-lock.json`).
  - Normaliza `node_modules` con `yarn install` o `npm ci` según corresponda.

- Si el `.vsix` se instala correctamente pero el comando no aparece en la paleta de VS Code:
  - Reinicia VS Code.
  - Asegúrate de que la extensión no esté deshabilitada y que no haya conflictos de versiones.

Contribuir / mejoras

- Puedes mejorar el script añadiendo flags no interactivos para `vsce` o `yarn`/`npm` si quieres automatizar más la ejecución en CI.
- Si quieres, puedo:
  - Añadir un `LICENSE` por paquete para evitar prompts interactivos.
  - Extender el script para subir los VSIX a un bucket o a GitHub Releases.

---

Archivo generado automáticamente por la sesión de mantenimiento del repositorio. Si quieres ajustes en el contenido o la localización, dime y lo actualizo.
