"""
Test cases for Iteration 6 features:
1. Email/Mobile/Employee Code uniqueness validation on user create/update
2. Task project filter including meeting-linked tasks
3. Dashboard and other pages loading
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
AUTH_ENDPOINT = f"{BASE_URL}/api/auth/login"

# Test credentials
TEST_EMAIL = "admin@democorp.com"
TEST_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(AUTH_ENDPOINT, json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.fail(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture
def api_client(auth_token):
    """Session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestUserValidation:
    """Test email, mobile, employee code uniqueness validation"""
    
    def test_create_user_duplicate_email_returns_409(self, api_client):
        """POST /api/admin/users with duplicate email should return 409"""
        # First, get an existing user's email
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json().get("users", [])
        assert len(users) > 0, "Need at least one existing user for this test"
        existing_email = users[0]["email"]
        
        # Try to create a new user with the same email
        response = api_client.post(f"{BASE_URL}/api/admin/users", json={
            "name": "TEST_Duplicate Email User",
            "email": existing_email,
            "password": "TestPass123!"
        })
        
        assert response.status_code == 409, f"Expected 409, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Email already exists" in data.get("message", ""), f"Expected 'Email already exists' message, got: {data}"
    
    def test_create_user_duplicate_mobile_returns_409(self, api_client):
        """POST /api/admin/users with duplicate mobile should return 409"""
        # First, create a user with a mobile number
        unique_email = f"TEST_mobile_test_{os.urandom(4).hex()}@example.com"
        test_mobile = "9876543210"
        
        # Create first user with mobile
        response = api_client.post(f"{BASE_URL}/api/admin/users", json={
            "name": "TEST_Mobile User 1",
            "email": unique_email,
            "password": "TestPass123!",
            "mobile": test_mobile
        })
        
        if response.status_code == 409 and "Mobile number already exists" in response.text:
            # Mobile already exists from previous test, which is fine
            pass
        elif response.status_code == 201:
            # User created successfully, now try duplicate
            pass
        else:
            pytest.fail(f"Unexpected response: {response.status_code} - {response.text}")
        
        # Try to create another user with the same mobile
        unique_email2 = f"TEST_mobile_test2_{os.urandom(4).hex()}@example.com"
        response2 = api_client.post(f"{BASE_URL}/api/admin/users", json={
            "name": "TEST_Mobile User 2",
            "email": unique_email2,
            "password": "TestPass123!",
            "mobile": test_mobile
        })
        
        assert response2.status_code == 409, f"Expected 409 for duplicate mobile, got {response2.status_code}: {response2.text}"
        data = response2.json()
        assert "Mobile number already exists" in data.get("message", ""), f"Expected 'Mobile number already exists' message, got: {data}"
    
    def test_create_user_duplicate_employee_code_returns_409(self, api_client):
        """POST /api/admin/users with duplicate employee_code should return 409"""
        test_code = "TEST_EMP001"
        unique_email = f"TEST_empcode_test_{os.urandom(4).hex()}@example.com"
        
        # Create first user with employee code
        response = api_client.post(f"{BASE_URL}/api/admin/users", json={
            "name": "TEST_Employee Code User 1",
            "email": unique_email,
            "password": "TestPass123!",
            "employee_code": test_code
        })
        
        if response.status_code == 409 and "Employee code already exists" in response.text:
            pass  # Code already exists from previous test
        elif response.status_code == 201:
            pass  # User created successfully
        else:
            pytest.fail(f"Unexpected response: {response.status_code} - {response.text}")
        
        # Try to create another user with the same employee code
        unique_email2 = f"TEST_empcode_test2_{os.urandom(4).hex()}@example.com"
        response2 = api_client.post(f"{BASE_URL}/api/admin/users", json={
            "name": "TEST_Employee Code User 2",
            "email": unique_email2,
            "password": "TestPass123!",
            "employee_code": test_code
        })
        
        assert response2.status_code == 409, f"Expected 409 for duplicate employee_code, got {response2.status_code}: {response2.text}"
        data = response2.json()
        assert "Employee code already exists" in data.get("message", ""), f"Expected 'Employee code already exists' message, got: {data}"


