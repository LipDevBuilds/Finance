# Ledger — free personal finance PWA

Track **costs, income, debts and budgets** by **voice or chat**. No account, no server, no cost — data stays on your device (localStorage), works offline once installed.

## Get it on your phone (free)

A GitHub Actions workflow (`.github/workflows/pages.yml`) auto-deploys this folder to GitHub Pages on every push. The app lives at:

**https://lipdevbuilds.github.io/finance/**

1. Open that URL on your phone in Chrome (Android) or Safari (iOS).
2. **Android:** menu → *Add to Home screen* / *Install app*. **iOS:** Share → *Add to Home Screen*.

## Accounts

On first open you create an account (optional PIN). Each account keeps its own entries, debts and budgets. Tap the account name in the header to switch. PINs are a courtesy lock on a shared phone, not encryption.

## Online sync backend (free)

`backend/` contains a Cloudflare Worker (free tier) that stores each account's history online so it follows you across devices. Deploy steps are at the top of `backend/worker.js` (wrangler login → create KV → set key → deploy), then in the app tap **Sync settings** and paste the worker URL + key. The ● / ○ dot in the header shows sync status. Without a backend everything still works, stored per device.

It then behaves like a native app: home-screen icon, fullscreen, offline.

## Entering data

Type in the chat bar or tap 🎤 and speak (Web Speech API — free, built into the browser). Both go through the same parser:

| Say / type | Result |
|---|---|
| `spent 12.50 on lunch` | expense, auto-categorized (food) |
| `40 gas` | expense (transport) |
| `got 1200 salary` | income |
| `owe John 500` | debt to John |
| `paid John 100` | debt payment (reduces John, logs expense) |
| `budget 300 food` | monthly budget chip with over-spend warning |

## Calculations

The **Calc** tab shows net, daily burn rate, projected month-end spend, biggest category, and a debt-payoff estimate. Budget chips at the top track spend vs budget per category.

## Future: connecting real transactions

The data model is built for it. Every entry has a `source` field (`"manual"` today) and the whole store is versioned JSON (`ledger.v1`) with an **Export** button. To hook up bank/app feeds later (e.g. Plaid, a bank CSV import, or another app's webhook), imported transactions become entries with `source: "plaid"` etc., and matching a manual entry to an online transaction is just filling in an `externalId`. No schema rewrite needed.

## Files

- `index.html` — the whole app (UI, parser, voice, storage)
- `manifest.json`, `sw.js`, `icon-*.png` — PWA install + offline support
