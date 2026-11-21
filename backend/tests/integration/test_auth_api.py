def test_register_and_login_flow(client):
    # 1. Register new user
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@clipforge.com", "password": "StrongPassword123!"},
    )
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["email"] == "newuser@clipforge.com"
    assert "password_hash" not in data

    # 2. Duplicate registration rejected
    dup_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@clipforge.com", "password": "StrongPassword123!"},
    )
    assert dup_resp.status_code == 409
    assert dup_resp.json()["error"]["code"] == "USER_ALREADY_EXISTS"

    # 3. Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@clipforge.com", "password": "StrongPassword123!"},
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # 4. Access /auth/me with Bearer token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "newuser@clipforge.com"

    # 5. Access /auth/me without token is rejected
    unauth_resp = client.get("/api/v1/auth/me")
    assert unauth_resp.status_code == 401
