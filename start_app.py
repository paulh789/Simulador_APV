import os
import subprocess
import sys
import time
import socket

PYTHON_BIN = sys.executable
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
APP = False

def puerto_ocupado(port=8000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


# -----------------------------------
# 0. Si el servidor ya está corriendo → abrir navegador y salir
# -----------------------------------
if puerto_ocupado(8000):
    print("Servidor ya activo. Abriendo navegador...")
    if APP:
        subprocess.Popen([
            EDGE_PATH,
            "--app=http://127.0.0.1:8000/",
            "--new-window"
        ])
    else:
        subprocess.Popen([
            EDGE_PATH,
            "http://127.0.0.1:8000/"
        ])
    sys.exit(0)


# -----------------------------------
# 1. Crear venv si no existe
# -----------------------------------
VENV_DIR = os.path.join(BASE_DIR, "venv")
VENV_PY = os.path.join(VENV_DIR, "Scripts", "python.exe")

if not os.path.exists(VENV_DIR):
    print("Creando entorno virtual...")
    subprocess.check_call([PYTHON_BIN, "-m", "venv", "venv"])

    # -----------------------------------
    # 2. Instalar dependencias
    # -----------------------------------
    print("Instalando dependencias...")
    subprocess.check_call([VENV_PY, "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([VENV_PY, "-m", "pip", "install", "-r", os.path.join(BASE_DIR, "requirements.txt")])


    # -----------------------------------
    # 3. Instalar Chromium para Playwright
    # -----------------------------------
    print("Instalando Chromium para Playwright...")
    subprocess.call([VENV_PY, "-m", "playwright", "install", "chromium"])


    # -----------------------------------
    # 4. Migraciones
    # -----------------------------------
    print("Creando migraciones...")
    subprocess.call([VENV_PY, "manage.py", "makemigrations", "app"])

    print("Aplicando migraciones...")
    subprocess.call([VENV_PY, "manage.py", "migrate"])


    # -----------------------------------
    # 5. Fixture inicial (opcional)
    # -----------------------------------
    fixture_path = os.path.join(BASE_DIR, "app", "fixtures", "initial_data.json")
    if os.path.exists(fixture_path):
        print("Cargando datos iniciales...")
        subprocess.call([VENV_PY, "manage.py", "loaddata", fixture_path])


# -----------------------------------
# 6. Datos externos
# -----------------------------------
print("Actualizando indicadores diarios...")
subprocess.call([VENV_PY, "manage.py", "actualizar_datos"])


# -----------------------------------
# 7. Levantar servidor Django (NO BLOQUEANTE)
# -----------------------------------
print("Iniciando servidor Django...")
server = subprocess.Popen([VENV_PY, "manage.py", "runserver", "--noreload"])


# -----------------------------------
# 8. Esperar un poco a que arranque
# -----------------------------------
time.sleep(2)

print("Abriendo navegador...")
if APP:
    subprocess.Popen([
        EDGE_PATH,
        "--app=http://127.0.0.1:8000/",
        "--new-window"
    ])
else:
    subprocess.Popen([
        EDGE_PATH,
        "http://127.0.0.1:8000/"
    ])

print("Servidor iniciado.")
sys.exit(0)
