#!/usr/bin/env python3
"""
Simple test script for the FastAPI Gateway

This script tests the gateway endpoints without requiring external microservices.
"""

import sys
import asyncio
from fastapi.testclient import TestClient

# Import the gateway app
from gateway import app

def test_gateway():
    """Test the gateway endpoints"""
    print("Testing FastAPI Gateway...")
    print("=" * 60)
    
    client = TestClient(app)
    
    # Test 1: Root endpoint
    print("\n1. Testing root endpoint (/)...")
    response = client.get("/")
    assert response.status_code == 200
    assert "html-tool Gateway API" in response.json()["service"]
    print("   ✓ Root endpoint works")
    
    # Test 2: Health check
    print("\n2. Testing health check (/health)...")
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("   ✓ Health check works")
    
    # Test 3: Status endpoint
    print("\n3. Testing status endpoint (/status)...")
    response = client.get("/status")
    assert response.status_code == 200
    assert response.json()["gateway"] == "healthy"
    print("   ✓ Status endpoint works")
    
    # Test 4: Login endpoint
    print("\n4. Testing login endpoint (/auth/login)...")
    response = client.post(
        "/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    token = response.json()["access_token"]
    print("   ✓ Login works, token generated")
    
    # Test 5: Verify authentication with token
    print("\n5. Testing auth verification with token (/auth/verify)...")
    response = client.post(
        "/auth/verify",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["authenticated"] == True
    print("   ✓ Token verification works")
    
    # Test 6: Verify authentication with API key
    print("\n6. Testing auth verification with API key...")
    response = client.post(
        "/auth/verify",
        headers={"X-API-Key": "dev-api-key-1"}
    )
    assert response.status_code == 200
    assert response.json()["authenticated"] == True
    print("   ✓ API key verification works")
    
    # Test 7: Test authentication failure
    print("\n7. Testing authentication failure...")
    response = client.post("/auth/verify")
    assert response.status_code == 401
    print("   ✓ Authentication requirement enforced")
    
    # Test 8: Test OpenAPI docs availability
    print("\n8. Testing OpenAPI documentation (/docs)...")
    response = client.get("/docs")
    assert response.status_code == 200
    print("   ✓ API documentation available")
    
    # Test 9: Test OpenAPI spec
    print("\n9. Testing OpenAPI spec (/openapi.json)...")
    response = client.get("/openapi.json")
    assert response.status_code == 200
    openapi = response.json()
    assert "paths" in openapi
    assert "/upload" in openapi["paths"]
    assert "/generate-listing" in openapi["paths"]
    assert "/syndicate" in openapi["paths"]
    assert "/research" in openapi["paths"]
    assert "/status" in openapi["paths"]
    print("   ✓ All gateway endpoints defined in OpenAPI spec")
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        test_gateway()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
