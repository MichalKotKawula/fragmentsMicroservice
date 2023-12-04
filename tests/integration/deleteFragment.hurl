# tests/integration/delete-fragment.hurl
# Testing the DELETE /fragments/:id API endpoint

# POST a fragment first, then delete it
POST http://localhost:8080/v1/fragments
Content-Type: application/json

[BasicAuth]
user1@email.com:password1

`{"type": "fragment", "message": "This is a fragment!"}`

HTTP/1.1 201
[Captures]
url: header "Location"

####################################################################

# Delete the fragment we just created
DELETE {{url}}

[BasicAuth]
user1@email.com:password1

`Hello **world**!`

HTTP/1.1 200
Content-Length: 15
[Asserts]
jsonpath "$.status" == "ok"

####################################################################

# Try to retrieve the deleted fragment, which should return an HTTP 404
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
