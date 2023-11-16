# Confirm that posting a fragment when not authenticated produces a 401 error

POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
`This is a fragment!`

HTTP/1.1 401
[Asserts]
header "Content-Type" contains "application/json"
body == "{\"status\":\"error\",\"error\":{\"code\":401,\"message\":\"Unauthorized\"}}" 
