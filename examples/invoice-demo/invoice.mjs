// Invoice totals. Norwegian standard VAT (25%) is applied per line, then summed.
// Money is exact: amounts are Decimal (a BigInt coefficient and a base-10 exponent, never a binary float);
// rounding is commercial (half-up, away from zero) to 2 dp. Node.js 22+, no dependencies.

/** Exact decimal number, mirroring the parts of Python's decimal.Decimal this app relies on. */
export class Decimal {
  /** @param {string|bigint|Decimal} value  JS numbers are rejected (see toMoney). */
  constructor(value) {
    if (value instanceof Decimal) { this.coef = value.coef; this.exp = value.exp; Object.freeze(this); return; }
    if (typeof value === "bigint") { this.coef = value; this.exp = 0; Object.freeze(this); return; }
    if (typeof value !== "string") throw new TypeError(`Decimal needs a string, bigint or Decimal, got ${typeof value}`);
    const m = /^\s*([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?\s*$/.exec(value);
    if (!m || (m[2] === "" && (m[3] ?? "") === "")) throw new RangeError(`invalid decimal: ${JSON.stringify(value)}`);
    const frac = m[3] ?? "";
    this.coef = BigInt((m[1] === "-" ? "-" : "") + (m[2] + frac || "0"));
    this.exp = Number(m[4] ?? 0) - frac.length;
    Object.freeze(this);
  }
  static #of(coef, exp) { const d = Object.create(Decimal.prototype); d.coef = coef; d.exp = exp; return Object.freeze(d); }
  static #align(a, b) {
    const e = Math.min(a.exp, b.exp);
    return [a.coef * 10n ** BigInt(a.exp - e), b.coef * 10n ** BigInt(b.exp - e), e];
  }
  add(other) { const [x, y, e] = Decimal.#align(this, new Decimal(other)); return Decimal.#of(x + y, e); }
  sub(other) { const [x, y, e] = Decimal.#align(this, new Decimal(other)); return Decimal.#of(x - y, e); }
  mul(other) { const o = new Decimal(other); return Decimal.#of(this.coef * o.coef, this.exp + o.exp); }
  /** Numeric comparison: -1, 0 or 1 (Decimal("0.2") equals Decimal("0.20"), as in Python). */
  cmp(other) { const [x, y] = Decimal.#align(this, new Decimal(other)); return x < y ? -1 : x > y ? 1 : 0; }
  eq(other) { return this.cmp(other) === 0; }
  /** Round to `places` decimal places, half-up (away from zero), like quantize(..., ROUND_HALF_UP). */
  roundHalfUp(places) {
    const e = -places;
    if (this.exp >= e) return Decimal.#of(this.coef * 10n ** BigInt(this.exp - e), e);
    const div = 10n ** BigInt(e - this.exp), neg = this.coef < 0n, a = neg ? -this.coef : this.coef;
    let q = a / div; if ((a % div) * 2n >= div) q += 1n;
    return Decimal.#of(neg ? -q : q, e);
  }
  /** Plain notation keeping the scale, e.g. "50000.00", "-0.01". */
  toString() {
    const neg = this.coef < 0n, s = (neg ? -this.coef : this.coef).toString();
    if (this.exp >= 0) return (neg ? "-" : "") + s + "0".repeat(this.exp);
    const p = s.padStart(-this.exp + 1, "0");
    return (neg ? "-" : "") + p.slice(0, this.exp) + "." + p.slice(this.exp);
  }
  toJSON() { return this.toString(); }
  [Symbol.for("nodejs.util.inspect.custom")]() { return `Decimal("${this}")`; }
}

/** Convert bigint/str/Decimal to Decimal. JS numbers (binary floats) are rejected to avoid binary error. */
export function toMoney(value) {
  if (typeof value === "number") throw new TypeError("use str or Decimal, not a JS number (float), for money");
  return new Decimal(value);
}

export function roundMoney(amount) { return new Decimal(amount).roundHalfUp(2); }

export const VAT_RATES = Object.freeze({ standard: new Decimal("0.25"), food: new Decimal("0.15"), exempt: new Decimal("0") });

export class Line {
  constructor(sku, unitPrice, quantity, vatClass = "standard") {
    this.sku = sku;
    this.unitPrice = toMoney(unitPrice);
    this.quantity = quantity;
    this.vatClass = vatClass;
    if (!Number.isInteger(quantity)) throw new TypeError("quantity must be an integer");
    if (quantity <= 0) throw new RangeError("quantity must be positive");
    if (!Object.hasOwn(VAT_RATES, vatClass)) throw new RangeError(`unknown vat class: ${vatClass}`);
    Object.freeze(this);
  }
  net() { return roundMoney(this.unitPrice.mul(BigInt(this.quantity))); }
  vat() { return roundMoney(this.net().mul(VAT_RATES[this.vatClass])); }
}

export class Invoice {
  constructor(lines = []) { this.lines = lines; }
  add(line) { this.lines.push(line); return this; }
  netTotal() { return this.lines.reduce((s, l) => s.add(l.net()), new Decimal("0.00")); }
  vatTotal() { return this.lines.reduce((s, l) => s.add(l.vat()), new Decimal("0.00")); }
  grossTotal() { return this.netTotal().add(this.vatTotal()); }
}
