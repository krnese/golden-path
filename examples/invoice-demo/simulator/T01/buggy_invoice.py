"""Invoice totals. Norwegian standard VAT (25%) is applied per line, then summed."""
from dataclasses import dataclass, field
from decimal import Decimal

from .money import round_money, to_money

VAT_RATES = {"standard": Decimal("0.25"), "food": Decimal("0.15"), "exempt": Decimal("0")}


@dataclass(frozen=True)
class Line:
    sku: str
    unit_price: Decimal
    quantity: int
    vat_class: str = "standard"
    discount_pct: Decimal = Decimal("0")

    def __post_init__(self):
        object.__setattr__(self, "unit_price", to_money(self.unit_price))
        object.__setattr__(self, "discount_pct", to_money(self.discount_pct))
        if not (Decimal("0") <= self.discount_pct <= Decimal("100")):
            raise ValueError("discount_pct must be between 0 and 100")
        if self.quantity <= 0:
            raise ValueError("quantity must be positive")
        if self.vat_class not in VAT_RATES:
            raise ValueError(f"unknown vat class: {self.vat_class}")

    def net(self) -> Decimal:
        # BUG (deliberate, simulator only): rounds before applying the discount
        return round_money(self.unit_price * self.quantity) * (1 - self.discount_pct / 100)

    def vat(self) -> Decimal:
        return round_money(self.net() * VAT_RATES[self.vat_class])


@dataclass
class Invoice:
    lines: list = field(default_factory=list)

    def add(self, line: Line) -> "Invoice":
        self.lines.append(line)
        return self

    def net_total(self) -> Decimal:
        return sum((l.net() for l in self.lines), Decimal("0.00"))

    def vat_total(self) -> Decimal:
        return sum((l.vat() for l in self.lines), Decimal("0.00"))

    def gross_total(self) -> Decimal:
        return self.net_total() + self.vat_total()
