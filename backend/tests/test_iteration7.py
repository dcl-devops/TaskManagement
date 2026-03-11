"""
Backend API Tests for Iteration 7 - Customer CRUD, Customer Filters, Admin User Email Edit
Tests new features: Customers module, Customer-based filtering in Projects/Meetings/Tasks,
Email editing in admin users, and Reset Password functionality.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@democorp.com"
ADMIN_PASSWORD = "Admin@123"

@pytest.fixture(scope="module")
def auth_session():
    """Login and return authenticated session"""
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    token = data.get("token")
    assert token, "No token returned"
    session.headers.update({"Authorization": f"Bearer {token}"})
    return session


class TestCustomerCRUD:
    """Test Customer CRUD operations"""
    
    created_customer_id = None
    
    def test_get_customers_list(self, auth_session):
        """Test GET /api/customers returns list"""
        response = auth_session.get(f"{BASE_URL}/api/customers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} customers")
        
    def test_create_customer(self, auth_session):
        """Test POST /api/customers creates a new customer"""
        payload = {
            "name": "TEST_Customer_Corp",
            "customer_code": "TEST-001",
            "industry": "Technology",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "contact_person": "Test Contact",
            "mobile": "+91-9999999999",
            "email": "test@testcustomer.com",
            "status": "active"
        }
        response = auth_session.post(f"{BASE_URL}/api/customers", json=payload)
        assert response.status_code == 201, f"Failed to create customer: {response.text}"
        customer = response.json()
        assert customer["name"] == payload["name"]
        assert customer["customer_code"] == payload["customer_code"]
        assert customer["industry"] == payload["industry"]
        assert customer["status"] == "active"
        assert "id" in customer
        TestCustomerCRUD.created_customer_id = customer["id"]
        print(f"Created customer with ID: {customer['id']}")
        
    def test_get_customer_by_id(self, auth_session):
        """Test GET /api/customers/:id returns customer with projects/meetings/tasks"""
        assert TestCustomerCRUD.created_customer_id, "No customer created"
        response = auth_session.get(f"{BASE_URL}/api/customers/{TestCustomerCRUD.created_customer_id}")
        assert response.status_code == 200
        customer = response.json()
        assert customer["id"] == TestCustomerCRUD.created_customer_id
        assert customer["name"] == "TEST_Customer_Corp"
        # Customer detail should include projects, meetings, tasks lists
        assert "projects" in customer
        assert "meetings" in customer
        assert "tasks" in customer
        assert isinstance(customer["projects"], list)
        assert isinstance(customer["meetings"], list)
        assert isinstance(customer["tasks"], list)
        print("Customer detail retrieved successfully with projects/meetings/tasks")
        
    def test_update_customer(self, auth_session):
        """Test PUT /api/customers/:id updates customer"""
        assert TestCustomerCRUD.created_customer_id, "No customer created"
        payload = {
            "name": "TEST_Customer_Corp_Updated",
            "customer_code": "TEST-001",
            "industry": "FinTech",
            "city": "Bangalore",
            "state": "Karnataka",
            "country": "India",
            "contact_person": "Updated Contact",
            "mobile": "+91-8888888888",
            "email": "updated@testcustomer.com",
            "status": "active"
        }
        response = auth_session.put(f"{BASE_URL}/api/customers/{TestCustomerCRUD.created_customer_id}", json=payload)
        assert response.status_code == 200
        customer = response.json()
        assert customer["name"] == "TEST_Customer_Corp_Updated"
        assert customer["industry"] == "FinTech"
        assert customer["city"] == "Bangalore"
        print("Customer updated successfully")
        
    def test_customer_search_filter(self, auth_session):
        """Test GET /api/customers with search parameter"""
        response = auth_session.get(f"{BASE_URL}/api/customers", params={"search": "TEST"})
        assert response.status_code == 200
        customers = response.json()
        # Should find our test customer
        found = any(c["name"] == "TEST_Customer_Corp_Updated" for c in customers)
        assert found, "Search filter not working"
        print(f"Search filter returned {len(customers)} customers")
        
    def test_customer_status_filter(self, auth_session):
        """Test GET /api/customers with status filter"""
        response = auth_session.get(f"{BASE_URL}/api/customers", params={"status": "active"})
        assert response.status_code == 200
        customers = response.json()
        for c in customers:
            assert c["status"] == "active", "Status filter not working"
        print(f"Status filter returned {len(customers)} active customers")
        
    def test_delete_customer(self, auth_session):
        """Test DELETE /api/customers/:id"""
        assert TestCustomerCRUD.created_customer_id, "No customer created"
        response = auth_session.delete(f"{BASE_URL}/api/customers/{TestCustomerCRUD.created_customer_id}")
        assert response.status_code == 200
        # Verify deletion
        response2 = auth_session.get(f"{BASE_URL}/api/customers/{TestCustomerCRUD.created_customer_id}")
        assert response2.status_code == 404
        print("Customer deleted successfully")


class TestProjectCustomerIntegration:
    """Test Customer integration in Projects"""
    
    test_customer_id = None
    test_project_id = None
    
    def test_create_customer_for_project(self, auth_session):
        """Create a customer to link to project"""
        payload = {
            "name": "TEST_Project_Customer",
            "customer_code": "TEST-PRJ-001",
            "industry": "Manufacturing",
            "status": "active"
        }
        response = auth_session.post(f"{BASE_URL}/api/customers", json=payload)
        assert response.status_code == 201
        TestProjectCustomerIntegration.test_customer_id = response.json()["id"]
        print(f"Created test customer: {TestProjectCustomerIntegration.test_customer_id}")
        
    def test_create_project_with_customer(self, auth_session):
        """Test creating project with customer_id"""
        payload = {
            "title": "TEST_Project_With_Customer",
            "description": "Test project linked to customer",
            "priority": "high",
            "status": "active",
            "customer_id": TestProjectCustomerIntegration.test_customer_id
        }
        response = auth_session.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 201
        project = response.json()
        TestProjectCustomerIntegration.test_project_id = project["id"]
        print(f"Created project {project['id']} with customer_id")
        
    def test_get_project_shows_customer(self, auth_session):
        """Verify project detail includes customer name"""
        response = auth_session.get(f"{BASE_URL}/api/projects/{TestProjectCustomerIntegration.test_project_id}")
        assert response.status_code == 200
        project = response.json()
        assert project["customer_id"] == TestProjectCustomerIntegration.test_customer_id
        assert project.get("customer_name") == "TEST_Project_Customer"
        print("Project shows customer_name correctly")
        
    def test_projects_filter_by_customer(self, auth_session):
        """Test GET /api/projects with customer_id filter"""
        response = auth_session.get(f"{BASE_URL}/api/projects", params={"customer_id": TestProjectCustomerIntegration.test_customer_id})
        assert response.status_code == 200
        projects = response.json()
        # Should find our test project
        found = any(p["id"] == TestProjectCustomerIntegration.test_project_id for p in projects)
        assert found, "Customer filter on projects not working"
        print(f"Customer filter returned {len(projects)} projects")
        
    def test_cleanup_project_and_customer(self, auth_session):
        """Cleanup test data"""
        if TestProjectCustomerIntegration.test_project_id:
            auth_session.delete(f"{BASE_URL}/api/projects/{TestProjectCustomerIntegration.test_project_id}")
        if TestProjectCustomerIntegration.test_customer_id:
            auth_session.delete(f"{BASE_URL}/api/customers/{TestProjectCustomerIntegration.test_customer_id}")
        print("Cleanup complete")


class TestMeetingCustomerFilter:
    """Test Customer filter in Meetings"""
    
    def test_meetings_endpoint_accepts_customer_filter(self, auth_session):
        """Test GET /api/meetings with customer_id parameter"""
        response = auth_session.get(f"{BASE_URL}/api/meetings", params={"customer_id": "999"})
        assert response.status_code == 200
        meetings = response.json()
        assert isinstance(meetings, list)
        print(f"Meetings customer filter works, returned {len(meetings)} meetings")


class TestTaskCustomerFilter:
    """Test Customer filter in Tasks"""
    
    def test_tasks_endpoint_accepts_customer_filter(self, auth_session):
        """Test GET /api/tasks with customer_id parameter"""
        response = auth_session.get(f"{BASE_URL}/api/tasks", params={"customer_id": "999"})
        assert response.status_code == 200
        tasks = response.json()
        assert isinstance(tasks, list)
        print(f"Tasks customer filter works, returned {len(tasks)} tasks")


class TestAdminUserEmailEdit:
    """Test Admin user editing including email field"""
    
    test_user_id = None
    
    def test_create_test_user(self, auth_session):
        """Create a test user to edit"""
        payload = {
            "name": "TEST_EditUser",
            "email": "testedituser@example.com",
            "password": "TestPass123!",
            "role": "user"
        }
        response = auth_session.post(f"{BASE_URL}/api/admin/users", json=payload)
        assert response.status_code == 201
        user = response.json()
        TestAdminUserEmailEdit.test_user_id = user["id"]
        print(f"Created test user: {user['id']}")
        
    def test_edit_user_email(self, auth_session):
        """Test PUT /api/admin/users/:id can update email"""
        assert TestAdminUserEmailEdit.test_user_id, "No test user created"
        new_email = "updated_testedituser@example.com"
        payload = {
            "name": "TEST_EditUser_Updated",
            "email": new_email,
            "role": "user",
            "status": "active"
        }
        response = auth_session.put(f"{BASE_URL}/api/admin/users/{TestAdminUserEmailEdit.test_user_id}", json=payload)
        assert response.status_code == 200
        user = response.json()
        assert user["email"] == new_email
        print("User email updated successfully")
        
    def test_reset_password_endpoint(self, auth_session):
        """Test POST /api/admin/users/:id/reset-password"""
        assert TestAdminUserEmailEdit.test_user_id, "No test user created"
        payload = {"newPassword": "NewPassword123!"}
        response = auth_session.post(f"{BASE_URL}/api/admin/users/{TestAdminUserEmailEdit.test_user_id}/reset-password", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "Password reset" in data.get("message", "")
        print("Password reset successful")
        
    def test_reset_password_validation(self, auth_session):
        """Test password reset requires minimum 8 characters"""
        assert TestAdminUserEmailEdit.test_user_id, "No test user created"
        payload = {"newPassword": "short"}  # Less than 8 chars
        response = auth_session.post(f"{BASE_URL}/api/admin/users/{TestAdminUserEmailEdit.test_user_id}/reset-password", json=payload)
        assert response.status_code == 400
        print("Password validation works correctly")
        
    def test_cleanup_test_user(self, auth_session):
        """Cleanup - Note: No delete endpoint in admin, so user remains but deactivated"""
        # Just logging for reference
        print(f"Test user {TestAdminUserEmailEdit.test_user_id} created - manual cleanup may be needed")


class TestProjectUpdates:
    """Test Project Updates functionality (for tabbed view)"""
    
    def test_get_project_updates(self, auth_session):
        """Test GET /api/projects/:id/updates"""
        # Use existing project ID 3 (Acme Redesign from seed data)
        response = auth_session.get(f"{BASE_URL}/api/projects/3/updates")
        assert response.status_code == 200
        updates = response.json()
        assert isinstance(updates, list)
        print(f"Project updates endpoint works, returned {len(updates)} updates")
        
    def test_post_project_update(self, auth_session):
        """Test POST /api/projects/:id/updates"""
        payload = {"remark": "TEST_Update: Progress check"}
        response = auth_session.post(f"{BASE_URL}/api/projects/3/updates", json=payload)
        assert response.status_code == 201
        update = response.json()
        assert update["remark"] == payload["remark"]
        assert "user_name" in update
        print("Project update posted successfully")


class TestExistingData:
    """Test with existing seeded data"""
    
    def test_existing_customer(self, auth_session):
        """Verify existing customer (Acme Corp, id=2) works"""
        response = auth_session.get(f"{BASE_URL}/api/customers/2")
        assert response.status_code == 200
        customer = response.json()
        assert customer["name"] == "Acme Corp"
        assert "projects" in customer
        print(f"Existing customer Acme Corp has {len(customer['projects'])} projects")
        
    def test_existing_project_with_customer(self, auth_session):
        """Verify existing project (Acme Redesign, id=3) shows customer"""
        response = auth_session.get(f"{BASE_URL}/api/projects/3")
        assert response.status_code == 200
        project = response.json()
        assert project["customer_id"] == 2
        assert project["customer_name"] == "Acme Corp"
        # Check tabbed data
        assert "meetings" in project
        assert "all_tasks" in project
        print(f"Project has {len(project['meetings'])} meetings and {len(project['all_tasks'])} tasks")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
