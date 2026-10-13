"""Static checks of the Agent Plugin package against the documented format.

Format sources (Agent Plugins 1.0 support in VS Code; hook schema from the Copilot hooks reference):
https://code.visualstudio.com/docs/agent-customization/agent-plugins
https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md
https://docs.github.com/en/copilot/reference/hooks-reference
"""
import json
import os
import re
import unittest

from helpers import KIT

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
        agents = os.listdir(os.path.join(KIT, "com.github.copilot", "agents"))
        self.assertEqual(agents, ["golden-path.agent.md"])
        self.assertEqual(os.listdir(os.path.join(KIT, "optional", "agents")), ["golden-path-reviewer.agent.md"])
        fm = frontmatter(os.path.join(KIT, "optional", "agents", "golden-path-reviewer.agent.md"))
        self.assertEqual(fm["name"], "golden-path-reviewer")
        self.assertNotIn("edit", fm.get("tools", ""))

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


if __name__ == "__main__":
    unittest.main()
