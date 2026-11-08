# API contracts

Base path: `/api/v1`  
Auth: session cookie `tmai_session` (auto-created)  
OpenAPI UI: `/docs`

## Health

- `GET /health`

## Patients

- `GET /patients/me`
- `PATCH /patients/me`
- `GET /patients/me/dashboard`

## Conversations

- `POST /conversations`
- `GET /conversations`
- `GET /conversations/:id`
- `GET /conversations/token/:tokenNumber`
- `POST /conversations/:id/messages`
- `POST /conversations/:id/messages/stream`
- `POST /conversations/:id/end`

## Voice / avatar sessions

- `POST /voice-sessions`
- `POST /voice-sessions/:id/token`
- `POST /voice-sessions/:id/interrupt`
- `POST /voice-sessions/:id/end`

## Appointments (AI only)

- `GET /appointments`
- `POST /appointments`
- `GET /appointments/:id`
- `PATCH /appointments/:id`
- `POST /appointments/:id/cancel`

## Documents

- `GET /medical-documents`
- `POST /medical-documents/upload?type=&consultationId=`
- `GET /medical-documents/:id/download`
- `DELETE /medical-documents/:id`

## Prescriptions (AI records)

- `GET /prescriptions/consultation/:consultationId`
- `POST /prescriptions/consultation/:consultationId/generate`
- `GET /prescriptions/:id/download`

## Reports

- `GET /reports`
- `POST /reports/consultation/:consultationId`
- `GET /reports/:id`
- `POST /reports/:id/export`

## Medications / notifications / admin

- `GET /medications/lookup?q=`
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `GET /admin/metrics` (header `x-admin-key`)
- `GET /admin/safety-events`
