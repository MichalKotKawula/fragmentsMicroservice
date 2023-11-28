POST http://localhost:8080/v1/fragments
Content-Type: text/plain

[BasicAuth]
user1@email.com:password1


`Hello S3!`

# 1. We expect to get back an HTTP 201 from the POST request
HTTP/1.1 201
[Captures]
url: header "Location"

# 2. Try to GET the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain
Content-Length: 9
[Asserts]
body == "Hello S3!"

# 3. Try to DELETE the fragment by its URL
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# 4. Try to retrieve the deleted fragment, which returns an HTTP 404
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
