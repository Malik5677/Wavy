import urllib.request
import urllib.parse
import json

req = urllib.request.Request("http://localhost:3000/api/auth/send-otp", data=json.dumps({"phoneNumber":"+1234567890"}).encode('utf-8'), headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
data = json.loads(resp.read().decode('utf-8'))
code = data['mockCode']

req2 = urllib.request.Request("http://localhost:3000/api/auth/verify-otp", data=json.dumps({"phoneNumber":"+1234567890","code":code}).encode('utf-8'), headers={'Content-Type': 'application/json'})
resp2 = urllib.request.urlopen(req2)
data2 = json.loads(resp2.read().decode('utf-8'))
token = data2['token']

def test_get(url):
    try:
        req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
        r = urllib.request.urlopen(req)
        print(f"{url} -> {r.status} {r.read()[:50]}")
    except Exception as e:
        print(f"{url} -> Error {e}")
        if hasattr(e, 'read'):
            print(e.read()[:50])

test_get("http://localhost:3000/api/auth/me")
test_get("http://localhost:3000/api/status")
test_get("http://localhost:3000/api/community")
test_get("http://localhost:3000/api/chat")
test_get("http://localhost:3000/api/admin/stats")
test_get("http://localhost:3000/api/chat/search-users?q=test")