class TestTaskProjectFilter:
    """Test task filtering by project includes meeting-linked tasks"""
    
    def test_tasks_endpoint_works(self, api_client):
        """GET /api/tasks should return tasks"""
        response = api_client.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Tasks endpoint should return a list"
        print(f"Found {len(data)} tasks")
    
    def test_projects_endpoint_works(self, api_client):
        """GET /api/projects should return projects"""
        response = api_client.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Projects endpoint should return a list"
        print(f"Found {len(data)} projects: {[p.get('title') for p in data]}")
        return data
    
    def test_meetings_endpoint_works(self, api_client):
        """GET /api/meetings should return meetings"""
        response = api_client.get(f"{BASE_URL}/api/meetings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Meetings endpoint should return a list"
        print(f"Found {len(data)} meetings: {[m.get('title') for m in data]}")
        return data
    
    def test_filter_tasks_by_project_includes_meeting_tasks(self, api_client):
        """Filter by project_id should include tasks from meetings linked to that project"""
        # Get all projects
        projects_response = api_client.get(f"{BASE_URL}/api/projects")
        projects = projects_response.json()
        
        # Get all meetings to find one linked to a project
        meetings_response = api_client.get(f"{BASE_URL}/api/meetings")
        meetings = meetings_response.json()
        
        # Find a meeting with a project_id
        meeting_with_project = None
        for m in meetings:
            if m.get("project_id"):
                meeting_with_project = m
                break
        
        if not meeting_with_project:
            pytest.skip("No meetings linked to projects found in test data")
        
        project_id = meeting_with_project["project_id"]
        meeting_id = meeting_with_project["id"]
        print(f"Testing with project_id={project_id}, meeting_id={meeting_id}")
        
        # Get all tasks without filter
        all_tasks_response = api_client.get(f"{BASE_URL}/api/tasks")
        all_tasks = all_tasks_response.json()
        
        # Count tasks that should be included:
        # - Tasks with project_id = project_id
        # - Tasks with meeting_id = any meeting linked to project_id
        expected_task_ids = set()
        for task in all_tasks:
            if task.get("project_id") == project_id:
                expected_task_ids.add(task["id"])
            if task.get("meeting_id") == meeting_id:
                expected_task_ids.add(task["id"])
        
        print(f"Expected tasks for project {project_id}: {expected_task_ids}")
        
        # Get tasks filtered by project
        filtered_response = api_client.get(f"{BASE_URL}/api/tasks", params={"project_id": project_id})
        assert filtered_response.status_code == 200
        filtered_tasks = filtered_response.json()
        
        filtered_task_ids = {t["id"] for t in filtered_tasks}
        print(f"Filtered tasks returned: {len(filtered_tasks)}")
        print(f"Filtered task IDs: {filtered_task_ids}")
        
        # All expected tasks should be in filtered results
        missing_tasks = expected_task_ids - filtered_task_ids
        assert len(missing_tasks) == 0, f"Missing tasks in filter result: {missing_tasks}"


class TestDashboardAndPages:
    """Test dashboard and other pages load correctly"""
    
    def test_dashboard_stats_endpoint(self, api_client):
        """GET /api/dashboard/stats should return stats"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data or "totalProjects" in data or isinstance(data, dict), f"Unexpected stats format: {data}"
        print(f"Dashboard stats: {data}")
    
    def test_users_list_endpoint(self, api_client):
        """GET /api/admin/users should return users list"""
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data, "Users endpoint should return users key"
        print(f"Found {len(data.get('users', []))} users")


# Cleanup test users after all tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(auth_token):
    """Cleanup TEST_ prefixed users after tests complete"""
    yield
    # Teardown - clean up test data
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    try:
        response = session.get(f"{BASE_URL}/api/admin/users")
        if response.status_code == 200:
            users = response.json().get("users", [])
            for user in users:
                if user.get("name", "").startswith("TEST_") or user.get("email", "").startswith("TEST_"):
                    try:
                        session.delete(f"{BASE_URL}/api/admin/users/{user['id']}")
                        print(f"Cleaned up test user: {user['email']}")
                    except:
                        pass
    except Exception as e:
        print(f"Cleanup error: {e}")
