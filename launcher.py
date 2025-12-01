import subprocess
import os
import sys

BASE = os.path.dirname(os.path.abspath(sys.argv[0]))
SCRIPT = os.path.join(BASE, "start_app.py")

subprocess.call(["python", SCRIPT])