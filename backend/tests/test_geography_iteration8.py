"""
Geography API Tests - Iteration 8
Tests for /api/geography/countries, /api/geography/states, /api/geography/cities
Includes CRUD operations and cascading data verification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@democorp.com"
TEST_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for API requests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed with status {response.status_code}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestGeographyCountries:
    """Test /api/geography/countries endpoint"""

    def test_get_countries_returns_seeded_data(self, auth_headers):
        """Verify seeded countries are returned (166+ countries expected)"""
        response = requests.get(f"{BASE_URL}/api/geography/countries", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        countries = response.json()
        assert isinstance(countries, list), "Expected list of countries"
        # Should have at least 166 countries seeded
        assert len(countries) >= 166, f"Expected 166+ countries, got {len(countries)}"
        print(f"✓ Found {len(countries)} countries")

    def test_get_countries_includes_india(self, auth_headers):
        """Verify India is in the countries list with correct code"""
        response = requests.get(f"{BASE_URL}/api/geography/countries", headers=auth_headers)
        assert response.status_code == 200
        countries = response.json()
        india = next((c for c in countries if c['name'] == 'India'), None)
        assert india is not None, "India should be in countries list"
        assert india['code'] == 'IN', f"India code should be 'IN', got {india['code']}"
        print(f"✓ India found with ID={india['id']}, code=IN")

    def test_search_countries(self, auth_headers):
        """Test country search functionality"""
        response = requests.get(f"{BASE_URL}/api/geography/countries", 
                               params={"search": "United"}, headers=auth_headers)
        assert response.status_code == 200
        countries = response.json()
        assert len(countries) > 0, "Expected at least one result for 'United'"
        # Should include USA and UK
        names = [c['name'] for c in countries]
        assert any('United' in n for n in names), "Search results should contain 'United'"
        print(f"✓ Search for 'United' returned {len(countries)} results: {names}")

    def test_create_update_delete_country(self, auth_headers):
        """Test CRUD for country"""
        # CREATE
        create_resp = requests.post(f"{BASE_URL}/api/geography/countries", 
                                   json={"name": "TEST_Country", "code": "TC"}, 
                                   headers=auth_headers)
        assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
        country = create_resp.json()
        assert country['name'] == 'TEST_Country'
        country_id = country['id']
        print(f"✓ Created country with ID={country_id}")

        # UPDATE
        update_resp = requests.put(f"{BASE_URL}/api/geography/countries/{country_id}",
                                  json={"name": "TEST_Country_Updated", "code": "TCU"},
                                  headers=auth_headers)
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        updated = update_resp.json()
        assert updated['name'] == 'TEST_Country_Updated'
        print(f"✓ Updated country name to {updated['name']}")

        # DELETE
        delete_resp = requests.delete(f"{BASE_URL}/api/geography/countries/{country_id}",
                                     headers=auth_headers)
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        print(f"✓ Deleted country ID={country_id}")


class TestGeographyStates:
    """Test /api/geography/states endpoint"""

    def test_get_all_states(self, auth_headers):
        """Verify states are returned"""
        response = requests.get(f"{BASE_URL}/api/geography/states", headers=auth_headers)
        assert response.status_code == 200
        states = response.json()
        assert isinstance(states, list), "Expected list of states"
        assert len(states) > 0, "Expected at least one state"
        print(f"✓ Found {len(states)} states total")

    def test_get_indian_states_by_country_id(self, auth_headers):
        """Verify 36 Indian states/UTs are returned when filtering by India's country_id"""
        # First get India's ID
        countries_resp = requests.get(f"{BASE_URL}/api/geography/countries", 
                                      params={"search": "India"}, headers=auth_headers)
        countries = countries_resp.json()
        india = next((c for c in countries if c['name'] == 'India'), None)
        assert india is not None, "India not found in countries"
        india_id = india['id']

        # Get states for India
        states_resp = requests.get(f"{BASE_URL}/api/geography/states",
                                  params={"country_id": india_id}, headers=auth_headers)
        assert states_resp.status_code == 200
        states = states_resp.json()
        assert len(states) >= 36, f"Expected 36 Indian states/UTs, got {len(states)}"
        # Verify country_name is included
        for state in states[:3]:
            assert 'country_name' in state, "State should include country_name"
        print(f"✓ Found {len(states)} Indian states/UTs")

    def test_indian_states_include_key_states(self, auth_headers):
        """Verify key Indian states are present"""
        # Get India's ID first
        countries_resp = requests.get(f"{BASE_URL}/api/geography/countries", 
                                      params={"search": "India"}, headers=auth_headers)
        india = next((c for c in countries_resp.json() if c['name'] == 'India'), None)
        india_id = india['id']

        states_resp = requests.get(f"{BASE_URL}/api/geography/states",
                                  params={"country_id": india_id}, headers=auth_headers)
        states = states_resp.json()
        state_names = [s['name'] for s in states]
        
        key_states = ['Gujarat', 'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu']
        for key_state in key_states:
            assert key_state in state_names, f"{key_state} should be in Indian states"
        print(f"✓ Verified key states: {key_states}")

    def test_search_states(self, auth_headers):
        """Test state search functionality"""
        response = requests.get(f"{BASE_URL}/api/geography/states",
                               params={"search": "Gujarat"}, headers=auth_headers)
        assert response.status_code == 200
        states = response.json()
        assert len(states) > 0, "Expected Gujarat in search results"
        assert states[0]['name'] == 'Gujarat', "First result should be Gujarat"
        print(f"✓ Search for 'Gujarat' successful")


