"""Anti-test-weakening check (deterministic, language-agnostic heuristics).

Compares protected test files in the working tree with the session's base commit.
Fails when a protected test file is deleted, or its test count / assertion count drops,
or new skip/only markers appear. Heuristic by design: it catches common weakening, not all.
Adding new tests or files is always allowed.
"""
import fnmatch
import os
import re
import subprocess

TEST_RE = re.compile(r"^\s*(def\s+test\w*|async\s+def\s+test\w*|(it|test)\s*\(|func\s+Test\w+|\[(Fact|Test|TestMethod|Theory)\])", re.M)
ASSERT_RE = re.compile(r"\b(assert\w*|expect\s*\(|Assert\.\w+|self\.fail|pytest\.raises|t\.(Error|Fatal)\w*)")
SKIP_RE = re.compile(r"(@unittest\.skip|@pytest\.mark\.(skip|xfail)|\b(it|describe|test)\.(skip|only)\b|\bx(it|describe)\s*\(|expectedFailure|t\.Skip|\[Ignore\]|Skip\s*=)")


def matches(rel, patterns):
    rel = rel.replace(os.sep, "/")
    for p in patterns:
        if p.endswith("/**") and (rel == p[:-3] or rel.startswith(p[:-2])):
            return True
        if fnmatch.fnmatch(rel, p):
            return True
    return False


def counts(text):
    return (len(TEST_RE.findall(text)), len(ASSERT_RE.findall(text)), len(SKIP_RE.findall(text)))


def _git(root, *args):
    r = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True)
    return r.returncode, r.stdout


def check(root, patterns, base="HEAD"):
    """Return list of human-readable violations (empty == ok)."""
    code, out = _git(root, "ls-tree", "-r", "--name-only", base)
    if code != 0:
        return []  # no base commit (fresh repo): nothing to compare
    violations = []
    for rel in out.splitlines():
        if not matches(rel, patterns):
            continue
        code, before = _git(root, "show", f"{base}:{rel}")
        if code != 0:
            continue
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            violations.append(f"{rel}: protected test file deleted")
            continue
        with open(path, encoding="utf-8", errors="replace") as f:
            after = f.read()
        bt, ba, bs = counts(before)
        at, aa, as_ = counts(after)
        if at < bt:
            violations.append(f"{rel}: test count dropped {bt} -> {at}")
        if aa < ba:
            violations.append(f"{rel}: assertion count dropped {ba} -> {aa}")
        if as_ > bs:
            violations.append(f"{rel}: new skip/only/xfail marker(s) {bs} -> {as_}")
    return violations
