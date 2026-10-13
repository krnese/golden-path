import unittest
from decimal import Decimal
from invoice import Line


class DiscountTests(unittest.TestCase):
    def test_discount_applied_before_vat(self):
        self.assertEqual(Line("A", "100.00", 1, discount_pct="10").net(), Decimal("90.00"))

    def test_discount_result_is_rounded(self):
        self.assertEqual(Line("A", "0.15", 1, discount_pct="50").net(), Decimal("0.08"))
