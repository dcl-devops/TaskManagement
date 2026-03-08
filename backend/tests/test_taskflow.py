"""
TaskFlow Enterprise Task Management - Backend API Tests
Tests: auth, admin (users/dept/location/company/designation), tasks, meetings, projects, dashboard, reports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@democorp.com"
ADMIN_PASSWORD = "Admin@1234"
ADMIN_NAME = "Admin User"
ORG_NAME = "Demo Corp"

# Shared state
state = {}


@pytest.fixture(scope="module")
def admin_token():
    """Signup or login admin, return token"""
    # Try signup first
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "name": ADMIN_NAME, "orgName": ORG_NAME,
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    })
    if r.status_code in [201, 409]:
        if r.status_code == 409:
            # Already exists, login
            r2 = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
            })
            assert r2.status_code == 200, f"Login failed: {r2.text}"
            return r2.json()["token"]
        return r.json()["token"]
    pytest.fail(f"Signup failed: {r.status_code} {r.text}")


@pytest.fixture(scope="module")
def admin_client(admin_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"})
    return s


# --- Auth Tests ---
class TestAuth:
    def test_signup_duplicate(self, admin_client):
        r = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": ADMIN_NAME, "orgName": ORG_NAME,
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert r.status_code == 409

    def test_login_success(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL

    def test_login_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": "wrongpass"
        })
        assert r.status_code == 401

    def test_auth_me(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# --- Admin Master Data Tests ---
class TestMasterData:
    def test_create_department(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/admin/departments", json={"name": "TEST_Engineering"})
        assert r.status_code in [200, 201, 409]
        if r.status_code != 409:
            data = r.json()
            assert "id" in data
            state["dept_id"] = data["id"]

    def test_list_departments(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/departments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_location(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/admin/locations", json={"name": "TEST_Mumbai"})
        assert r.status_code in [200, 201, 409]
        if r.status_code != 409:
            data = r.json()
            assert "id" in data
            state["loc_id"] = data["id"]

    def test_list_locations(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/locations")
        assert r.status_code == 200

    def test_create_company(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/admin/companies", json={"name": "TEST_Demo Corp"})
        assert r.status_code in [200, 201, 409]
        if r.status_code != 409:
            data = r.json()
            assert "id" in data
            state["company_id"] = data["id"]

    def test_create_designation(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/admin/designations", json={"name": "TEST_Engineer"})
        assert r.status_code in [200, 201, 409]
        if r.status_code != 409:
            data = r.json()
            assert "id" in data
            state["desig_id"] = data["id"]


# --- Admin Users Tests ---
class TestAdminUsers:
    def test_list_users(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 200
        data = r.json()
        # Response may be a list or {users: [...], total: n}
        assert isinstance(data, list) or "users" in data

    def test_create_manager(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/admin/users", json={
            "name": "TEST_John Manager", "email": "testmanager_jm@democorp.com",
            "password": "Manager@1234", "role": "manager"
        })
        assert r.status_code in [200, 201, 409]
        if r.status_code != 409:
            data = r.json()
            assert "id" in data
            state["manager_id"] = data["id"]

    def test_create_employee(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/admin/users", json={
            "name": "TEST_Jane Employee", "email": "testjane_emp@democorp.com",
            "password": "Employee@1234", "role": "user"
        })
        assert r.status_code in [200, 201, 409]
        if r.status_code != 409:
            data = r.json()
            assert "id" in data
            state["employee_id"] = data["id"]


# --- Tasks Tests ---
class TestTasks:
    def test_list_tasks(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/tasks")
        assert r.status_code == 200

    def test_create_task(self, admin_client):
        payload = {
            "title": "TEST_Fix login bug",
            "priority": "high",
            "status": "open",
        }
        if state.get("employee_id"):
            payload["assigned_to"] = state["employee_id"]
        r = admin_client.post(f"{BASE_URL}/api/tasks", json=payload)
        assert r.status_code in [200, 201]
        data = r.json()
        assert "id" in data
        state["task_id"] = data["id"]

    def test_get_task(self, admin_client):
        if not state.get("task_id"):
            pytest.skip("No task created")
        r = admin_client.get(f"{BASE_URL}/api/tasks/{state['task_id']}")
        assert r.status_code == 200

    def test_add_comment(self, admin_client):
        if not state.get("task_id"):
            pytest.skip("No task created")
        r = admin_client.post(f"{BASE_URL}/api/tasks/{state['task_id']}/comments", json={
            "comment": "TEST_This is a comment"
        })
        assert r.status_code in [200, 201]


# --- Meetings Tests ---
class TestMeetings:
    def test_list_meetings(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/meetings")
        assert r.status_code == 200

    def test_create_meeting(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/meetings", json={
            "title": "TEST_Sprint Planning",
            "meeting_date": "2026-03-01",
            "start_time": "10:00",
            "end_time": "11:00"
        })
        assert r.status_code in [200, 201]
        data = r.json()
        assert "id" in data
        state["meeting_id"] = data["id"]


# --- Projects Tests ---
class TestProjects:
    def test_list_projects(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/projects")
        assert r.status_code == 200

    def test_create_project(self, admin_client):
        r = admin_client.post(f"{BASE_URL}/api/projects", json={
            "title": "TEST_Q1 Initiative",
            "status": "active"
        })
        assert r.status_code in [200, 201]
        data = r.json()
        assert "id" in data


# --- Dashboard & Reports ---
class TestDashboardReports:
    def test_dashboard_stats(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 200

    def test_reports_overdue(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/reports/overdue-tasks")
        assert r.status_code == 200

    def test_calendar(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/calendar/events")
        assert r.status_code == 200
