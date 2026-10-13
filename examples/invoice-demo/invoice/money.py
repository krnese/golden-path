"""Money helpers. Amounts are Decimal; rounding is commercial (half-up) to 2 dp."""
from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal("0.01")


def to_money(value) -> Decimal:
    """Convert int/str/Decimal to Decimal. Floats are rejected to avoid binary error."""
    if isinstance(value, float):
        raise TypeError("use str or Decimal, not float, for money")
    return Decimal(value)


def round_money(amount: Decimal) -> Decimal:
    return amount.quantize(CENT, rounding=ROUND_HALF_UP)
