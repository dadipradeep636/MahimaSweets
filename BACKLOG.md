# Mahima Sweets – Backlog

Agreed with the owner on 18 Oct 2026. Planned for tonight's session. Bar: professional, secure, and something customers can trust.

## 1. Owner alerts on Telegram (free)
- Instant Telegram message to the owner when an order is placed and when a customer sends a UPI reference: order number, name, phone, pickup time, items, amount, UPI reference.
- One-tap buttons inside Telegram: **Payment found / Not found**, then **Ready**, **Picked up**.
- Security: bot token and owner chat ID kept as hosting secrets; Telegram webhook verified with a secret token; only the owner's chat ID can act; every action re-checked by the same server rules as /admin; no customer data in logs.
- Setup by owner: create bot with @BotFather, send /start, Codex adds `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_OWNER_CHAT_ID` secrets.

## 2. "Send payment details on WhatsApp" button (free)
- After the customer enters the UPI reference, show a prominent button that opens WhatsApp to the shop with a pre-filled message: order number, amount paid, UPI reference, pickup time.

## 3. OTP sign-in (SMS, ready-DLT provider)
- Expected volume: about 100 sign-ups in 3 months (about 300 OTPs, roughly ₹60).
- Replace the 4-digit PIN with mobile number + 6-digit OTP. OTP expires in 5 minutes, resend timer, per-number and per-IP limits (protects the SMS balance), codes stored hashed.
- Owner to pick a provider, finish KYC, top up about ₹500, and have Codex add the API key as a hosting secret.

## 4. "My orders" for signed-in customers
- All orders for the verified mobile number on any device, with status, tap to track, and "Order again".
- Name and number filled in automatically at checkout.

## Later
- Payment gateway (Razorpay / Cashfree / PhonePe PG) for automatic payment confirmation.
- Home delivery (currently "Coming soon").
- FSSAI number in /admin → Shop details once received.
- CA/lawyer review of the Privacy, Terms and Refund pages.
