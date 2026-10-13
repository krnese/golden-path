import unittest
from decimal import Decimal
from invoice.invoice import Invoice, Line


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
