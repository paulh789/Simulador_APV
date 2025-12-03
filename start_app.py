import os
import subprocess
import sys
import webbrowser

PYTHON_BIN = sys.executable
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --------------------------
# Crear venv si no existe
# --------------------------
VENV_DIR = os.path.join(BASE_DIR, "venv")

if not os.path.exists(VENV_DIR):
    print("Creando entorno virtual...")
    subprocess.check_call([PYTHON_BIN, "-m", "venv", "venv"])

    # --------------------------
    # Instalar dependencias
    # --------------------------
    print("Instalando dependencias...")
    subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "-m", "pip", "install", "-r", os.path.join(BASE_DIR, "requirements.txt")])

    # --------------------------
    # Instalar Chromium para Playwright
    # --------------------------
    print("Instalando Chromium para Playwright...")
    subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "-m", "playwright", "install", "chromium"])

    # --------------------------
    # Crear migraciones
    # --------------------------
    print("Creando migraciones...")
    subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "makemigrations", "app"])

    # --------------------------
    # Ejecutar migraciones
    # --------------------------
    print("Ejecutando migraciones...")
    subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "migrate"])

    # --------------------------
    # Cargar datos iniciales
    # --------------------------
    fixture_path = os.path.join(BASE_DIR, "app", "fixtures", "initial_data.json")
    if os.path.exists(fixture_path):
        print("Cargando datos iniciales...")
        subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "loaddata", fixture_path])

# --------------------------
# Llamar a actualizar_datos
# --------------------------
print("Actualizando indicadores diarios...")
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "actualizar_datos"])

# --------------------------
# Abrir navegador apuntando a localhost
# --------------------------
print("Abriendo navegador en http://127.0.0.1:8000/ ...")
webbrowser.open("http://127.0.0.1:8000/")

# --------------------------
# Ejecutar servidor Django
# --------------------------
print("Iniciando servidor Django...")
subprocess.check_call([os.path.join(VENV_DIR, "Scripts", "python.exe"), "manage.py", "runserver"])
