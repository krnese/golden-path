"""Golden Path kit tests: plugin format, installer levels, the one hook script (gate, guard, session
record), protected acceptance tests and test-integrity heuristics. Python stdlib only.

Format sources:
https://code.visualstudio.com/docs/agent-customization/agent-plugins
https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md
https://docs.github.com/en/copilot/reference/hooks-reference
"""
import json
import os
import re
import sys
import unittest

from helpers import INSTALL, KIT, SCRIPTS, git, hook, ledger, rm, scratch_repo, sh, write_config

sys.path.insert(0, SCRIPTS)
import gate  # noqa: E402

# ===== plugin_format =====
DOC_EVENTS = {"agentStop", "errorOccurred", "notification", "permissionRequest", "postToolUse",
              "postToolUseFailure", "preCompact", "preToolUse", "sessionEnd", "sessionStart",
              "subagentStart", "subagentStop", "userPromptSubmitted", "userPromptTransformed"}
ENTRY_FIELDS = {"type", "bash", "powershell", "command", "cwd", "env", "timeoutSec", "timeout", "matcher", "exec", "args"}


def frontmatter(path):
    text = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    assert m, path
    return dict(re.findall(r"^(\w[\w-]*):\s*(.+)$", m.group(1), re.M))


class PluginFormatTests(unittest.TestCase):
    def test_manifest(self):
        m = json.load(open(os.path.join(KIT, "plugin.json")))
        self.assertEqual(m["$schema"], "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json")
        self.assertRegex(m["name"], r"^[a-z0-9.-]+$")
        allowed = {"$schema", "name", "version", "description", "author", "homepage", "repository",
                   "license", "keywords", "extensions"}
        self.assertLessEqual(set(m), allowed)

    def test_exactly_one_skill_named_like_its_dir(self):
        skills = os.listdir(os.path.join(KIT, "skills"))
        self.assertEqual(skills, ["golden-path"])
        fm = frontmatter(os.path.join(KIT, "skills", "golden-path", "SKILL.md"))
        self.assertEqual(fm["name"], "golden-path")
        self.assertTrue(fm["description"])
        link = os.path.join(KIT, "skills", "golden-path", "references", "METHOD.md")
        self.assertTrue(os.path.exists(link))

    def test_one_primary_agent_reviewer_is_opt_in(self):
        # works with Copilot's default agent: no agent is shipped as active
        self.assertFalse(os.path.exists(os.path.join(KIT, "com.github.copilot", "agents")))
        self.assertEqual(sorted(os.listdir(os.path.join(KIT, "optional", "agents"))),
                         ["golden-path-reviewer.agent.md", "golden-path.agent.md"])
        fm = frontmatter(os.path.join(KIT, "optional", "agents", "golden-path-reviewer.agent.md"))
        self.assertEqual(fm["name"], "golden-path-reviewer")
        self.assertNotIn("edit", fm.get("tools", ""))

    def test_one_hook_script_and_no_research_code_in_plugin(self):
        self.assertEqual([f for f in os.listdir(os.path.join(KIT, "scripts")) if f != "__pycache__"], ["gate.py"])
        py = [os.path.join(dp, f) for dp, _, fs in os.walk(KIT) for f in fs if f.endswith(".py")]
        self.assertEqual(sorted(os.path.relpath(p, KIT) for p in py), ["install.py", os.path.join("scripts", "gate.py")])

    def test_skill_is_short(self):
        with open(os.path.join(KIT, "skills", "golden-path", "SKILL.md")) as f:
            self.assertLessEqual(len(f.read().splitlines()), 40)

    def test_hooks_json_uses_documented_schema(self):
        h = json.load(open(os.path.join(KIT, "com.github.copilot", "hooks", "hooks.json")))
        self.assertEqual(h["version"], 1)
        self.assertLessEqual(set(h["hooks"]), DOC_EVENTS)
        for ev, entries in h["hooks"].items():
            for e in entries:
                self.assertLessEqual(set(e), ENTRY_FIELDS, ev)
                self.assertEqual(e["type"], "command")
                self.assertLess(e["timeoutSec"], 300)
                script = re.search(r"scripts/(\w+\.py)", e["bash"]).group(1)
                self.assertTrue(os.path.exists(os.path.join(KIT, "scripts", script)), script)

    def test_no_mcp_json_needed(self):
        # Agent Plugins 1.0: mcp.json, if present, MUST have $schema + mcpServers. We ship none.
        self.assertFalse(os.path.exists(os.path.join(KIT, "mcp.json")))


