# Confirm that posting an unsupported Content-Type produces a 415 error

POST http://localhost:8080/v1/fragments
Content-Type: application/pdf

[BasicAuth]
user1@email.com:password1

# Body of request
`This is a fragment!`

HTTP/1.1 415
[Asserts]
header "Content-Type" contains "application/json"
body == "{\"status\":\"error\",\"error\":{\"code\":415,\"message\":\"UNSUPPORTED_CONTENT_TYPE\"}}"
