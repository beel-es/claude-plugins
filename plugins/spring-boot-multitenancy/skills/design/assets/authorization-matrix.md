# Authorization matrix

| Action | Route/use case | Actor types | Credential scope | Account role | Company grant | Resource rule | RLS ownership | Denial |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `projects:read` | `GET /v1/projects/{id}` | user, API key | API key: `projects:read` | active member | viewer+ | visible project | company/account/environment | 404 |
| `projects:write` | `PATCH /v1/projects/{id}` | user, API key | API key: `projects:write` | active member | editor+ | project open | company/account/environment | 403/404 |
| | | | | | | | | |

For each row define whether permissions intersect or override. Avoid implicit global administrators.
