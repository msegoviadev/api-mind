# curl-mind

LLM tools for HTTP API interaction: discover endpoints, understand contracts, execute requests.

## Workflow

```
list_apis → list_endpoints → get_endpoint_schema → execute_request
```

1. `list_apis` - Discover what APIs are loaded (optional if API is known)
2. `list_endpoints` - Find available endpoints (filter by method/path/section)
3. `get_endpoint_schema` - Understand request/response contract before calling
4. `execute_request` - Make the actual HTTP call

## Tools

### list_apis

Lists all APIs loaded from `specs/*.mind` files with names, titles, base URLs, and environments.

**Input:** none

**Output:**
```json
{
  "apis": [
    {
      "name": "payments",
      "title": "Payments API",
      "defaultUrl": "https://api.payments.example.com/v2",
      "environments": {
        "dev": "https://dev.payments.example.com/v2",
        "tst": "https://tst.payments.example.com/v2",
        "prod": "https://api.payments.example.com/v2"
      }
    }
  ]
}
```

### list_endpoints

Lists endpoints across all APIs. Use `filter` to narrow by method, path, or section.

**Input:**
- `filter` (optional): Substring match on method, path, or section

**Output:**
```json
{
  "environments": ["dev", "tst", "prod"],
  "endpoints": [
    { "api": "payments", "section": "Payments", "method": "POST", "path": "/payments", "auth": "oauth2 payments:write" }
  ]
}
```

### get_endpoint_schema

Returns the full contract for an endpoint in `.mind` notation.

**Input:**
- `api`: API name (matches `.mind` filename)
- `method`: HTTP method
- `path`: Endpoint path

**Output:** `.mind` block with endpoint details and referenced schemas.

### execute_request

Executes an HTTP request via curl.

**Input:**
- `api`: API name
- `method`: HTTP method (GET, POST, PUT, PATCH, DELETE)
- `path`: Relative path (e.g., `/payments/{paymentId}`)
- `env` (optional): Environment label (e.g., `tst`)
- `headers` (optional): Request headers object
- `body` (optional): JSON string body
- `query_params` (optional): Query string parameters
- `path_params` (optional): Path template interpolation values

**Output:**
```json
{
  "status": 201,
  "headers": { "Content-Type": "application/json" },
  "body": "{\"id\":\"abc\",\"status\":\"pending\"}"
}
```

**Error output:**
```json
{
  "error": "unknown_environment",
  "message": "Environment \"foo\" not found for API \"payments\". Available: dev, tst, prod"
}
```

## Conventions

1. **Never construct URLs manually** - Always use `env` parameter to select environment; base URL comes from `.mind` file
2. **Check environments first** - Call `list_apis` to see available environments before `execute_request`
3. **Pass auth via headers** - Authentication is your responsibility; pass `Authorization` header
4. **Use path_params for templates** - For paths like `/payments/{paymentId}`, use `path_params: { "paymentId": "abc-123" }`

## NOTATION Legend

```
NOTATION: ? optional  [ro] readOnly  [w] writeOnly  =val default
          ^ header  ~cookie  *N multipleOf N  | enum or nullable
          OneOf<A,B> on field = discriminated union
          {*:T} = map/dict  {...} = open object  extends = allOf
          & = inline extension  ~~name~~ = deprecated  # = inline note
          [multipart] [form] [binary] [text] = request body encoding
```

### Common patterns

| Notation | Meaning |
|----------|---------|
| `name` | Required string field |
| `name?` | Optional string field |
| `count:int` | Required integer field |
| `count?:int` | Optional integer field |
| `status:pending\|active` | Enum with values |
| `tags?:string[]` | Optional array of strings |
| `metadata?:{*:string}` | Optional map/dict |
| `id:uuid[ro]` | Read-only UUID field |
| `createdAt:datetime[ro]` | Read-only timestamp |
| `price:float(>=0)` | Float with constraint |
| `~~oldField~~` | Deprecated field |

### Endpoint notation

```
POST /payments [auth: oauth2 payments:write]
  ^X-Idempotency-Key:uuid, ^?X-Request-Id:uuid
  body: CreatePaymentRequest
  -> 201: Payment
     headers: Location:uri[ro]
  -> 400: ValidationErrorResponse
  -> 422: ErrorResponse
```

| Symbol | Meaning |
|--------|---------|
| `^` | Header parameter |
| `?` | Query parameter |
| `->` | Response |
| `[auth: ...]` | Authentication requirement |

## Setup

1. Place OpenAPI specs in `specs/` folder
2. Generate `.mind` files: `spec-mind sync --no-notation ./specs/`
3. Commit `.mind` files alongside source specs
4. Tools automatically load from `specs/*.mind`