import unittest
from decimal import Decimal
from invoice.money import format_nok


class T02(unittest.TestCase):
    def test_examples(self):
        self.assertEqual(format_nok(Decimal("1234.5")), "1 234,50 kr")
        self.assertEqual(format_nok(Decimal("-0.005")), "-0,01 kr")
        self.assertEqual(format_nok(Decimal("0")), "0,00 kr")
        self.assertEqual(format_nok(Decimal("1234567.891")), "1 234 567,89 kr")

    def test_rejects_float(self):
        with self.assertRaises(TypeError):
            format_nok(1.5)
