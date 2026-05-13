# CRM Backend

Node.js, Express, and MongoDB backend for the AI Lead Analyzer CRM demo.

The backend is organized around:

- Lead scoring from CRM/customer requirement data
- Explainable lead insights: segment, signals, risks, and recommended sales action
- Personalized smart email drafts and response previews
- Activity logging for AI-generated follow-ups and communication actions

## Setup

```bash
cd Backend
npm install
copy .env.example .env
npm run dev
```

By default the server runs on `http://localhost:5000` and connects to:

```text
mongodb://127.0.0.1:27017/demo_crm
```

## Endpoints

- `GET /api/health`
- `GET /api/leads`
- `POST /api/leads`
- `POST /api/leads/analyze`
- `GET /api/leads/:id/insights`
- `POST /api/communication/smart-reply`
- `GET /api/communication/activities`
