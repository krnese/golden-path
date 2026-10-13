import json
import os
import subprocess
import sys
import unittest

from helpers import REPO, git, ledger, rm, scratch_repo, sh, write_config

APP = "def add(a, b):\n    return a - b\n"
TEST = "import unittest\nfrom app import add\n\nclass T(unittest.TestCase):\n    def test_zero(self):\n        self.assertEqual(add(0, 0), 0)\n"
LESSON = "# Lesson: add must actually add\nimport unittest\nfrom app import add\n\nclass L(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n"
CLI = [sys.executable, os.path.join(REPO, "research", "golden_path_research.py")]
SIM = os.path.join(REPO, "research", "sim", "sim_agent.py")


class LearnTests(unittest.TestCase):
    def setUp(self):
        self.d = scratch_repo({"app.py": APP, "tests/__init__.py": "", "tests/test_app.py": TEST,
                               "tests/learned/__init__.py": ""})
        write_config(self.d, check="python3 -m unittest discover -s tests -t .",
                     test_file_command="python3 -m unittest {file}", learned_tests_dir="tests/learned", research={"enabled": True})
        self.p = os.path.join(self.d, ".golden-path", "proposals", "adds")
        os.makedirs(self.p)
        open(os.path.join(self.p, "test_adds.py"), "w").write(LESSON)

    def tearDown(self):
        git(self.d, "worktree", "prune")
        rm(self.d)

    def cli(self, *a):
        return sh(CLI + list(a), self.d)

    def test_refuses_unless_research_enabled(self):
        write_config(self.d, check="true")
        r = self.cli("learn", "validate", "adds")
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("research", r.stdout + r.stderr)
        r = self.cli("summary")
        self.assertNotEqual(r.returncode, 0)

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
    """Level 2 demo plus the scripted refusal scenario, then level 3 research tools with the RIGGED
    simulator. Proves plumbing and measurement only, never an effect."""

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
        git(cls.d, "worktree", "prune")
        rm(cls.base)

    def gate(self, *a):
        return sh([sys.executable, os.path.join(self.d, ".github/hooks/golden-path/gate.py"), *a], self.d)

    def research(self, *a):
        return sh(CLI + list(a), self.d)

    def test_1_baseline(self):
        self.assertIn("frozen tasks and acceptance examples verified", self.make_out)
        py = sorted(os.path.relpath(os.path.join(dp, f), self.d) for dp, _, fs in os.walk(self.d)
                    if ".git" not in dp.split(os.sep) for f in fs if f.endswith(".py"))
        self.assertEqual(py, [".github/hooks/golden-path/gate.py", "acceptance/test_acceptance.py", "invoice.py",
                              "simulator/refusal_scenario.py", "tests/test_invoice.py"])
        r = self.gate("check")  # T01 acceptance is enabled but not implemented yet: honestly red
        self.assertNotEqual(r.returncode, 0)
        res = {x["name"]: x["ok"] for x in json.loads(r.stdout)["results"]}
        self.assertEqual(res, {"check": True, "acceptance": False, "test-integrity": True, "acceptance-integrity": True})
        for t in ("T01", "T02", "T03", "T04"):
            self.assertNotEqual(sh(f"python3 -m unittest acceptance.test_acceptance.{t}", self.d).returncode, 0, t)
        cfg = json.load(open(os.path.join(self.d, ".golden-path/config.json")))
        self.assertEqual(cfg["acceptance"]["paths"], ["acceptance/**"])
        self.assertFalse(cfg["research"]["enabled"])
        self.assertFalse(os.path.exists(os.path.join(self.d, ".github/agents/golden-path.agent.md")))
        self.assertNotEqual(self.research("summary").returncode, 0)  # research is opt-in

    def test_2_refusal_scenario(self):
        env = dict(os.environ, GOLDEN_PATH_SESSION="refusal-1")
        r = subprocess.run([sys.executable, "simulator/refusal_scenario.py"], cwd=self.d, env=env,
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("RESULT: as expected", r.stdout)
        ev = [x["event"] for x in ledger(self.d) if x.get("session") == "refusal-1"]
        self.assertEqual(ev.count("guard_deny"), 2)
        self.assertIn("acceptance_change_attempt", ev)
        self.assertEqual(sh("git status --porcelain acceptance", self.d).stdout.strip(), "")

    def test_3_research_gp_vs_plain_and_lessons(self):
        p = os.path.join(self.d, ".golden-path/config.json")
        cfg = json.load(open(p))
        cfg["research"] = {"enabled": True}
        cfg["ab"] = {"tasks_dir": "tasks"}
        json.dump(cfg, open(p, "w"))
        git(self.d, "commit", "-qam", "researcher opts in to research tools")
        env = dict(os.environ, GOLDEN_PATH_SESSION="demo-1")
        subprocess.run([sys.executable, SIM, "T01"], cwd=self.d, env=env, check=True)
        ev = [r["event"] for r in ledger(self.d) if r.get("session") == "demo-1"]
        self.assertEqual(ev, ["method_files_present", "gate_red", "gate_green"])
        acc = self.research("learn", "accept", "round-after-discount")
        self.assertEqual(acc.returncode, 0, acc.stdout + acc.stderr)
        sh("git checkout -q -- invoice.py && rm -f tests/test_t01_discount.py", self.d)
        git(self.d, "add", "-A")
        git(self.d, "commit", "-qm", "accept L001")
        r = self.research("ab", "--tasks", "T01", "--reps", "2", "--lesson-arms", "--agent-cmd", f"python3 {SIM} {{task}}")
        self.assertEqual(r.returncode, 0, r.stderr)
        rows = json.loads(r.stdout)
        self.assertEqual(sorted({x["arm"] for x in rows}), ["golden-path", "lessons-off", "plain"])
        for x in rows:
            self.assertFalse(x["acceptance_tests_changed"])
            self.assertEqual(x["outcome"], "NO-GATE" if x["arm"] == "plain" else "PASSED")
            self.assertEqual(x["method_files_present"], x["arm"] != "plain")
        s = json.loads(self.research("summary", "--json").stdout)
        ab = s["ab"]
        # rigged by design: the plain sim stops after its buggy first attempt
        self.assertEqual(ab["by_arm"]["plain"]["acceptance_rate"], 0)
        self.assertEqual(ab["by_arm"]["golden-path"]["acceptance_rate"], 1)
        self.assertEqual(ab["primary_golden_path_vs_plain"]["acceptance_rate_delta"], 1)
        self.assertEqual(ab["secondary_lessons"]["lessons-off"]["iterations_saved"], 1)
        self.assertIn("PASSED", s["ledger"]["outcomes"])


class LedgerReportTests(unittest.TestCase):
    def test_failed_and_unverified_are_surfaced(self):
        d = scratch_repo({"tests/test_a.py": "def test_a():\n    assert 1\n"})
        try:
            write_config(d, check="exit 1", max_blocks=1, research={"enabled": True},
                         acceptance={"owner": "Finance: Ingrid"})
            from helpers import hook
            hook(d, "session_start.py", {"sessionId": "f", "cwd": d})
            for _ in range(2):
                hook(d, "gate.py", {"sessionId": "f", "cwd": d})
            hook(d, "session_start.py", {"sessionId": "timeout", "cwd": d})  # stop hook never recorded
            r = sh(CLI + ["summary", "--json"], d)
            s = json.loads(r.stdout)["ledger"]
            self.assertEqual(s["outcomes"], {"PASSED": 0, "FAILED": 1, "RED": 0, "UNVERIFIED": 1})
            self.assertEqual(s["failed_sessions"][0]["escalated_to"], "Finance: Ingrid")
            text = sh(CLI + ["summary"], d).stdout
            self.assertIn("FAILED (escalated) 1", text)
            self.assertIn("UNVERIFIED (no gate record) 1", text)
        finally:
            rm(d)


if __name__ == "__main__":
    unittest.main()
