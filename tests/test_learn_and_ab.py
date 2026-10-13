import json
import os
import subprocess
import sys
import unittest

from helpers import REPO, SCRIPTS, git, ledger, rm, scratch_repo, sh, write_config

APP = "def add(a, b):\n    return a - b\n"
TEST = "import unittest\nfrom app import add\n\nclass T(unittest.TestCase):\n    def test_zero(self):\n        self.assertEqual(add(0, 0), 0)\n"
LESSON = "# Lesson: add must actually add\nimport unittest\nfrom app import add\n\nclass L(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n"
CLI = [sys.executable, os.path.join(SCRIPTS, "golden_path.py")]


class LearnTests(unittest.TestCase):
    def setUp(self):
        self.d = scratch_repo({"app.py": APP, "tests/__init__.py": "", "tests/test_app.py": TEST,
                               "tests/learned/__init__.py": ""})
        write_config(self.d, check="python3 -m unittest discover -s tests -t .",
                     test_file_command="python3 -m unittest {file}", learned_tests_dir="tests/learned")
        self.p = os.path.join(self.d, ".golden-path", "proposals", "adds")
        os.makedirs(self.p)
        open(os.path.join(self.p, "test_adds.py"), "w").write(LESSON)

    def tearDown(self):
        git(self.d, "worktree", "prune")
        rm(self.d)

    def cli(self, *a):
        return sh(CLI + list(a), self.d)

    def test_not_earned_when_it_does_not_fail_on_base(self):
        open(os.path.join(self.d, "app.py"), "w").write("def add(a, b):\n    return a + b\n")
        git(self.d, "commit", "-qam", "fix")  # base now already correct -> lesson does not discriminate
        r = self.cli("learn", "validate", "adds")
        self.assertEqual(r.returncode, 1)
        v = json.loads(r.stdout)
        self.assertFalse(v["fails_on_base"])
        self.assertFalse(v["earned"])
        self.assertNotEqual(self.cli("learn", "accept", "adds").returncode, 0)

    def test_earned_and_accepted_as_learned_test(self):
        open(os.path.join(self.d, "app.py"), "w").write("def add(a, b):\n    return a + b\n")  # fix, uncommitted
        v = json.loads(self.cli("learn", "validate", "adds").stdout)
        self.assertTrue(v["earned"], v)
        self.assertTrue(os.path.exists(os.path.join(self.p, "proposal.patch")))
        r = self.cli("learn", "accept", "adds")
        self.assertEqual(r.returncode, 0, r.stderr)
        out = json.loads(r.stdout)
        self.assertEqual(out["lesson"], "L001")
        path = os.path.join(self.d, out["path"])
        self.assertIn("earned against base", open(path).read())
        # the learned test is discovered by the adopter's normal test run
        t = sh("python3 -m unittest discover -s tests -t . -v", self.d)
        self.assertIn("test_add", t.stderr)
        self.assertEqual(t.returncode, 0)
        self.assertIn("lesson_accepted", [r["event"] for r in ledger(self.d)])


class DemoEndToEndTests(unittest.TestCase):
    """Uses the RIGGED simulator: proves plumbing and measurement only, not any effect."""

    @classmethod
    def setUpClass(cls):
        import tempfile
        cls.base = tempfile.mkdtemp(prefix="gp-demo-")
        cls.d = os.path.join(cls.base, "demo")
        r = sh(["bash", os.path.join(REPO, "examples", "make-demo.sh"), cls.d, "--with-reviewer"], REPO)
        assert r.returncode == 0, r.stdout + r.stderr
        cls.make_out = r.stdout

    @classmethod
    def tearDownClass(cls):
        rm(cls.base)

    def cli(self, *a):
        return sh(CLI[:1] + [os.path.join(self.d, ".github/hooks/golden-path/golden_path.py"), *a], self.d)

    def test_1_baseline(self):
        self.assertIn("frozen tasks verified", self.make_out)
        self.assertEqual(self.cli("check").returncode, 0)
        for t in ("T01", "T02", "T03", "T04"):
            r = sh(f"python3 -m unittest tasks/acceptance/test_{t}.py", self.d)
            self.assertNotEqual(r.returncode, 0, f"{t} acceptance must be red before the task is done")

    def test_2_loop_learn_ab(self):
        env = dict(os.environ, GOLDEN_PATH_SESSION="demo-1")
        subprocess.run([sys.executable, "simulator/sim_agent.py", "T01"], cwd=self.d, env=env, check=True)
        ev = [r["event"] for r in ledger(self.d)]
        self.assertEqual(ev[:3], ["method_loaded", "gate_red", "gate_green"])
        self.assertEqual(sh("python3 -m unittest tasks/acceptance/test_T01.py", self.d).returncode, 0)
        acc = self.cli("learn", "accept", "round-after-discount")
        self.assertEqual(acc.returncode, 0, acc.stdout + acc.stderr)
        sh("git checkout -q -- invoice && rm -f tests/test_t01_discount.py", self.d)
        git(self.d, "add", "-A")
        git(self.d, "commit", "-qm", "accept L001")
        r = self.cli("ab", "--tasks", "T01", "--reps", "2", "--per-lesson",
                     "--agent-cmd", "python3 simulator/sim_agent.py {task}")
        self.assertEqual(r.returncode, 0, r.stderr)
        rows = json.loads(r.stdout)
        self.assertEqual(len(rows), 6)
        self.assertTrue(all(x["gate_observed"] and x["method_loaded"] and x["accepted"] for x in rows))
        rep = json.loads(self.cli("report", "--json").stdout)
        self.assertEqual(rep["ab_by_arm"]["on"]["mean_iterations_to_green"], 1)
        self.assertEqual(rep["ab_by_arm"]["off"]["mean_iterations_to_green"], 2)
        self.assertEqual(rep["lesson_benefit"]["L001"]["iterations_saved"], 1)  # rigged by design
        # held-out acceptance tests were not present while the "agent" ran
        self.assertTrue(os.path.exists(os.path.join(self.d, "tasks/acceptance/test_T01.py")))
        self.assertTrue(os.path.exists(os.path.join(self.d, ".github/agents/golden-path-reviewer.agent.md")))


if __name__ == "__main__":
    unittest.main()
