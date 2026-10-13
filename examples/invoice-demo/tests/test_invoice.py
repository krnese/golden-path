import unittest
from decimal import Decimal

from invoice.invoice import Invoice, Line
from invoice.money import round_money, to_money


class MoneyTests(unittest.TestCase):
    def test_half_up_rounding(self):
        self.assertEqual(round_money(Decimal("0.125")), Decimal("0.13"))
        self.assertEqual(round_money(Decimal("0.124")), Decimal("0.12"))

    def test_rejects_float(self):
        with self.assertRaises(TypeError):
            to_money(0.1)


class InvoiceTests(unittest.TestCase):
    def test_single_standard_line(self):
        inv = Invoice().add(Line("A", "100.00", 2))
        self.assertEqual(inv.net_total(), Decimal("200.00"))
        self.assertEqual(inv.vat_total(), Decimal("50.00"))
        self.assertEqual(inv.gross_total(), Decimal("250.00"))

    def test_vat_rounded_per_line(self):
        inv = Invoice().add(Line("A", "0.10", 1)).add(Line("B", "0.10", 1))
        # 0.10 * 25% = 0.025 -> 0.03 per line, so 0.06 total (not 0.05)
        self.assertEqual(inv.vat_total(), Decimal("0.06"))

    def test_food_rate(self):
        inv = Invoice().add(Line("F", "10.00", 1, "food"))
        self.assertEqual(inv.vat_total(), Decimal("1.50"))

    def test_rejects_non_positive_quantity(self):
        with self.assertRaises(ValueError):
            Line("A", "1.00", 0)

    def test_rejects_unknown_vat_class(self):
        with self.assertRaises(ValueError):
            Line("A", "1.00", 1, "luxury")


if __name__ == "__main__":
    unittest.main()
