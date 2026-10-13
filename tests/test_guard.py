import os
import unittest

from helpers import hook, rm, scratch_repo, write_config


class GuardTests(unittest.TestCase):
    def setUp(self):
        self.d = scratch_repo({"tests/test_a.py": "def test_a():\n    assert 1\n", "src/a.py": "x=1\n"})
        write_config(self.d, check="exit 0", protected=["tests/**"])

    def tearDown(self):
        rm(self.d)

    def g(self, tool, args):
        return hook(self.d, "guard.py", {"sessionId": "s", "cwd": self.d, "toolName": tool, "toolArgs": args})

    def test_edit_existing_test_asks(self):
        self.assertEqual(self.g("edit", {"path": "tests/test_a.py"})["permissionDecision"], "ask")

    def test_new_test_file_allowed(self):
        self.assertEqual(self.g("create", {"path": "tests/test_new.py"}), {})

    def test_source_edit_allowed(self):
        self.assertEqual(self.g("edit", {"path": os.path.join(self.d, "src/a.py")}), {})

    def test_kit_files_denied(self):
        for p in (".github/hooks/golden-path-loop.json", ".github/hooks/golden-path/gate.py", ".golden-path/config.json"):
            self.assertEqual(self.g("edit", {"path": p})["permissionDecision"], "deny", p)

    def test_shell_delete_of_tests_denied(self):
        for cmd in ("rm -rf tests", "git rm tests/test_a.py", "echo x > tests/test_a.py", "sed -i s/assert/#/ tests/test_a.py"):
            self.assertEqual(self.g("bash", {"command": cmd})["permissionDecision"], "deny", cmd)

    def test_shell_running_tests_allowed(self):
        for cmd in ("python3 -m unittest discover -s tests", "pytest tests -q > out.log", "npm test"):
            self.assertEqual(self.g("bash", {"command": cmd}), {}, cmd)

    def test_no_verify_denied(self):
        self.assertEqual(self.g("bash", {"command": "git commit --no-verify -m x"})["permissionDecision"], "deny")

    def test_vscode_payload_and_garbage_never_crash(self):
        out = hook(self.d, "guard.py", {"hook_event_name": "PreToolUse", "tool_name": "Edit",
                                        "tool_input": {"file_path": "tests/test_a.py"}, "cwd": self.d})
        self.assertEqual(out["permissionDecision"], "ask")
        self.assertEqual(hook(self.d, "guard.py", {"toolName": "bash", "toolArgs": "not json", "cwd": self.d}), {})


if __name__ == "__main__":
    unittest.main()
