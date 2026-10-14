"""Protected acceptance tests, built from acceptance/EXAMPLES.md and approved by Finance (Ingrid Berg).

Agents may read and run these tests but never change them. Any change goes back to the owner.
The owner enables increments in .golden-path/config.json acceptance.command (e.g. ...test_acceptance.T01).
"""
import unittest
from decimal import Decimal
import invoice  # imported as a module so one unimplemented increment cannot break the others
from invoice import Invoice, Line


# T01: see EXAMPLES.md section T01
class T01(unittest.TestCase):
    def test_discount_before_vat(self):
        l = Line("A", "100.00", 1, discount_pct="10")
        self.assertEqual(l.net(), Decimal("90.00"))
        self.assertEqual(l.vat(), Decimal("22.50"))

    def test_rounding_after_discount(self):
        l = Line("A", "0.15", 1, discount_pct="50")  # 0.075 -> 0.08
        self.assertEqual(l.net(), Decimal("0.08"))

    def test_default_unchanged(self):
        self.assertEqual(Invoice().add(Line("A", "10.00", 3)).gross_total(), Decimal("37.50"))

    def test_range(self):
        for bad in ("-1", "100.01"):
            with self.assertRaises(ValueError):
                Line("A", "1.00", 1, discount_pct=bad)
        Line("A", "1.00", 1, discount_pct="100")


# T02: see EXAMPLES.md section T02
class T02(unittest.TestCase):
    def test_examples(self):
        self.assertEqual(invoice.format_nok(Decimal("1234.5")), "1 234,50 kr")
        self.assertEqual(invoice.format_nok(Decimal("-0.005")), "-0,01 kr")
        self.assertEqual(invoice.format_nok(Decimal("0")), "0,00 kr")
        self.assertEqual(invoice.format_nok(Decimal("1234567.891")), "1 234 567,89 kr")

    def test_rejects_float(self):
        with self.assertRaises(TypeError):
            invoice.format_nok(1.5)


# T03: see EXAMPLES.md section T03
class T03(unittest.TestCase):
    def test_bulk_threshold(self):
        self.assertEqual(Line("A", "1.00", 9).net(), Decimal("9.00"))
        self.assertEqual(Line("A", "1.00", 10).net(), Decimal("9.50"))

    def test_combined_single_rounding(self):
        # 0.33*10*0.9*0.95 = 2.8215 -> 2.82
        l = Line("A", "0.33", 10, discount_pct="10")
        self.assertEqual(l.net(), Decimal("2.82"))
        self.assertEqual(l.vat(), Decimal("0.71"))


# T04: see EXAMPLES.md section T04
class T04(unittest.TestCase):
    def test_summary_matches_totals(self):
        inv = (Invoice().add(Line("A", "0.10", 1)).add(Line("B", "0.10", 1))
               .add(Line("F", "10.00", 1, "food")))
        s = inv.vat_summary()
        self.assertEqual(s["standard"], {"net": Decimal("0.20"), "vat": Decimal("0.06")})
        self.assertEqual(s["food"], {"net": Decimal("10.00"), "vat": Decimal("1.50")})
        self.assertNotIn("exempt", s)
        self.assertEqual(sum(v["vat"] for v in s.values()), inv.vat_total())


# T05: see EXAMPLES.md section T05 (owner: Marketing)
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

    def test_threshold_is_strictly_greater(self):
        at = Invoice().add(Line("A", "40000.00", 1)).review_summary()
        self.assertEqual(at["gross"], Decimal("50000.00"))
        self.assertEqual(at["recommendation"], "approve")
        over = Invoice().add(Line("A", "40000.01", 1)).review_summary()
        self.assertEqual(self.codes(over), ["over_threshold"])
        self.assertIn("50", over["flags"][0]["reason"])
        self.assertEqual(over["recommendation"], "review")
        self.assertEqual(Invoice().add(Line("A", "10.00", 1))
                         .review_summary(threshold="10.00")["recommendation"], "review")
        with self.assertRaises(TypeError):
            Invoice().add(Line("A", "1.00", 1)).review_summary(threshold=1.0)

    def test_empty_invoice_needs_review(self):
        s = Invoice().review_summary()
        self.assertEqual(s["lines"], 0)
        self.assertEqual(self.codes(s), ["empty"])
        self.assertEqual(s["recommendation"], "review")
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
