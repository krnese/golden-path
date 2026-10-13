# Lesson: round the line net once, after applying the discount (half-up to 2 dp).
import unittest
from decimal import Decimal
from invoice import Line


class RoundAfterDiscount(unittest.TestCase):
    def test_round_after_discount(self):
        self.assertEqual(Line("A", "0.15", 1, discount_pct="50").net(), Decimal("0.08"))
