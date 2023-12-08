# tests/integration/put-fragments.hurl
# POST a fragment first, then update its data

POST http://localhost:8080/v1/fragments
Content-Type: text/markdown

[BasicAuth]
user2@email.com:password2

`## This is a fragment!`

HTTP/1.1 201

[Captures]
url: header "Location"
fragment_id: jsonpath "$.fragment.id"

####################################################################

# Update the fragment we just created
PUT {{url}}
Content-Type: text/markdown

[BasicAuth]
user2@email.com:password2

`Hello **world**!`

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment_id}}
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 16
jsonpath "$.fragment.formats" count == 3

####################################################################

# Make sure that the fragment's contents have changed as well
GET {{url}}

[BasicAuth]
user2@email.com:password2

HTTP/1.1 200
Content-Type: text/markdown
Content-Length: 16
[Asserts]
body == "Hello **world**!"
