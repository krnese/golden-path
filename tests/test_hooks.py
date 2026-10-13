import os
import unittest

from helpers import hook, ledger, rm, scratch_repo, write_config

PASS = "exit 0"
FAIL = "echo 'FAIL: test_x (t.T)'; exit 1"


class GateTests(unittest.TestCase):
    def setUp(self):
        self.d = scratch_repo({"tests/test_a.py": "def test_a():\n    assert 1\n"})

    def tearDown(self):
        rm(self.d)

    def stop(self, sid="s1", **kw):
        return hook(self.d, "gate.py", {"sessionId": sid, "cwd": self.d, "stopReason": "end_turn",
                                        "stop_hook_active": False, **kw})

    def test_blocks_while_red_then_allows_with_learning_prompt_once(self):
        write_config(self.d, check=FAIL, max_blocks=5)
        out = self.stop()
        self.assertEqual(out["decision"], "block")
        self.assertIn("RED", out["reason"])
        self.assertIn("FAIL: test_x", out["reason"])
        write_config(self.d, check=PASS)
        out = self.stop()
        self.assertEqual(out["decision"], "block")
        self.assertIn("Learning step", out["reason"])
        self.assertEqual(self.stop(), {})
        ev = [r["event"] for r in ledger(self.d)]
        self.assertEqual(ev, ["gate_red", "gate_green", "gate_green"])
        red = ledger(self.d)[0]
        self.assertEqual(red["failed_tests"], ["test_x"])
        self.assertTrue(red["head_sha"] and red["diff_hash"])

    def test_green_first_time_allows_without_learning(self):
        write_config(self.d, check=PASS)
        self.assertEqual(self.stop(), {})

    def test_self_limit_gives_up(self):
        write_config(self.d, check=FAIL, max_blocks=2)
        outs = [self.stop() for _ in range(3)]
        self.assertEqual([o.get("decision") for o in outs], ["block", "block", None])
        self.assertEqual(ledger(self.d)[-1]["event"], "gave_up")

    def test_missing_config_is_red(self):
        out = self.stop()
        self.assertEqual(out["decision"], "block")
        self.assertIn("No check command", out["reason"])

    def test_timeout_counts_as_red(self):
        write_config(self.d, check="sleep 3", check_timeout_sec=1)
        out = self.stop()
        self.assertIn("timed out", out["reason"])

    def test_snake_case_payload(self):
        write_config(self.d, check=PASS)
        out = hook(self.d, "gate.py", {"hook_event_name": "Stop", "session_id": "vs1", "cwd": self.d,
                                       "stop_hook_active": False})
        self.assertEqual(out, {})
        self.assertEqual(ledger(self.d)[0]["session"], "vs1")

    def test_weakening_blocks_even_if_check_green(self):
        write_config(self.d, check=PASS, protected=["tests/**"])
        with open(os.path.join(self.d, "tests/test_a.py"), "w") as f:
            f.write("# emptied\n")
        out = self.stop()
        self.assertEqual(out["decision"], "block")
        self.assertIn("test-integrity", out["reason"])


class SessionStartTests(unittest.TestCase):
    def test_records_method_loaded_and_lessons(self):
        d = scratch_repo({"tests/learned/test_L001_x.py": "# Lesson: round once\n"})
        try:
            write_config(d, check=PASS)
            out = hook(d, "session_start.py", {"sessionId": "s", "cwd": d, "source": "new"})
            self.assertIn("Golden Path is active", out["additionalContext"])
            self.assertIn("L001: round once", out["additionalContext"])
            rec = ledger(d)[0]
            self.assertEqual(rec["event"], "method_loaded")
            self.assertTrue(rec["skill_found"])  # falls back to the plugin's own skill
            self.assertTrue(rec["skill_hash"] and rec["method_hash"])
            out = hook(d, "session_start.py", {"sessionId": "s2", "cwd": d}, env={"GOLDEN_PATH_LESSONS": "off"})
            self.assertNotIn("L001", out["additionalContext"])
        finally:
            rm(d)


class ReviewerUsageTests(unittest.TestCase):
    def test_only_reviewer_is_recorded_and_never_blocks(self):
        d = scratch_repo()
        try:
            self.assertEqual(hook(d, "reviewer_usage.py", {"agentName": "explore", "cwd": d}), {})
            self.assertEqual(ledger(d), [])
            import subprocess, sys, json
            from helpers import SCRIPTS
            for phase in ("start", "stop"):
                p = subprocess.run([sys.executable, os.path.join(SCRIPTS, "reviewer_usage.py"), phase],
                                   input=json.dumps({"agentName": "golden-path-reviewer", "cwd": d, "response": "ok"}),
                                   capture_output=True, text=True, cwd=d)
                self.assertEqual(json.loads(p.stdout), {})
            self.assertEqual([r["event"] for r in ledger(d)], ["reviewer_start", "reviewer_stop"])
        finally:
            rm(d)


if __name__ == "__main__":
    unittest.main()
