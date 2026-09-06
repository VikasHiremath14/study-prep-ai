"""Test authentication, OTP verification, Google auth, and student records."""


def test_auth_signup_and_signin(client):
    # 1. Send OTP
    otp_res = client.post("/api/auth/send-otp", json={
        "email": "teststudent@example.com",
        "phone_number": "+919876543210",
        "channel": "email"
    })
    assert otp_res.status_code == 200
    otp_data = otp_res.json()
    assert otp_data["status"] == "success"
    otp_code = otp_data["debug_otp"]

    # 2. Verify OTP
    verify_res = client.post("/api/auth/verify-otp", json={
        "email": "teststudent@example.com",
        "otp_code": otp_code
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["verified"] is True

    # 3. Signup new user with Name, Phone, Email, Password, Confirm Password
    signup_payload = {
        "name": "Test Student",
        "email": "teststudent@example.com",
        "phone_number": "+919876543210",
        "password": "secretpassword123",
        "confirm_password": "secretpassword123",
        "otp_code": otp_code,
        "grade_level": "engineering"
    }
    signup_res = client.post("/api/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201
    signup_data = signup_res.json()
    assert signup_data["status"] == "success"
    assert signup_data["user"]["email"] == "teststudent@example.com"
    student_id = signup_data["student"]["id"]

    # 4. Duplicate signup should be rejected
    dup_res = client.post("/api/auth/signup", json=signup_payload)
    assert dup_res.status_code == 400

    # 5. Signin with valid credentials
    signin_payload = {
        "email": "teststudent@example.com",
        "password": "secretpassword123"
    }
    signin_res = client.post("/api/auth/signin", json=signin_payload)
    assert signin_res.status_code == 200
    signin_data = signin_res.json()
    assert signin_data["status"] == "success"
    assert "records" in signin_data

    # 6. Signin with wrong password
    wrong_pwd_res = client.post("/api/auth/signin", json={
        "email": "teststudent@example.com",
        "password": "wrongpassword"
    })
    assert wrong_pwd_res.status_code == 401

    # 7. Google One-Click Auth
    google_res = client.post("/api/auth/google-auth", json={
        "email": "googleuser@example.com",
        "name": "Google User",
        "phone_number": "+919988776655",
        "supabase_uid": "supa-google-uid-123"
    })
    assert google_res.status_code == 200
    assert google_res.json()["auth_provider"] == "google"

    # 8. Retrieve full student records
    records_res = client.get(f"/api/auth/student/{student_id}/records")
    assert records_res.status_code == 200
    records_data = records_res.json()
    assert records_data["student_id"] == student_id
    assert "notes" in records_data["records"]
    assert "quiz_attempts" in records_data["records"]


def test_same_email_persistence_and_records(client):
    """Verifies that records for the same email ID are saved and retrieved on subsequent logins."""
    email = "vikas_persistence@example.com"
    pwd = "securepassword123"

    # 1. Signup user
    signup_res = client.post("/api/auth/signup", json={
        "name": "Vikas Persistence",
        "email": email,
        "password": pwd,
        "grade_level": "engineering"
    })
    assert signup_res.status_code == 201
    signup_data = signup_res.json()
    student_id = signup_data["student"]["id"]
    user_id = signup_data["user"]["id"]

    # 2. Complete Phase 1 retention profiling
    onboard_res = client.post("/api/students/onboard", json={
        "student_id": student_id,
        "user_id": user_id,
        "student_name": "Vikas Persistence",
        "grade_level": "engineering",
        "wake_time": "06:30",
        "sleep_time": "23:30",
        "sart_test": {
            "total_trials": 18,
            "commission_errors": 1,
            "omission_errors": 0,
            "sart_score": 0.85
        },
        "digit_span_test": {
            "max_span_capacity": 7,
            "working_memory_score": 0.88
        }
    })
    assert onboard_res.status_code == 200
    onboard_data = onboard_res.json()
    assert onboard_data["profile"]["retention_score"] > 0

    # 3. Calibrate Phase 2 Circadian Timetable
    calib_res = client.post("/api/scheduler/calibrate", json={
        "student_id": student_id,
        "student_name": "Vikas Persistence",
        "wake_time": "06:30",
        "sleep_time": "23:30",
        "target_study_hours": 5.0,
        "retention_score": onboard_data["profile"]["retention_score"],
        "break_interval_minutes": 45,
        "subjects": [
            {"name": "Data Structures & Algorithms", "difficulty": "hard", "allocated_hours": 2.0},
            {"name": "Operating Systems", "difficulty": "hard", "allocated_hours": 2.0}
        ]
    })
    assert calib_res.status_code == 200
    calib_data = calib_res.json()
    assert len(calib_data["slots"]) > 0

    # 4. User logs out and signs in again with the exact same email
    signin_res = client.post("/api/auth/signin", json={
        "email": email,
        "password": pwd
    })
    assert signin_res.status_code == 200
    signin_data = signin_res.json()
    
    # 5. Verify records exist and has_existing_profile is TRUE
    assert signin_data["has_existing_profile"] is True
    assert signin_data["records"]["retention_profile"] is not None
    assert signin_data["records"]["latest_schedule"] is not None
    assert len(signin_data["records"]["latest_schedule"]["slots"]) > 0
    assert signin_data["student"]["id"] == student_id

    # 6. Clear records should wipe study history while keeping account active
    clear_res = client.post(f"/api/auth/student/{student_id}/clear-records")
    assert clear_res.status_code == 200

    # 7. Sign in again after clearing records
    signin_post_clear = client.post("/api/auth/signin", json={
        "email": email,
        "password": pwd
    })
    assert signin_post_clear.status_code == 200
    assert signin_post_clear.json()["has_existing_profile"] is False

