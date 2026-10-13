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


if __name__ == "__main__":
    unittest.main()
