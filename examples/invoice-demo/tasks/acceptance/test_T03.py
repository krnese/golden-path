import unittest
from decimal import Decimal
from invoice.invoice import Line


class T03(unittest.TestCase):
    def test_bulk_threshold(self):
        self.assertEqual(Line("A", "1.00", 9).net(), Decimal("9.00"))
        self.assertEqual(Line("A", "1.00", 10).net(), Decimal("9.50"))

    def test_combined_single_rounding(self):
        # 0.33*10*0.9*0.95 = 2.8215 -> 2.82
        l = Line("A", "0.33", 10, discount_pct="10")
        self.assertEqual(l.net(), Decimal("2.82"))
        self.assertEqual(l.vat(), Decimal("0.71"))
