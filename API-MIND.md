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
`^` header | `~` cookie | `*N` multipleOf N | `|` enum or nullable
`OneOf<A,B>` on field = discriminated union
`{*:T}` = map/dict | `{...}` = open object | `extends` = allOf
`&` = inline extension | `~~name~~` deprecated | `#` = inline note
`[multipart]` `[form]` `[binary]` `[text]` = request body encoding