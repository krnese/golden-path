import json
import os
import shutil
import subprocess
import sys
import tempfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(REPO, "plugin")
SCRIPTS = os.path.join(KIT, "scripts")
INSTALL = os.path.join(KIT, "install.py")


def sh(cmd, cwd, **kw):
    return subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), capture_output=True, text=True, **kw)


def git(cwd, *args):
    return sh(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args], cwd)


def scratch_repo(files=None, commit=True):
    d = tempfile.mkdtemp(prefix="gp-test-")
    git(d, "init", "-q")
    for rel, content in (files or {}).items():
        p = os.path.join(d, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w") as f:
            f.write(content)
    if commit:
        git(d, "add", "-A")
        git(d, "commit", "-qm", "base", "--allow-empty")
    return d


def write_config(d, **cfg):
    os.makedirs(os.path.join(d, ".golden-path"), exist_ok=True)
    with open(os.path.join(d, ".golden-path", "config.json"), "w") as f:
        json.dump(cfg, f)


GATE = os.path.join(SCRIPTS, "gate.py")
CMD = {"gate.py": ["stop"], "session_start.py": ["start"], "guard.py": ["guard"], "reviewer_usage.py": ["subagent", "start"]}


def hook(d, script, payload, env=None):
    """Run the one hook script with the subcommand for this hook (names kept readable in tests)."""
    p = subprocess.run([sys.executable, GATE, *CMD.get(script, script.split())], input=json.dumps(payload),
                       capture_output=True, text=True, cwd=d, env=dict(os.environ, **(env or {})))
    assert p.returncode == 0, p.stderr
    return json.loads(p.stdout or "{}")


def ledger(d):
    p = os.path.join(d, ".golden-path", "ledger.jsonl")
    return [json.loads(l) for l in open(p)] if os.path.exists(p) else []


def rm(d):
    shutil.rmtree(d, ignore_errors=True)