# ===== installer =====
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
        self.assertEqual([p for p in files if p.endswith(".agent.md")], [])  # default agent
        cfg = json.loads(files[".golden-path/config.json"])
        self.assertEqual(cfg["acceptance"]["paths"], [])
        self.assertFalse(cfg["research"]["enabled"])

    def test_level2_installs_exactly_one_script(self):
        install(self.d, "--check", CHECK)
        self.assertEqual([p for p in tree(self.d) if p.endswith(".py")], [".github/hooks/golden-path/gate.py"])

    def test_level1_is_method_only_zero_code(self):
        r = install(self.d, "--level", "1")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        files = tree(self.d)
        self.assertIn(".github/skills/golden-path/SKILL.md", files)
        self.assertEqual([p for p in files if p.endswith((".py", ".json")) and "manifest" not in p], [])
        self.assertNotIn(".golden-path/config.json", files)
        self.assertNotIn(".gitignore", files)
        self.assertIn("golden-path", files[".github/copilot-instructions.md"])
        r = install(self.d, "--level", "2", "--check", CHECK)  # upgrade 1 -> 2 is allowed
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn(".github/hooks/golden-path/gate.py", tree(self.d))
        self.assertEqual(install(self.d, "--level", "1").returncode, 2)  # no silent downgrade

    def test_level3_enables_research_but_copies_no_research_code(self):
        r = install(self.d, "--level", "3", "--check", CHECK)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        files = tree(self.d)
        self.assertTrue(json.loads(files[".golden-path/config.json"])["research"]["enabled"])
        self.assertFalse(any("research" in p for p in files))

    def test_agent_preset_and_acceptance_flags(self):
        r = install(self.d, "--check", CHECK, "--with-agent-preset", "--acceptance-path", "acceptance/**",
                    "--acceptance-path", "specs/*.feature", "--acceptance-owner", "Finance",
                    "--acceptance-command", "python3 acceptance/run.py")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        files = tree(self.d)
        self.assertIn(".github/agents/golden-path.agent.md", files)
        acc = json.loads(files[".golden-path/config.json"])["acceptance"]
        self.assertEqual(acc, {"paths": ["acceptance/**", "specs/*.feature"], "owner": "Finance",
                               "command": "python3 acceptance/run.py"})

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


# ===== hooks =====
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

    def test_blocks_while_red_then_allows_without_learning_by_default(self):
        write_config(self.d, check=FAIL, max_blocks=5)
        self.assertEqual(self.stop()["decision"], "block")
        write_config(self.d, check=PASS)
        self.assertEqual(self.stop(), {})
        self.assertEqual([r["event"] for r in ledger(self.d)], ["gate_red", "gate_green"])

    def test_green_first_time_allows_without_learning(self):
        write_config(self.d, check=PASS)
        self.assertEqual(self.stop(), {})

    def test_block_limit_is_recorded_as_failed_and_escalated_never_a_pass(self):
        write_config(self.d, check=FAIL, max_blocks=2, acceptance={"owner": "Finance: Ingrid"})
        outs = [self.stop() for _ in range(3)]
        self.assertEqual([o.get("decision") for o in outs], ["block", "block", None])
        self.assertIn("last block", outs[1]["reason"])
        last = ledger(self.d)[-1]
        self.assertEqual((last["event"], last["outcome"], last["ok"]), ("gave_up", "FAILED", False))
        self.assertEqual(last["escalated_to"], "Finance: Ingrid")
        self.assertNotIn("gate_green", [r["event"] for r in ledger(self.d)])
        st = json.load(open(os.path.join(self.d, ".golden-path/state/s1.json")))
        self.assertEqual(st["outcome"], "FAILED")

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
    def test_records_method_files_present_not_method_loaded(self):
        d = scratch_repo()
        try:
            write_config(d, check=PASS)
            out = hook(d, "session_start.py", {"sessionId": "s", "cwd": d, "source": "new"})
            self.assertIn("Golden Path is active", out["additionalContext"])
            rec = ledger(d)[0]
            self.assertEqual(rec["event"], "method_files_present")
            self.assertNotIn("method_loaded", json.dumps(ledger(d)))
            self.assertIn("does not show the agent read or followed", rec["note"])
            self.assertTrue(rec["skill_found"])  # falls back to the plugin's own skill
            self.assertTrue(rec["skill_hash"] and rec["method_hash"])
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
                p = subprocess.run([sys.executable, os.path.join(SCRIPTS, "gate.py"), "subagent", phase],
                                   input=json.dumps({"agentName": "golden-path-reviewer", "cwd": d, "response": "ok"}),
                                   capture_output=True, text=True, cwd=d)
                self.assertEqual(json.loads(p.stdout), {})
            self.assertEqual([r["event"] for r in ledger(d)], ["reviewer_start", "reviewer_stop"])
        finally:
            rm(d)