class TestGeographyCities:
    """Test /api/geography/cities endpoint"""

    def test_get_cities_with_state_and_country_names(self, auth_headers):
        """Verify cities include state_name and country_name"""
        response = requests.get(f"{BASE_URL}/api/geography/cities", 
                               params={"search": "Ahmedabad"}, headers=auth_headers)
        assert response.status_code == 200
        cities = response.json()
        assert len(cities) > 0, "Expected Ahmedabad in cities"
        ahmedabad = cities[0]
        assert ahmedabad['name'] == 'Ahmedabad', f"Expected Ahmedabad, got {ahmedabad['name']}"
        assert ahmedabad['state_name'] == 'Gujarat', f"State should be Gujarat, got {ahmedabad.get('state_name')}"
        assert ahmedabad['country_name'] == 'India', f"Country should be India, got {ahmedabad.get('country_name')}"
        print(f"✓ Ahmedabad found with state=Gujarat, country=India")

    def test_search_cities_returns_results(self, auth_headers):
        """Test city search across all cities"""
        response = requests.get(f"{BASE_URL}/api/geography/cities",
                               params={"search": "mumbai"}, headers=auth_headers)
        assert response.status_code == 200
        cities = response.json()
        assert len(cities) > 0, "Expected Mumbai in search results"
        mumbai = cities[0]
        assert 'Mumbai' in mumbai['name'], f"Expected Mumbai, got {mumbai['name']}"
        print(f"✓ Search for 'mumbai' returned {len(cities)} results")

    def test_indian_cities_count(self, auth_headers):
        """Verify we have ~207 Indian cities seeded"""
        # Get India's ID
        countries_resp = requests.get(f"{BASE_URL}/api/geography/countries",
                                      params={"search": "India"}, headers=auth_headers)
        india = next((c for c in countries_resp.json() if c['name'] == 'India'), None)
        india_id = india['id']

        # Get all cities for India
        cities_resp = requests.get(f"{BASE_URL}/api/geography/cities",
                                  params={"country_id": india_id}, headers=auth_headers)
        assert cities_resp.status_code == 200
        cities = cities_resp.json()
        # Should have around 207 Indian cities
        assert len(cities) >= 200, f"Expected 200+ Indian cities, got {len(cities)}"
        print(f"✓ Found {len(cities)} Indian cities")

    def test_filter_cities_by_state(self, auth_headers):
        """Test filtering cities by state_id"""
        # Get Gujarat state ID
        states_resp = requests.get(f"{BASE_URL}/api/geography/states",
                                  params={"search": "Gujarat"}, headers=auth_headers)
        gujarat = states_resp.json()[0]
        gujarat_id = gujarat['id']

        # Get cities for Gujarat
        cities_resp = requests.get(f"{BASE_URL}/api/geography/cities",
                                  params={"state_id": gujarat_id}, headers=auth_headers)
        assert cities_resp.status_code == 200
        cities = cities_resp.json()
        assert len(cities) > 0, "Gujarat should have cities"
        # Verify all cities belong to Gujarat
        for city in cities:
            assert city['state_name'] == 'Gujarat', f"City {city['name']} should be in Gujarat"
        print(f"✓ Found {len(cities)} cities in Gujarat")

    def test_create_update_delete_city(self, auth_headers):
        """Test CRUD for city"""
        # Get Gujarat state ID first
        states_resp = requests.get(f"{BASE_URL}/api/geography/states",
                                  params={"search": "Gujarat"}, headers=auth_headers)
        gujarat = states_resp.json()[0]
        gujarat_id = gujarat['id']

        # CREATE
        create_resp = requests.post(f"{BASE_URL}/api/geography/cities",
                                   json={"name": "TEST_City_Gujarat", "state_id": gujarat_id},
                                   headers=auth_headers)
        assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
        city = create_resp.json()
        city_id = city['id']
        print(f"✓ Created city ID={city_id}")

        # UPDATE
        update_resp = requests.put(f"{BASE_URL}/api/geography/cities/{city_id}",
                                  json={"name": "TEST_City_Updated", "state_id": gujarat_id},
                                  headers=auth_headers)
        assert update_resp.status_code == 200
        print(f"✓ Updated city")

        # DELETE
        delete_resp = requests.delete(f"{BASE_URL}/api/geography/cities/{city_id}",
                                     headers=auth_headers)
        assert delete_resp.status_code == 200
        print(f"✓ Deleted city ID={city_id}")


