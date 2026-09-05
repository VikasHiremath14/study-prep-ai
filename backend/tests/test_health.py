def test_root_endpoint(client):
    """Test the root welcome endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Welcome to Agentic Study-Prep AI" in data["message"]
    assert data["health_check"] == "/health"
    assert data["version"] == "0.1.0"


def test_health_check_endpoint(client):
    """Test the GET /health endpoint for status and components."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app_name"] == "Agentic Study-Prep AI"
    assert data["database"] == "connected"
    assert "llm_provider" in data
    assert "agents" in data
    assert data["agents"]["retention_profiler"] == "ready"
    assert data["agents"]["scheduler"] == "ready"
    assert data["agents"]["reader_rag"] == "ready"
    assert data["agents"]["orchestrator"] == "ready"


def test_api_health_route(client):
    """Test the /api/health route."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