# ===== guard =====
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


# ===== acceptance =====
ACC = {"paths": ["acceptance/**"], "owner": "Finance: Ingrid", "command": None}


class AcceptanceGuardTests(unittest.TestCase):
    def setUp(self):
        self.d = scratch_repo({"acceptance/test_t01.py": "def test_x():\n    assert 1\n", "src/a.py": "x=1\n"})
        write_config(self.d, check="exit 0", acceptance=ACC)

    def tearDown(self):
        rm(self.d)

    def g(self, tool, args):
        return hook(self.d, "guard.py", {"sessionId": "s", "cwd": self.d, "toolName": tool, "toolArgs": args})

    def test_edit_create_delete_denied_with_owner(self):
        for tool, p in (("edit", "acceptance/test_t01.py"), ("create", "acceptance/test_new.py"),
                        ("edit", os.path.join(self.d, "acceptance/test_t01.py"))):
            out = self.g(tool, {"path": p})
            self.assertEqual(out["permissionDecision"], "deny", p)
            self.assertIn("Finance: Ingrid", out["permissionDecisionReason"])
            self.assertIn("DELEGATION CHANGE", out["permissionDecisionReason"])

    def test_shell_mutation_denied_but_running_allowed(self):
        for c in ("sed -i 's/1/0/' acceptance/test_t01.py", "rm acceptance/test_t01.py",
                  "echo x > acceptance/test_t01.py", "git checkout HEAD~1 -- acceptance/test_t01.py",
                  "git restore --source HEAD~1 acceptance/test_t01.py", "git restore --source=main acceptance/test_t01.py",
                  "git restore -s main acceptance/test_t01.py", "git restore acceptance/x.py; rm acceptance/test_t01.py"):
            self.assertEqual(self.g("bash", {"command": c}).get("permissionDecision"), "deny", c)
        for c in ("python3 -m unittest acceptance/test_t01.py", "cat acceptance/test_t01.py", "echo hi > out.txt",
                  "git restore acceptance/test_t01.py", "git checkout -- acceptance/test_t01.py"):
            self.assertEqual(self.g("bash", {"command": c}), {}, c)

    def test_source_edit_still_allowed(self):
        self.assertEqual(self.g("edit", {"path": "src/a.py"}), {})


