import os
import sys
import unittest

from helpers import SCRIPTS, rm, scratch_repo

sys.path.insert(0, SCRIPTS)
import gp_integrity  # noqa: E402

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
        return gp_integrity.check(self.d, ["tests/**"])

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
        self.assertTrue(gp_integrity.matches("tests/a/b.py", ["tests/**"]))
        self.assertFalse(gp_integrity.matches("testsuite/a.py", ["tests/**"]))
        self.assertTrue(gp_integrity.matches("src/a.test.ts", ["**/*.test.ts", "src/*.test.ts"]))


if __name__ == "__main__":
    unittest.main()
