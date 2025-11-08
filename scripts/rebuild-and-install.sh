#!/bin/bash

# Script para rebuild completo y reinstalación de la extensión Prisma ERD Visualizer
# Uso: ./scripts/rebuild-and-install.sh

set -e  # Detener si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Prisma ERD Visualizer - Rebuild & Install Script            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXTENSION_DIR="$PROJECT_ROOT/packages/prisma-vs-code-extension"

echo -e "${YELLOW}📂 Directorio del proyecto: ${NC}$PROJECT_ROOT"
echo ""

# Paso 1: Cerrar todas las instancias de VS Code
echo -e "${YELLOW}🔄 Paso 1: Cerrando todas las instancias de VS Code...${NC}"
pkill -f "code" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ VS Code cerrado${NC}"
echo ""

# Paso 2: Limpiar cache y builds anteriores
echo -e "${YELLOW}🧹 Paso 2: Limpiando cache y builds anteriores...${NC}"
cd "$EXTENSION_DIR"
rm -rf dist *.vsix node_modules/.vite 2>/dev/null || true
echo -e "${GREEN}✓ Cache limpiado${NC}"
echo ""

# Paso 3: Compilar la extensión
echo -e "${YELLOW}🔨 Paso 3: Compilando la extensión...${NC}"
yarn build:prisma
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Compilación exitosa${NC}"
else
    echo -e "${RED}✗ Error en la compilación${NC}"
    exit 1
fi
echo ""

# Paso 4: Empaquetar la extensión
echo -e "${YELLOW}📦 Paso 4: Empaquetando la extensión...${NC}"
yarn create:package
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Empaquetado exitoso${NC}"
else
    echo -e "${RED}✗ Error en el empaquetado${NC}"
    exit 1
fi
echo ""

# Paso 5: Desinstalar extensión anterior
echo -e "${YELLOW}🗑️  Paso 5: Desinstalando extensión anterior...${NC}"
code --uninstall-extension vitt.prisma-erd-visualizer 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓ Extensión anterior desinstalada${NC}"
echo ""

# Paso 6: Instalar nueva extensión
echo -e "${YELLOW}📥 Paso 6: Instalando nueva extensión...${NC}"
VSIX_FILE=$(ls -t "$EXTENSION_DIR"/*.vsix | head -1)
if [ -f "$VSIX_FILE" ]; then
    code --install-extension "$VSIX_FILE"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Extensión instalada: $(basename "$VSIX_FILE")${NC}"
    else
        echo -e "${RED}✗ Error al instalar la extensión${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ No se encontró el archivo .vsix${NC}"
    exit 1
fi
echo ""

# Paso 7: Limpiar datos persistentes (opcional)
echo -e "${YELLOW}🔄 Paso 7: ¿Deseas limpiar los datos persistentes (.DBML)?${NC}"
echo -e "   Esto eliminará todas las posiciones guardadas de tablas y control points."
read -p "   (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Buscar directorios .DBML en el workspace del usuario
    echo -e "${YELLOW}   Buscando directorios .DBML...${NC}"
    find ~/ -type d -name ".DBML" 2>/dev/null | while read dbml_dir; do
        echo -e "   Encontrado: $dbml_dir"
        rm -rf "$dbml_dir"
        echo -e "${GREEN}   ✓ Eliminado${NC}"
    done
    echo -e "${GREEN}✓ Datos persistentes limpiados${NC}"
else
    echo -e "${BLUE}ℹ  Datos persistentes conservados${NC}"
fi
echo ""

# Paso 8: Abrir VS Code
echo -e "${YELLOW}🚀 Paso 8: Abriendo VS Code...${NC}"
sleep 1
code "$PROJECT_ROOT" &
echo -e "${GREEN}✓ VS Code iniciado${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Proceso completado exitosamente                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📝 Próximos pasos:${NC}"
echo -e "   1. Abre tu archivo Prisma en VS Code"
echo -e "   2. Abre la vista previa del diagrama ERD"
echo -e "   3. Haz click en una línea de conexión"
echo -e "   4. Verás círculos arrastrables y línea punteada"
echo -e "   5. Arrastra los círculos para ajustar la conexión"
echo ""
