import json
import os

# Pega aquí el JSON completo del response (el que guardaste)
# O ejecuta: python crear_proyecto.py proyecto.json

import sys

CARPETA_DESTINO = "control-combustible"

# Si pasas el archivo JSON como argumento, lo lee; si no, usa el JSON hardcodeado
if len(sys.argv) > 1:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
else:
    print("Uso: python crear_proyecto.py archivo.json")
    print("Donde archivo.json es el JSON del response de Base44 (el campo 'files')")
    sys.exit(1)

# Soporte para ambos formatos: {files: {...}} o directamente {...}
if "files" in data:
    files = data["files"]
elif isinstance(data, dict) and any("/" in k or "." in k for k in data):
    files = data
else:
    print("No se encontró el campo 'files' en el JSON")
    sys.exit(1)

creados = 0
ignorados = 0

for ruta, contenido in files.items():
    # Ignorar entidades (no son archivos de código)
    if ruta.startswith("entities/"):
        ignorados += 1
        continue

    ruta_completa = os.path.join(CARPETA_DESTINO, ruta)
    carpeta = os.path.dirname(ruta_completa)

    if carpeta:
        os.makedirs(carpeta, exist_ok=True)

    with open(ruta_completa, "w", encoding="utf-8") as f:
        f.write(contenido)

    print(f"  ✓ {ruta}")
    creados += 1

# Crear .env.local
env_content = """# Configura estas variables con los datos de tu app en Base44
VITE_BASE44_APP_ID=69c14b6251ead42928d8a2d0
VITE_BASE44_APP_BASE_URL=https://TU-APP.base44.app
"""
env_path = os.path.join(CARPETA_DESTINO, ".env.local")
with open(env_path, "w") as f:
    f.write(env_content)

print(f"\n✅ Proyecto creado en '{CARPETA_DESTINO}/'")
print(f"   {creados} archivos creados, {ignorados} entidades omitidas")
print(f"\n📋 Próximos pasos:")
print(f"   1. cd {CARPETA_DESTINO}")
print(f"   2. Edita .env.local con la URL de tu app")
print(f"   3. npm install")
print(f"   4. npm run dev")