class TestGlobalSearchAPI:
    """Test Global Search functionality via APIs"""

    def test_tasks_search_api(self, auth_headers):
        """Test /api/tasks search parameter"""
        response = requests.get(f"{BASE_URL}/api/tasks", 
                               params={"search": "test"}, headers=auth_headers)
        assert response.status_code == 200
        tasks = response.json()
        assert isinstance(tasks, list), "Expected list of tasks"
        print(f"✓ Task search returned {len(tasks)} results")

    def test_projects_search_api(self, auth_headers):
        """Test /api/projects search parameter"""
        response = requests.get(f"{BASE_URL}/api/projects",
                               params={"search": "Gearbox"}, headers=auth_headers)
        assert response.status_code == 200
        projects = response.json()
        assert isinstance(projects, list), "Expected list of projects"
        print(f"✓ Project search returned {len(projects)} results")

    def test_meetings_search_api(self, auth_headers):
        """Test /api/meetings search parameter"""
        response = requests.get(f"{BASE_URL}/api/meetings",
                               params={"search": "test"}, headers=auth_headers)
        assert response.status_code == 200
        meetings = response.json()
        assert isinstance(meetings, list), "Expected list of meetings"
        print(f"✓ Meeting search returned {len(meetings)} results")


class TestCascadingFilterAPIs:
    """Test that filtering works correctly for cascading filters"""

    def test_customers_api(self, auth_headers):
        """Verify customers API returns data"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        assert response.status_code == 200
        customers = response.json()
        assert isinstance(customers, list), "Expected list of customers"
        print(f"✓ Found {len(customers)} customers")

    def test_projects_filter_by_customer(self, auth_headers):
        """Test filtering projects by customer_id"""
        # Get customers first
        customers_resp = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        customers = customers_resp.json()
        if len(customers) == 0:
            pytest.skip("No customers to test filter")
        
        customer_id = customers[0]['id']
        # Filter projects by customer
        projects_resp = requests.get(f"{BASE_URL}/api/projects",
                                    params={"customer_id": customer_id}, headers=auth_headers)
        assert projects_resp.status_code == 200
        projects = projects_resp.json()
        # All returned projects should belong to this customer
        for proj in projects:
            assert proj.get('customer_id') == customer_id, f"Project {proj['id']} should have customer_id={customer_id}"
        print(f"✓ Projects filter by customer_id works, {len(projects)} projects for customer {customer_id}")

    def test_meetings_filter_by_customer(self, auth_headers):
        """Test filtering meetings by customer_id (via project)"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        customers = response.json()
        if len(customers) == 0:
            pytest.skip("No customers to test filter")
        
        customer_id = customers[0]['id']
        meetings_resp = requests.get(f"{BASE_URL}/api/meetings",
                                    params={"customer_id": customer_id}, headers=auth_headers)
        assert meetings_resp.status_code == 200
        print(f"✓ Meetings filter by customer_id returns {len(meetings_resp.json())} meetings")

    def test_tasks_filter_by_customer(self, auth_headers):
        """Test filtering tasks by customer_id"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        customers = response.json()
        if len(customers) == 0:
            pytest.skip("No customers to test filter")
        
        customer_id = customers[0]['id']
        tasks_resp = requests.get(f"{BASE_URL}/api/tasks",
                                 params={"customer_id": customer_id}, headers=auth_headers)
        assert tasks_resp.status_code == 200
        print(f"✓ Tasks filter by customer_id returns {len(tasks_resp.json())} tasks")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