class AcceptanceGateTests(unittest.TestCase):
    def setUp(self):
        self.d = scratch_repo({"acceptance/test_t01.py": "def test_x():\n    assert 1\n"})
        write_config(self.d, check="exit 0", acceptance=ACC)
        hook(self.d, "session_start.py", {"sessionId": "s", "cwd": self.d, "source": "new"})

    def tearDown(self):
        rm(self.d)

    def stop(self):
        return hook(self.d, "gate.py", {"sessionId": "s", "cwd": self.d, "stop_hook_active": False})

    def test_changed_acceptance_test_blocks_and_is_recorded(self):
        with open(os.path.join(self.d, "acceptance/test_t01.py"), "w") as f:
            f.write("def test_x():\n    pass\n")
        out = self.stop()
        self.assertEqual(out["decision"], "block")
        self.assertIn("acceptance-integrity", out["reason"])
        self.assertIn("DELEGATION CHANGE", out["reason"])
        self.assertIn("acceptance_change_attempt", [r["event"] for r in ledger(self.d)])

    def test_new_or_deleted_acceptance_file_blocks(self):
        open(os.path.join(self.d, "acceptance/test_extra.py"), "w").write("def test_y():\n    assert 1\n")
        self.assertEqual(self.stop()["decision"], "block")
        os.remove(os.path.join(self.d, "acceptance/test_extra.py"))
        os.remove(os.path.join(self.d, "acceptance/test_t01.py"))
        self.assertEqual(self.stop()["decision"], "block")

    def test_unchanged_is_green_and_command_runs(self):
        self.assertEqual(self.stop(), {})
        write_config(self.d, check="exit 0", acceptance=dict(ACC, command="exit 1"))
        out = self.stop()
        self.assertEqual(out["decision"], "block")
        self.assertIn("acceptance", out["reason"])

    def test_expert_committed_change_is_the_new_base(self):
        with open(os.path.join(self.d, "acceptance/test_t01.py"), "w") as f:
            f.write("def test_x():\n    assert 2\n")
        git(self.d, "commit", "-qam", "Ingrid approves revised example")
        hook(self.d, "session_start.py", {"sessionId": "s2", "cwd": self.d, "source": "new"})
        out = hook(self.d, "gate.py", {"sessionId": "s2", "cwd": self.d, "stop_hook_active": False})
        self.assertEqual(out, {})


# ===== integrity =====
PY = "import unittest\nclass T(unittest.TestCase):\n    def test_a(self):\n        self.assertEqual(1, 1)\n    def test_b(self):\n        self.assertTrue(True)\n"
JS = "test('a', () => { expect(1).toBe(1); });\nit('b', () => { expect(2).toBe(2); });\n"


class IntegrityTests(unittest.TestCase):
    def setUp(self):
        self.d = scratch_repo({"tests/test_a.py": PY, "tests/a.test.js": JS, "src/x.py": ""})

    def tearDown(self):
        rm(self.d)

    def w(self, rel, text):
        with open(os.path.join(self.d, rel), "w") as f:
            f.write(text)

    def v(self):
        return gate.test_integrity(self.d, ["tests/**"])

    def test_clean(self):
        self.assertEqual(self.v(), [])

    def test_adding_tests_ok(self):
        self.w("tests/test_a.py", PY + "    def test_c(self):\n        self.assertIn(1, [1])\n")
        self.assertEqual(self.v(), [])

    def test_removed_test_flagged(self):
        self.w("tests/test_a.py", PY.split("    def test_b")[0])
        self.assertTrue(any("test count dropped" in x for x in self.v()))

    def test_removed_assert_flagged(self):
        self.w("tests/test_a.py", PY.replace("self.assertTrue(True)", "pass"))
        self.assertTrue(any("assertion count dropped" in x for x in self.v()))

    def test_skip_flagged(self):
        self.w("tests/test_a.py", PY.replace("    def test_b", "    @unittest.skip('x')\n    def test_b"))
        self.assertTrue(any("skip" in x for x in self.v()))

    def test_js_only_flagged(self):
        self.w("tests/a.test.js", JS.replace("test('a'", "test.only('a'"))
        self.assertTrue(any("skip/only" in x for x in self.v()))

    def test_deleted_flagged(self):
        os.remove(os.path.join(self.d, "tests/a.test.js"))
        self.assertTrue(any("deleted" in x for x in self.v()))

    def test_unprotected_ignored(self):
        os.remove(os.path.join(self.d, "src/x.py"))
        self.assertEqual(self.v(), [])

    def test_matches(self):
        self.assertTrue(gate.matches("tests/a/b.py", ["tests/**"]))
        self.assertFalse(gate.matches("testsuite/a.py", ["tests/**"]))
        self.assertTrue(gate.matches("src/a.test.ts", ["**/*.test.ts", "src/*.test.ts"]))


if __name__ == "__main__":
    unittest.main()
