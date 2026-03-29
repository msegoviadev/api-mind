# api-mind

## Auth Patterns

| Auth in Schema | curl Header |
|----------------|-------------|
| `None` | No header |
| `bearer` | `-H 'Authorization: Bearer <TOKEN>'` |
| `oauth2 <scopes>` | `-H 'Authorization: Bearer <TOKEN>'` |
| `api_key <header>` | `-H '<header>: <KEY>'` |
| `basic` | `-H 'Authorization: Basic <base64>'` |

## NOTATION

`?` optional | `[ro]` readOnly | `[w]` writeOnly | `=val` default
`^` header | `~` cookie | `|` enum | `{*:T}` map | `~~name~~` deprecated