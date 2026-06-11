# 🟠 uFIT — Gym QR Access System

A QR-integrated gym **member access & management** system.

- **Staff web panel** (Next.js): member registration, membership management, entry logs, and a kiosk QR scanner.
- **Member mobile app** (Expo / React Native): TCKN + password login, a **short-lived auto-refreshing QR code** to scan at the door, and entry history.
- **Bilingual UI**: English (default) + Turkish, switchable from a flag selector. 🇬🇧 / 🇹🇷
- **TCKN validation**: official Turkish national-ID checksum algorithm (no external/government service needed).
- **PostgreSQL** + Prisma.

```
.
├─ backend/            # Next.js: REST API + staff panel + Prisma
├─ mobile/             # Expo: member app
└─ docker-compose.yml  # PostgreSQL (development)
```

## How it works

1. **Staff** create a member from the panel (TCKN is algorithmically validated). The system generates a **temporary password** (also sent by SMS) and shows it once.
2. The **member** logs into the mobile app with TCKN + temporary password and changes it on first login.
3. The app fetches an **HMAC-signed, time-limited entry token** from the backend every ~60 s and renders it as a QR code (cannot be reused from a screenshot).
4. The **kiosk** at the door (panel → `/scanner`) scans the QR → backend verifies signature + expiry + membership validity → `GRANTED`/`DENIED` and writes an entry log (`IN`/`OUT` auto-detected).

---

## Requirements

- Node.js 18+ (developed on Node 26)
- Docker Desktop (for PostgreSQL) — or a local PostgreSQL 16
- An iOS/Android device or simulator (for the mobile app; Expo Go is enough)

---

## 1) Start the database

With Docker Desktop running, from the repo root:

```bash
docker compose up -d
```

Serves PostgreSQL on `localhost:5432` (`spor / spor_dev_pw`, database `spor_salonu`).

## 2) Backend (panel + API)

```bash
cd backend
cp .env.example .env        # change secrets if needed
npm install
npx prisma migrate dev      # apply schema
npm run seed                # create admin staff
npm run dev                 # http://localhost:3000
```

- Panel: <http://localhost:3000/login>
- Default admin: **`admin` / `SporSalonu!2026`**
- TCKN unit tests: `npm run test:tckn`
- Create/update a staff account:
  ```bash
  npm run create-admin -- <username> <password> "<Full Name>" ADMIN|STAFF
  ```

### Key environment variables (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET` | Session JWT signing key (**change in production**) |
| `QR_SECRET` | Entry-QR HMAC key (**change in production**) |
| `QR_TOKEN_TTL_SECONDS` | QR token lifetime (default 60 s) |
| `SMS_PROVIDER` | `console` (default) / `netgsm` / `twilio` |
| `NETGSM_*` / `TWILIO_*` | Credentials for the chosen SMS provider |

## 3) Mobile app (member)

```bash
cd mobile
npm install
# Set mobile/app.json -> expo.extra.apiUrl to your computer's LAN IP
# (e.g. http://192.168.1.7:3000). A device cannot reach "localhost".
npm start
```

Open with Expo Go by scanning the QR. Log in with the TCKN + temporary password created by staff. The phone and the computer must be on the **same Wi-Fi** and the backend reachable at `http://<LAN-IP>:3000`.

---

## Features

- **Internationalization** — English default + Turkish, flag switcher in both panel and mobile; preference is persisted.
- **Member archiving** — hide a member from lists and block entry (`Membership archived` denial) while keeping the record; reversible.
- **Permanent deletion** — ADMIN-only; removes the member and all entry logs.
- **SMS password delivery** — temporary password is sent to the member's phone on creation / reset. `console` mode logs it (dev); `netgsm` / `twilio` for real delivery. The password is still shown once in the panel as a fallback.
- **Auto-toggling direction** — each granted scan alternates `IN`/`OUT`.

### SMS setup — Netgsm (Turkey)

1. In `backend/.env`, set `SMS_PROVIDER="netgsm"` and fill in your Netgsm credentials:
   ```env
   SMS_PROVIDER="netgsm"
   NETGSM_USERCODE="your-usercode"
   NETGSM_PASSWORD="your-password"
   NETGSM_MSGHEADER="APPROVED_SENDER"   # your approved sender name/header
   NETGSM_APPKEY=""                      # optional API key, if defined on your account
   ```
   These stay in your local `.env` and are **never committed** (gitignored).
2. Test the connection without creating a member:
   ```bash
   npm run test:sms -- 05551234567 "uFIT test"
   ```
   Success prints `✓`. Netgsm error codes are mapped to readable messages
   (e.g. `30` → invalid credentials/IP, `40` → undefined sender header).
3. From then on, creating a member or resetting a password automatically
   texts the temporary password. With `SMS_PROVIDER="console"` (default) no real
   SMS is sent — the message is written to the server log instead.

> Twilio is also supported: set `SMS_PROVIDER="twilio"` with `TWILIO_ACCOUNT_SID`,
> `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM`.

## API endpoints (summary)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/staff/login` | — | Staff login |
| POST | `/api/auth/login` | — | Member login (TCKN + password) |
| POST | `/api/auth/change-password` | Member | Change password |
| GET | `/api/me` | Member | Profile + membership status |
| GET | `/api/me/qr` | Member | Short-lived entry token |
| GET | `/api/me/entries` | Member | Entry history |
| GET/POST | `/api/members` | Staff | List (`?archived=1`) / create |
| GET/PATCH | `/api/members/:id` | Staff | Detail / update, archive (`{archived:true}`), reset password |
| DELETE | `/api/members/:id` | **Admin** | Permanently delete member + logs |
| POST | `/api/entry/scan` | Staff | Validate QR + record entry |
| GET | `/api/entries` | Staff | Entry logs |
| GET | `/api/stats` | Staff | Dashboard stats |

Denial reasons are returned as language-independent **codes** (e.g. `MEMBERSHIP_EXPIRED`, `QR_EXPIRED`) and translated by the UI.

---

## Security / privacy notes

- **TCKN** is sensitive personal data. It is returned **masked** in API responses (`123******45`); the full value is shown only on the staff member-detail screen. Passwords are hashed with **bcrypt**.
- Entry QR tokens are signed with the member's per-account secret + a server secret (**HMAC-SHA256**) and are short-lived.
- Before going to production: replace `JWT_SECRET` and `QR_SECRET` with long random values, use HTTPS, and harden the database password.
- TCKN validation is a **checksum** only; identity↔person matching requires an official NVİ/KPS integration.
