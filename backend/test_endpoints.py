from fastapi.testclient import TestClient
from app.main import app
import json, sys

client = TestClient(app)

# Login
resp = client.post('/api/auth/login', json={'email':'admin@university.edu','password':'password123'})
print(f'Login: {resp.status_code}')
token = resp.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Test /me
resp2 = client.get('/api/auth/me', headers=headers)
print(f'/me: {resp2.status_code}')
if resp2.status_code != 200:
    print(f'Error: {json.dumps(resp2.json(), indent=2)[:500]}')
else:
    data = resp2.json()
    print(f'User: {data["name"]} ({data["role"]})')

# Test /admin/students
resp3 = client.get('/api/admin/students', headers=headers)
print(f'/students: {resp3.status_code}')
if resp3.status_code == 200:
    students = resp3.json()
    print(f'Students count: {len(students)}')
    if students:
        s = students[0]
        print(f'First: {s["name"]} ({s["reg_no"]})')
else:
    print(f'Error: {json.dumps(resp3.json(), indent=2)[:500]}')

# Test /admin/departments
resp4 = client.get('/api/admin/departments', headers=headers)
print(f'/departments: {resp4.status_code}')
if resp4.status_code == 200:
    depts = resp4.json()
    print(f'Departments: {len(depts)}')
    for d in depts:
        print(f'  {d["code"]} - {d["name"]} - Students: {d["student_count"]}')

# Test /admin/attendance (faculty role)
resp5 = client.post('/api/auth/login', json={'email':'sarah.jenkins@university.edu','password':'password123'})
print(f'\nFaculty Login: {resp5.status_code}')
fac_token = resp5.json()['access_token']
fac_headers = {'Authorization': f'Bearer {fac_token}'}

resp6 = client.get('/api/faculty/active-periods', headers=fac_headers)
print(f'/faculty/active-periods: {resp6.status_code}')
if resp6.status_code != 200:
    print(f'Error: {json.dumps(resp6.json(), indent=2)[:500]}')

# Test /faculty/dashboard
resp7 = client.get('/api/faculty/dashboard', headers=fac_headers)
print(f'/faculty/dashboard: {resp7.status_code}')

# Test /faculty/students/search
resp8 = client.get('/api/faculty/students/search', headers=fac_headers)
print(f'/faculty/students/search: {resp8.status_code}')
if resp8.status_code == 200:
    results = resp8.json()
    print(f'Students found: {len(results)}')
