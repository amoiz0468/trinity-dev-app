# Trinity Grocery App (Backend + Mobile)

Full-stack grocery application with:
- Django REST backend (`backend/`)
- React Native Expo mobile app (`front-end/`)

This root guide is the single source of truth for running the project locally on one laptop and testing from a physical phone.

## Current Status

- Auth, products, invoices, reports, and PayPal checkout endpoints are integrated.
- Admin and customer flows use real backend APIs.
- Order status contract is aligned end-to-end:
  - `PENDING` <-> `pending`
  - `PROCESSING` <-> `processing`
  - `COMPLETED` <-> `paid`
  - `CANCELLED` <-> `cancelled` / `refunded`

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm
- Expo Go app on your phone
- Same Wi-Fi network for laptop and phone

## 1) Backend Setup

```bash
cd backend
python -m venv venv
```

Activate venv:

- Windows PowerShell:
```powershell
.\venv\Scripts\Activate.ps1
```

- Bash:
```bash
source venv/bin/activate
```

Install dependencies and migrate:

```bash
pip install -r requirements.txt
python manage.py migrate
```

Create admin user (once):

```bash
python manage.py createsuperuser
```

Run backend:

```bash
python manage.py runserver 0.0.0.0:8000
```

## 2) Frontend Setup

```bash
cd front-end
npm install
```

Frontend API URL behavior:
- Recommended: keep `front-end/.env` API vars commented for auto-detection from Expo host.
- If needed, set explicit API URL:
  - Android emulator: `http://10.0.2.2:8000/api`
  - Physical device: `http://<YOUR_PC_IP>:8000/api`

Run Expo:

```bash
npx expo start -c --host lan
```

Scan QR in Expo Go.

## 3) URLs You Should Use

- Backend API base (PC browser): `http://127.0.0.1:8000/api/`
- Swagger docs: `http://127.0.0.1:8000/api/docs/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`

Important:
- `0.0.0.0` is a bind address, not a browser destination.
- Do not open `http://0.0.0.0:8000/...` in browser.

## Environment Files

### Root `.env` (backend runtime)

Backend reads environment from root `.env`.
Required keys:

- `SECRET_KEY`
- `DEBUG`
- `ALLOW_ALL_HOSTS_IN_DEBUG`
- `ALLOWED_HOSTS`
- `DB_ENGINE`
- `DB_NAME`
- `JWT_ACCESS_TOKEN_LIFETIME`
- `JWT_REFRESH_TOKEN_LIFETIME`
- `CORS_ALLOWED_ORIGINS`
- `OPEN_FOOD_FACTS_API_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_BASE_URL`
- `PAYPAL_WEBHOOK_ID`

Optional S3 keys:
- `USE_S3`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_STORAGE_BUCKET_NAME`
- `AWS_S3_REGION_NAME`

### `front-end/.env`

Use `front-end/.env.example` as template.
Do not put backend secrets here.

## Auth Notes

- Mobile login accepts email or username.
- Admin login through mobile API works with superuser credentials.
- JWT endpoints:
  - `POST /api/auth/token/`
  - `POST /api/auth/token/refresh/`
  - `GET /api/auth/me/`

## Payment Notes (PayPal)

Payment flow:
1. Create invoice
2. Create PayPal order (`/api/invoices/{id}/create_paypal_order/`)
3. Open PayPal approval URL
4. Capture order (`/api/invoices/{id}/capture_paypal_order/`)

If capture fails, backend now returns structured PayPal error details (instead of opaque 502 only), including status/debug fields when available.

## Troubleshooting

### "Network error ... 10.0.2.2"
- `10.0.2.2` works only for Android emulator.
- On physical phone use your laptop LAN IP (`http://<YOUR_PC_IP>:8000/api`).

### "Cannot reach 0.0.0.0"
- Use `127.0.0.1` on PC browser.

### Red screen with SVG `NaN` in admin dashboard
- Chart guards are in place now.
- Restart Expo with cache clear:
```bash
npx expo start -c --host lan
```

### PayPal capture returns 4xx/5xx
- Verify sandbox credentials in root `.env`.
- Ensure you approved payment in PayPal before capture.

## Useful Commands

Backend:
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
python manage.py migrate
python manage.py createsuperuser
pytest invoices/tests.py -q
```

Frontend:
```bash
cd front-end
npx expo start -c --host lan
npm test
```

## Repository Layout

```text
trinity-dev-app/
  backend/      Django REST API
  front-end/    Expo React Native app
  .env          Backend environment
```

