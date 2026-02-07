# Rounding Rules

- Rounding method: `ROUND_HALF_UP`.
- Implementation: `Decimal.quantize` in `backend/app/domain/rounding.py`.
- Rounding points:
  - Intermediate component loads: integer W (`ndigits=0`) unless noted.
  - Moist-air humidity ratio: 4 decimals.
  - Enthalpy: 1 decimal.
  - Final intensity (`W/m2`): integer W/m2.
