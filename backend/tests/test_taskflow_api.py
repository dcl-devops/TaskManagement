"""
TaskFlow Enterprise API Tests
Tests all major API endpoints: Auth, Tasks, Meetings, Projects, Dashboard, Admin, Calendar, Reports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@democorp.com"
ADMIN_PASSWORD = "Admin@123"

# Test data prefix for cleanup
TEST_PREFIX = "TEST_"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for admin user"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.skip(f"Authentication failed: {response.text}")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestHealthEndpoint:
    """Health check tests"""
    
    def test_health_endpoint(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health endpoint working")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self, api_client):
        """Test login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "owner"
        print(f"✓ Login successful for {ADMIN_EMAIL}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_login_missing_fields(self, api_client):
        """Test login with missing fields"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL
        })
        assert response.status_code == 400
        print("✓ Missing password correctly rejected")
    
    def test_get_current_user(self, authenticated_client):
        """Test getting current user info"""
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert "name" in data
        assert "role" in data
        print(f"✓ Current user retrieved: {data['name']}")


class TestDashboardEndpoints:
    """Dashboard endpoint tests"""
    
    def test_dashboard_stats(self, authenticated_client):
        """Test dashboard stats endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "my_tasks" in data
        assert "total_visible" in data
        assert "overdue" in data
        assert "due_today" in data
        assert "due_this_week" in data
        assert "by_priority" in data
        assert "by_status" in data
        assert "recent_tasks" in data
        
        # Verify by_priority structure
        assert "critical" in data["by_priority"]
        assert "high" in data["by_priority"]
        assert "medium" in data["by_priority"]
        assert "low" in data["by_priority"]
        
        # Verify by_status structure
        assert "open" in data["by_status"]
        assert "in_progress" in data["by_status"]
        assert "on_hold" in data["by_status"]
        assert "resolved" in data["by_status"]
        assert "closed" in data["by_status"]
        
        print(f"✓ Dashboard stats retrieved: {data['my_tasks']} my tasks, {data['total_visible']} total")
    
    def test_team_workload(self, authenticated_client):
        """Test team workload endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/dashboard/team-workload")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Team workload retrieved: {len(data)} team members")


class TestTasksEndpoints:
    """Tasks CRUD endpoint tests"""
    
    def test_get_tasks(self, authenticated_client):
        """Test getting all tasks"""
        response = authenticated_client.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Tasks list retrieved: {len(data)} tasks")
    
    def test_get_my_tasks(self, authenticated_client):
        """Test getting my tasks"""
        response = authenticated_client.get(f"{BASE_URL}/api/tasks/my")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ My tasks retrieved: {len(data)} tasks")
    
    def test_create_task(self, authenticated_client):
        """Test creating a new task"""
        response = authenticated_client.post(f"{BASE_URL}/api/tasks", json={
            "title": f"{TEST_PREFIX}API Test Task",
            "description": "Created via pytest API test",
            "priority": "medium",
            "category": "task"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == f"{TEST_PREFIX}API Test Task"
        assert "task_number" in data
        assert data["priority"] == "medium"
        print(f"✓ Task created: {data['task_number']}")
        return data["id"]
    
    def test_get_specific_task(self, authenticated_client):
        """Test getting a specific task (TSK-0001)"""
        # First get all tasks to find one
        tasks_response = authenticated_client.get(f"{BASE_URL}/api/tasks")
        tasks = tasks_response.json()
        
        if len(tasks) > 0:
            task_id = tasks[0]["id"]
            response = authenticated_client.get(f"{BASE_URL}/api/tasks/{task_id}")
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "title" in data
            assert "status" in data
            print(f"✓ Task detail retrieved: {data['task_number']} - {data['title']}")
        else:
            pytest.skip("No tasks to retrieve")
    
    def test_filter_tasks_by_status(self, authenticated_client):
        """Test filtering tasks by status"""
        response = authenticated_client.get(f"{BASE_URL}/api/tasks?status=open")
        assert response.status_code == 200
        data = response.json()
        # All returned tasks should have status 'open'
        for task in data:
            assert task["status"] == "open"
        print(f"✓ Tasks filtered by status=open: {len(data)} tasks")
    
    def test_filter_tasks_by_priority(self, authenticated_client):
        """Test filtering tasks by priority"""
        response = authenticated_client.get(f"{BASE_URL}/api/tasks?priority=high")
        assert response.status_code == 200
        print("✓ Tasks filtered by priority=high")


class TestMeetingsEndpoints:
    """Meetings CRUD endpoint tests"""
    
    def test_get_meetings(self, authenticated_client):
        """Test getting all meetings"""
        response = authenticated_client.get(f"{BASE_URL}/api/meetings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Meetings list retrieved: {len(data)} meetings")
    
    def test_create_meeting(self, authenticated_client):
        """Test creating a new meeting"""
        response = authenticated_client.post(f"{BASE_URL}/api/meetings", json={
            "title": f"{TEST_PREFIX}API Test Meeting",
            "meeting_date": "2026-03-15T10:00:00.000Z",
            "description": "Test meeting description",
            "status": "open"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == f"{TEST_PREFIX}API Test Meeting"
        assert "meeting_number" in data
        print(f"✓ Meeting created: {data['meeting_number']}")
    
    def test_get_specific_meeting(self, authenticated_client):
        """Test getting a specific meeting"""
        meetings_response = authenticated_client.get(f"{BASE_URL}/api/meetings")
        meetings = meetings_response.json()
        
        if len(meetings) > 0:
            meeting_id = meetings[0]["id"]
            response = authenticated_client.get(f"{BASE_URL}/api/meetings/{meeting_id}")
            assert response.status_code == 200
            data = response.json()
            assert "title" in data
            print(f"✓ Meeting detail retrieved: {data['meeting_number']} - {data['title']}")
        else:
            pytest.skip("No meetings to retrieve")


class TestProjectsEndpoints:
    """Projects CRUD endpoint tests"""
    
    def test_get_projects(self, authenticated_client):
        """Test getting all projects"""
        response = authenticated_client.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Projects list retrieved: {len(data)} projects")
    
    def test_create_project(self, authenticated_client):
        """Test creating a new project"""
        response = authenticated_client.post(f"{BASE_URL}/api/projects", json={
            "title": f"{TEST_PREFIX}API Test Project",
            "description": "Created via pytest API test",
            "status": "active",
            "start_date": "2026-03-01",
            "end_date": "2026-06-30"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == f"{TEST_PREFIX}API Test Project"
        assert "project_number" in data
        print(f"✓ Project created: {data['project_number']}")
    
    def test_get_specific_project(self, authenticated_client):
        """Test getting a specific project"""
        projects_response = authenticated_client.get(f"{BASE_URL}/api/projects")
        projects = projects_response.json()
        
        if len(projects) > 0:
            project_id = projects[0]["id"]
            response = authenticated_client.get(f"{BASE_URL}/api/projects/{project_id}")
            assert response.status_code == 200
            data = response.json()
            assert "title" in data
            print(f"✓ Project detail retrieved: {data['project_number']} - {data['title']}")
        else:
            pytest.skip("No projects to retrieve")


class TestAdminEndpoints:
    """Admin endpoint tests"""
    
    def test_get_users(self, authenticated_client):
        """Test getting all users (admin function)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        # API returns {total, users} or array
        users = data.get("users", data) if isinstance(data, dict) else data
        assert isinstance(users, list)
        print(f"✓ Users list retrieved: {len(users)} users")
    
    def test_get_departments(self, authenticated_client):
        """Test getting departments (master data)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/departments")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Departments list retrieved: {len(data)} departments")
    
    def test_get_locations(self, authenticated_client):
        """Test getting locations (master data)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/locations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Locations list retrieved: {len(data)} locations")
    
    def test_get_companies(self, authenticated_client):
        """Test getting companies (master data)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/companies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Companies list retrieved: {len(data)} companies")
    
    def test_get_designations(self, authenticated_client):
        """Test getting designations (master data)"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/designations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Designations list retrieved: {len(data)} designations")


