"""Protected acceptance tests, built from acceptance/marketing/EXAMPLES.md and approved by Marketing.

Marketing owns this path (T05); Finance owns acceptance/test_acceptance.py (T01..T04).
Agents may read and run these tests but never change them. Any change goes back to Marketing.
The owner enables increments in .golden-path/config.json acceptance.command
(e.g. acceptance.marketing.test_acceptance.T05).
"""
import unittest
from decimal import Decimal
from invoice import Invoice, Line


# T05: see acceptance/marketing/EXAMPLES.md section T05 (owner: Marketing)
class T05(unittest.TestCase):
    KEYS = {"lines", "net", "vat", "gross", "flags", "recommendation", "reason"}

    def codes(self, s):
        return [f["code"] for f in s["flags"]]

    def assertOneSentence(self, text):
        self.assertIsInstance(text, str)
        self.assertNotIn("\n", text)
        self.assertTrue(text.strip().endswith("."))
        self.assertLessEqual(len(text), 200)

    def test_fixed_fields_and_totals_reconcile(self):
        inv = Invoice().add(Line("A", "100.00", 2)).add(Line("F", "10.00", 1, "food"))
        s = inv.review_summary()
        self.assertEqual(set(s), self.KEYS)
        self.assertEqual(s["lines"], 2)
        self.assertEqual((s["net"], s["vat"], s["gross"]),
                         (inv.net_total(), inv.vat_total(), inv.gross_total()))
        self.assertEqual(s["net"] + s["vat"], s["gross"])

    def test_clean_invoice_is_approved_with_one_sentence(self):
        s = Invoice().add(Line("A", "100.00", 2)).review_summary()
        self.assertEqual(s["gross"], Decimal("250.00"))
        self.assertEqual(s["flags"], [])
        self.assertEqual(s["recommendation"], "approve")
        self.assertOneSentence(s["reason"])

    def test_duplicate_line_flagged_with_plain_reason(self):
        s = Invoice().add(Line("A", "100.00", 1)).add(Line("A", "100.00", 1)).review_summary()
        self.assertEqual(self.codes(s), ["duplicate_line"])
        self.assertIn("A", s["flags"][0]["reason"])
        self.assertEqual(s["recommendation"], "review")
        self.assertIn("duplicate_line", s["reason"])
        self.assertOneSentence(s["reason"])

    def test_same_sku_with_other_differences_is_not_duplicate(self):
        cases = [
            ((Line("A", "100.00", 1), Line("A", "90.00", 1)), Decimal("237.50")),          # price differs
            ((Line("A", "100.00", 1), Line("A", "100.00", 2)), Decimal("375.00")),         # quantity differs
            ((Line("A", "100.00", 1), Line("A", "100.00", 1, "food")), Decimal("240.00")),  # VAT class differs
        ]
        for lines, gross in cases:
            with self.subTest(lines=lines):
                s = Invoice().add(lines[0]).add(lines[1]).review_summary()
                self.assertEqual(s["gross"], gross)
                self.assertNotIn("duplicate_line", self.codes(s))
                self.assertEqual(s["flags"], [])
                self.assertEqual(s["recommendation"], "approve")

    def test_threshold_is_strictly_greater(self):
        at = Invoice().add(Line("A", "40000.00", 1)).review_summary()
        self.assertEqual(at["gross"], Decimal("50000.00"))
        self.assertEqual(at["recommendation"], "approve")
        over = Invoice().add(Line("A", "40000.01", 1)).review_summary()
        self.assertEqual(self.codes(over), ["over_threshold"])
        self.assertIn("50000.00", over["flags"][0]["reason"])
        self.assertEqual(over["recommendation"], "review")
        with self.assertRaises(TypeError):
            Invoice().add(Line("A", "1.00", 1)).review_summary(threshold=1.0)

    def test_custom_threshold_reason_states_effective_threshold(self):
        for threshold in ("10.00", Decimal("10.00")):
            with self.subTest(threshold=threshold):
                s = Invoice().add(Line("A", "10.00", 1)).review_summary(threshold=threshold)
                self.assertEqual(s["gross"], Decimal("12.50"))
                self.assertEqual(self.codes(s), ["over_threshold"])
                self.assertIn("10.00", s["flags"][0]["reason"])
                self.assertNotIn("50000.00", s["flags"][0]["reason"])
                self.assertEqual(s["recommendation"], "review")

    def test_decimal_threshold_accepted_at_boundary(self):
        s = Invoice().add(Line("A", "10.00", 1)).review_summary(threshold=Decimal("12.5"))
        self.assertEqual(s["flags"], [])
        self.assertEqual(s["recommendation"], "approve")

    def test_empty_invoice_needs_review(self):
        s = Invoice().review_summary()
        self.assertEqual(s["lines"], 0)
        self.assertEqual(self.codes(s), ["empty"])
        self.assertIsInstance(s["flags"][0]["reason"], str)
        self.assertTrue(s["flags"][0]["reason"].strip())
        self.assertEqual(s["recommendation"], "review")
        self.assertIn("empty", s["reason"])
        self.assertOneSentence(s["reason"])

    def test_every_flag_named_in_reason(self):
        s = (Invoice().add(Line("A", "30000.00", 1)).add(Line("A", "30000.00", 1))
             .review_summary())
        self.assertEqual(sorted(self.codes(s)), ["duplicate_line", "over_threshold"])
        for f in s["flags"]:
            self.assertTrue(f["reason"].strip())
            self.assertIn(f["code"], s["reason"])
        self.assertOneSentence(s["reason"])


if __name__ == "__main__":
    unittest.main()
