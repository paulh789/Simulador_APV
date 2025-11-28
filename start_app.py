import os
import subprocess
import sys
import webbrowser

PYTHON_BIN = sys.executable
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --------------------------
# 1. Crear venv si no existe
# --------------------------
VENV_DIR = os.path.join(BASE_DIR, "venv")
ACTIVATE_BAT = os.path.join(VENV_DIR, "Scripts", "activate.bat")

if not os.path.exists(VENV_DIR):
    print("Creando entorno virtual...")
    subprocess.check_call([PYTHON_BIN, "-m", "venv", "venv"])

# --------------------------
# 2. Instalar dependencias
# --------------------------
print("Instalando dependencias...")
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "-m", "pip", "install", "--upgrade", "pip"])
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "-m", "pip", "install", "-r", os.path.join(BASE_DIR, "requirements.txt")])

# --------------------------
# 3. Instalar Chromium para Playwright
# --------------------------
print("Instalando Chromium para Playwright...")
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "-m", "playwright", "install", "chromium"])

# --------------------------
# 4. Crear migraciones
# --------------------------
print("Creando migraciones...")
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "makemigrations", "app"])

# --------------------------
# 5. Ejecutar migraciones
# --------------------------
print("Ejecutando migraciones...")
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "migrate"])

# --------------------------
# 6. Cargar datos iniciales (si existe fixture)
# --------------------------
fixture_path = os.path.join(BASE_DIR, "app", "fixtures", "initial_data.json")
if os.path.exists(fixture_path):
    print("Cargando datos iniciales...")
    subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "loaddata", fixture_path])

# --------------------------
# 7. Llamar a actualizar_datos (con Python del venv)
# --------------------------
print("Actualizando indicadores diarios...")
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "actualizar_datos"])

# --------------------------
# 8. Abrir navegador apuntando a localhost
# --------------------------
print("Abriendo navegador en http://127.0.0.1:8000/ ...")
webbrowser.open("http://127.0.0.1:8000/")

# --------------------------
# 9. Ejecutar servidor Django
# --------------------------
print("Iniciando servidor Django...")
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "runserver"])
