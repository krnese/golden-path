import unittest
from decimal import Decimal
from invoice.invoice import Invoice, Line


class T04(unittest.TestCase):
    def test_summary_matches_totals(self):
        inv = (Invoice().add(Line("A", "0.10", 1)).add(Line("B", "0.10", 1))
               .add(Line("F", "10.00", 1, "food")))
        s = inv.vat_summary()
        self.assertEqual(s["standard"], {"net": Decimal("0.20"), "vat": Decimal("0.06")})
        self.assertEqual(s["food"], {"net": Decimal("10.00"), "vat": Decimal("1.50")})
        self.assertNotIn("exempt", s)
        self.assertEqual(sum(v["vat"] for v in s.values()), inv.vat_total())
