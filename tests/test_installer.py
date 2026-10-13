import json
import os
import unittest

from helpers import INSTALL, rm, scratch_repo, sh

CHECK = "python3 -m unittest"


def install(d, *args):
    return sh(["python3", INSTALL, "--target", d, *args], d)


def tree(d):
    out = {}
    for dp, dns, fns in os.walk(d):
        dns[:] = [x for x in dns if x != ".git"]
        for fn in fns:
            p = os.path.join(dp, fn)
            out[os.path.relpath(p, d)] = open(p, encoding="utf-8").read()
    return out


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.d = scratch_repo({"README.md": "hi\n"})

    def tearDown(self):
        rm(self.d)

    def test_fresh_install_layout_and_namespacing(self):
        r = install(self.d, "--check", CHECK)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        files = tree(self.d)
        written = [p for p in files if p != "README.md"]
        for p in written:
            self.assertTrue("golden-path" in p or p in (".github/copilot-instructions.md", ".gitignore"), p)
        self.assertIn(".github/hooks/golden-path-loop.json", files)
        self.assertIn(".github/skills/golden-path/SKILL.md", files)
        self.assertNotIn(".github/agents/golden-path-reviewer.agent.md", files)
        self.assertNotIn("AGENTS.md", files)  # only appended if adopter already has one
        hooks = json.loads(files[".github/hooks/golden-path-loop.json"])
        self.assertEqual(hooks["version"], 1)
        self.assertNotIn("PLUGIN_ROOT", files[".github/hooks/golden-path-loop.json"])
        self.assertEqual(json.loads(files[".golden-path/config.json"])["check"], CHECK)
        skills = [p for p in files if p.endswith("SKILL.md")]
        self.assertEqual(skills, [".github/skills/golden-path/SKILL.md"])
        agents = [p for p in files if p.endswith(".agent.md")]
        self.assertEqual(agents, [".github/agents/golden-path.agent.md"])

    def test_idempotent(self):
        install(self.d, "--check", CHECK)
        before = tree(self.d)
        r = install(self.d)
        self.assertEqual(r.returncode, 0)
        self.assertIn("nothing changed", r.stdout)
        self.assertEqual(tree(self.d), before)

    def test_first_install_requires_check(self):
        r = install(self.d)
        self.assertEqual(r.returncode, 2)
        self.assertEqual(set(tree(self.d)), {"README.md"})

    def test_appends_to_existing_adopter_files_without_overwriting(self):
        for rel, body in {".github/copilot-instructions.md": "# Team rules\nUse tabs.\n",
                          "AGENTS.md": "# Agents\nBe nice.\n", ".gitignore": "node_modules/\n"}.items():
            p = os.path.join(self.d, rel)
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "w").write(body)
        install(self.d, "--check", CHECK)
        f = tree(self.d)
        self.assertTrue(f[".github/copilot-instructions.md"].startswith("# Team rules\nUse tabs.\n"))
        self.assertIn("<!-- golden-path:begin -->", f["AGENTS.md"])
        self.assertTrue(f[".gitignore"].startswith("node_modules/\n"))
        r = install(self.d, "--uninstall")
        self.assertEqual(r.returncode, 0, r.stdout)
        f = tree(self.d)
        self.assertEqual(f[".github/copilot-instructions.md"], "# Team rules\nUse tabs.\n")
        self.assertEqual(f["AGENTS.md"], "# Agents\nBe nice.\n")
        self.assertEqual(f[".gitignore"], "node_modules/\n")

    def test_refuses_on_conflicting_file_and_writes_nothing(self):
        p = os.path.join(self.d, ".github/skills/golden-path/SKILL.md")
        os.makedirs(os.path.dirname(p))
        open(p, "w").write("someone else's skill\n")
        before = tree(self.d)
        r = install(self.d, "--check", CHECK)
        self.assertEqual(r.returncode, 2)
        self.assertIn("REFUSING", r.stdout)
        self.assertEqual(tree(self.d), before)

    def test_refuses_on_existing_ci_file(self):
        p = os.path.join(self.d, ".github/workflows/golden-path-check.yml")
        os.makedirs(os.path.dirname(p))
        open(p, "w").write("name: mine\n")
        self.assertEqual(install(self.d, "--check", CHECK, "--with-ci").returncode, 2)

    def test_refuses_on_malformed_block(self):
        open(os.path.join(self.d, "AGENTS.md"), "w").write("<!-- golden-path:begin -->\nno end\n")
        self.assertEqual(install(self.d, "--check", CHECK).returncode, 2)

    def test_existing_config_never_overwritten(self):
        install(self.d, "--check", CHECK)
        cfg = os.path.join(self.d, ".golden-path/config.json")
        open(cfg, "w").write('{"check": "make test"}\n')
        self.assertEqual(install(self.d, "--check", "other").returncode, 0)
        self.assertEqual(open(cfg).read(), '{"check": "make test"}\n')

    def test_uninstall_refuses_modified_then_force(self):
        install(self.d, "--check", CHECK, "--with-reviewer", "--with-ci")
        f = tree(self.d)
        self.assertIn(".github/agents/golden-path-reviewer.agent.md", f)
        self.assertIn(".github/workflows/golden-path-check.yml", f)
        p = os.path.join(self.d, ".github/hooks/golden-path/gate.py")
        open(p, "a").write("# local edit\n")
        self.assertEqual(install(self.d, "--uninstall").returncode, 2)
        self.assertEqual(install(self.d, "--uninstall", "--force", "--purge").returncode, 0)
        self.assertEqual(set(tree(self.d)), {"README.md"})

    def test_modified_kit_file_blocks_upgrade(self):
        install(self.d, "--check", CHECK)
        p = os.path.join(self.d, ".github/skills/golden-path/SKILL.md")
        open(p, "a").write("local tweak\n")
        before = tree(self.d)
        # an unchanged kit + modified file: nothing to write for that file, but manifest hash
        # mismatch must not be silently "updated"; re-install reports conflict only if content differs
        r = install(self.d)
        self.assertEqual(r.returncode, 2)
        self.assertEqual(tree(self.d), before)

    def test_reinstall_preserves_optional_components(self):
        install(self.d, "--check", CHECK, "--with-reviewer")
        r = install(self.d)
        self.assertIn("nothing changed", r.stdout)
        self.assertIn(".github/agents/golden-path-reviewer.agent.md", tree(self.d))


if __name__ == "__main__":
    unittest.main()
