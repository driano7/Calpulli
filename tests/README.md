# Tests — money path first

Zero-dependency suite on Node's built-in test runner (`node:test`).
Requires Node >= 23.6 (24 recommended): `lib/currency.ts` and
`lib/booking/reference.ts` are imported directly and rely on Node's
built-in TypeScript type stripping.

## Run

```bash
npm test          # node --test tests/*.test.mjs
```

## What's covered

| File                                               | Module(s)                                      | Locks                                                                                                                          |
| -------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `currency.test.mjs`                                | `lib/currency.ts`                              | Fallback rate 18.65, MXN display in both locales, USD→MXN conversion, `formatPriceMXN` does not convert                        |
| `journeys-prices.test.mjs`                         | `data/journeysData.js`, `lib/chatbot/sales.js` | Launch prices per journey, no journey on the $100 fallback, `quoteFor` totals                                                  |
| `chatbot-sales.test.mjs`                           | `lib/chatbot/sales.js`                         | Guest/date parsing, exact quote totals ES/EN, 20-guest cap (21 goes to WhatsApp, no quote), WhatsApp handoff carries the quote |
| `partners-money.test.mjs`                          | `lib/partners/pricing.js`                      | 10% discount + 10% commission **at the real launch prices**, cash-booking composition (discounted unit × people)               |
| `booking-reference.test.mjs`                       | `lib/booking/reference.ts`                     | Folio format `CDMX-XXXXXX`, unambiguous alphabet, uniqueness                                                                   |
| `partners.test.mjs`, `partners-dashboard.test.mjs` | `lib/partners/*`                               | Pre-existing: pricing rules, slugs, URLs, CSV, referral links                                                                  |

### Partner rounding — read this before "fixing" a failure

Amounts are **integer pesos** on the storefront: `applyDiscount` rounds
the discount to whole pesos. On Luchas ($999) the guest pays **$899**
(discount $100), not $899.10, and the commission is **$89.90** per
person. The tests assert the code's real behavior on purpose.

## How importing works (tests/helpers/hooks.mjs)

The repo has no `"type": "module"` and uses the `@/` alias plus
extensionless imports (Next.js style). `tests/helpers/hooks.mjs`
registers Node module customization hooks that map `@/…` to the repo
root, resolve extensionless specifiers, and load repo `.js` files as
ESM. Test files register the hooks first and then **dynamically**
import the module under test. No production code was changed for this,
except one extraction: `generateBookingReference` moved from
`lib/booking/turso.ts` to `lib/booking/reference.ts` (pure function,
re-exported from `turso.ts` so existing imports keep working).

## Not covered (and why)

- `lib/booking/turso.ts` (booking creation, the guests clamp
  `Math.max(1, Math.min(20, …))`, totals persistence) and the API
  handlers (`pages/api/bookings/cash.js`, `pages/api/exchange-rate.js`):
  they create a Turso client / need HTTP at import time. The pure pieces
  they compose (pricing, folio, cap at the chatbot layer) are covered;
  the DB layer itself needs an integration test with a throwaway Turso
  database — a deliberate next step, not part of this pass.
- Stripe checkout: card payments are intentionally still in test mode.
