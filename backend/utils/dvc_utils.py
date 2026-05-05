import os
import subprocess
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))

def run_dvc_add(path: str):
    abs_path = os.path.join(PROJECT_ROOT, path)
    print(f"[DVC] Tracking {path}...")
    subprocess.run(['dvc', 'add', abs_path], check=True)
    dvc_file = abs_path + '.dvc' if os.path.isfile(abs_path) else os.path.join(abs_path, '.gitignore')
    # Add .dvc file(s) and .gitignore
    subprocess.run(['git', 'add', f"{abs_path}.dvc", os.path.join(PROJECT_ROOT, '.gitignore')], check=False)
    try:
        subprocess.run(['git', 'commit', '-m', f"DVC update: {path}"], check=True)
    except subprocess.CalledProcessError:
        print(f"[DVC] No changes to commit for {path}.")

def run_dvc_commit():
    try:
        subprocess.run(['git', 'commit', '-m', 'DVC commit'], check=True)
    except subprocess.CalledProcessError:
        print("[DVC] No changes to commit.")

def run_dvc_repro():
    subprocess.run(['dvc', 'repro'], check=True)