class TestCalendarEndpoints:
    """Calendar endpoint tests"""
    
    def test_get_calendar_events(self, authenticated_client):
        """Test getting calendar events"""
        response = authenticated_client.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Calendar events retrieved: {len(data)} events")


class TestReportsEndpoints:
    """Reports endpoint tests"""
    
    def test_get_overdue_tasks_report(self, authenticated_client):
        """Test getting overdue tasks report"""
        response = authenticated_client.get(f"{BASE_URL}/api/reports/overdue-tasks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Overdue tasks report retrieved: {len(data)} tasks")
    
    def test_get_task_aging_report(self, authenticated_client):
        """Test getting task aging report"""
        response = authenticated_client.get(f"{BASE_URL}/api/reports/task-aging")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Task aging report retrieved: {len(data)} tasks")
    
    def test_get_user_productivity_report(self, authenticated_client):
        """Test getting user productivity report"""
        response = authenticated_client.get(f"{BASE_URL}/api/reports/user-productivity")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ User productivity report retrieved: {len(data)} users")
    
    def test_get_department_performance_report(self, authenticated_client):
        """Test getting department performance report"""
        response = authenticated_client.get(f"{BASE_URL}/api/reports/department-performance")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Department performance report retrieved: {len(data)} departments")
    
    def test_get_project_progress_report(self, authenticated_client):
        """Test getting project progress report"""
        response = authenticated_client.get(f"{BASE_URL}/api/reports/project-progress")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Project progress report retrieved: {len(data)} projects")


class TestNotificationsEndpoints:
    """Notifications endpoint tests"""
    
    def test_get_notifications(self, authenticated_client):
        """Test getting notifications"""
        response = authenticated_client.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Notifications retrieved: {len(data)} notifications")
    
    def test_get_unread_count(self, authenticated_client):
        """Test getting unread notifications count"""
        response = authenticated_client.get(f"{BASE_URL}/api/notifications/unread-count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"✓ Unread count retrieved: {data['count']}")


class TestSignupFlow:
    """Signup endpoint test (separate from main tests to avoid creating test orgs)"""
    
    def test_signup_validation(self, api_client):
        """Test signup validation - password too short"""
        response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Test User",
            "orgName": "Test Org",
            "email": "testvalid@neworg.com",
            "password": "short"  # Too short
        })
        assert response.status_code == 400
        data = response.json()
        assert "Password" in data.get("message", "") or "password" in data.get("message", "").lower()
        print("✓ Signup validation working - short password rejected")
    
    def test_signup_missing_fields(self, api_client):
        """Test signup with missing fields"""
        response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "email": "test@test.com",
            "password": "Password123!"
        })
        assert response.status_code == 400
        print("✓ Signup validation working - missing fields rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
