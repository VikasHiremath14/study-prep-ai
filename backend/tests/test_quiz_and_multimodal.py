"""Unit tests for Anti-Web Search Quiz, Diagram Lens Explainer, References Curation & File Upload."""
import io
import pytest

def test_file_upload_txt_and_pdf(client):
    """Tests multipart file upload endpoint."""
    # Test TXT upload
    sample_text = b"Chapter 1: Asymptotic Complexity. Big-O provides an upper bound on asymptotic runtime. Dynamic arrays provide O(1) amortized insertion."
    response = client.post(
        "/api/documents/upload-file",
        files={"file": ("algorithms_notes.txt", io.BytesIO(sample_text), "text/plain")},
        data={
            "title": "Algorithms Quick Notes",
            "retention_score": "0.80",
            "grade_level": "engineering",
            "daily_allocated_hours": "1.5"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["title"] == "Algorithms Quick Notes"
    assert len(data["pages"]) >= 1
    assert "target_plan" in data


def test_page_references_retrieval(client):
    """Tests page-level curated YouTube and web reference retrieval."""
    # First ingest a sample document
    ingest_res = client.get("/api/documents/sample/dsa")
    assert ingest_res.status_code == 200
    doc_id = ingest_res.json().get("document_id", 1)

    ref_res = client.get(f"/api/reader/references/{doc_id}/1")
    assert ref_res.status_code == 200
    ref_data = ref_res.json()
    assert ref_data["status"] == "success"
    assert "youtube_videos" in ref_data
    assert len(ref_data["youtube_videos"]) >= 1
    assert "websites" in ref_data
    assert len(ref_data["websites"]) >= 1


def test_page_references_post_dynamic_analysis(client):
    """Tests that POST /api/reader/references dynamically analyzes page content across disciplines."""
    # 1. Test Literature/Media character analysis page (e.g. Breaking Bad)
    media_res = client.post("/api/reader/references", json={
        "document_id": 1,
        "page_number": 1,
        "page_text": "Walter White is a high school chemistry teacher who starts cooking methamphetamine as Heisenberg to secure his family financial future. Jesse Pinkman is his former student. Hank Schrader is a DEA agent. Gus Fring is a drug lord.",
        "document_title": "Breaking Bad Character Study"
    })
    assert media_res.status_code == 200
    media_data = media_res.json()
    assert media_data["status"] == "success"
    assert "Character" in media_data["topic"] or "Media" in media_data["domain"]
    assert len(media_data["youtube_videos"]) >= 1
    assert any("Screenplay" in v["channel"] or "Take" in v["channel"] or "Like Stories" in v["channel"] or "CrashCourse" in v["channel"] or "Masterclass" in v["title"] for v in media_data["youtube_videos"])

    # 2. Test Dijkstra Graph Algorithms page
    cs_res = client.post("/api/reader/references", json={
        "document_id": 1,
        "page_number": 3,
        "page_text": "Dijkstra algorithm computes the single source shortest path on weighted graphs with non-negative edge weights using a min-heap priority queue for edge relaxation.",
        "document_title": "Advanced Graph Theory"
    })
    assert cs_res.status_code == 200
    cs_data = cs_res.json()
    assert cs_data["status"] == "success"
    assert "Dijkstra" in cs_data["topic"] or "Shortest Path" in cs_data["topic"]
    assert any(v["youtube_id"] == "XB4MIexjvY0" for v in cs_data["youtube_videos"])

    # 3. Test Biology Cellular Respiration page
    bio_res = client.post("/api/reader/references", json={
        "document_id": 1,
        "page_number": 2,
        "page_text": "Cellular respiration in mitochondria generates ATP synthesis through glycolysis, Krebs cycle, and the electron transport chain.",
        "document_title": "Molecular Biology"
    })
    assert bio_res.status_code == 200
    bio_data = bio_res.json()
    assert bio_data["status"] == "success"
    assert "Biology" in bio_data["domain"] or "Respiration" in bio_data["topic"]

    # 4. Test Shift Registers / Digital Electronics page (e.g. SIPO)
    sipo_res = client.post("/api/reader/references", json={
        "document_id": 1,
        "page_number": 1,
        "page_text": "Serial-In Parallel-Out Shift Register: In this shift register, data is sent serially one bit at a time, but read out simultaneously in parallel across all flip-flops on the clock edge.",
        "document_title": "Digital Logic and Microprocessor Design"
    })
    assert sipo_res.status_code == 200
    sipo_data = sipo_res.json()
    assert sipo_data["status"] == "success"
    assert "Shift Register" in sipo_data["topic"]
    assert "Digital Electronics" in sipo_data["domain"]
    assert any(v.get("youtube_id") == "f7v_m5d5i-o" or "Neso Academy" in v.get("channel", "") or "Gate Smashers" in v.get("channel", "") for v in sipo_data["youtube_videos"])

    # 5. Test Arbitrary custom page
    custom_res = client.post("/api/reader/references", json={
        "document_id": 1,
        "page_number": 4,
        "page_text": "Quantum entanglement demonstrates non-local correlation between paired photons across spatial distances.",
        "document_title": "Modern Physics Concepts"
    })
    assert custom_res.status_code == 200
    custom_data = custom_res.json()
    assert custom_data["status"] == "success"
    assert "youtube_videos" in custom_data
    assert len(custom_data["youtube_videos"]) >= 1
    assert "websites" in custom_data
    assert len(custom_data["websites"]) >= 1


def test_diagram_lens_explanation(client):
    """Tests the multimodal diagram lens explainer."""
    payload = {
        "document_id": 1,
        "page_number": 5,
        "image_description": "AVL Tree showing a right rotation after inserting node 10 into left subtree",
        "student_question": "Why does a single right rotation rebalance this AVL tree?",
        "grade_level": "engineering",
        "document_title": "Data Structures & Algorithms"
    }
    response = client.post("/api/reader/lens-explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "explanation" in data
    assert len(data["explanation"]) > 20


def test_anti_web_search_quiz_generation_and_submission(client):
    """Tests generation of Anti-Web Search scenario quizzes and evaluation of student responses."""
    # 1. Generate quiz
    gen_payload = {
        "document_id": 1,
        "document_title": "Data Structures & Algorithmic Analysis",
        "pages_text": [
            "AVL trees maintain balance factor between -1 and +1. When an insertion causes a balance factor of +2 with a left child balance factor of -1, an LR double rotation is executed.",
            "Dynamic array resizing doubles capacity, ensuring O(1) amortized insertion time despite individual O(N) reallocation steps."
        ],
        "page_start": 1,
        "page_end": 4,
        "student_grade": "engineering",
        "num_questions": 3
    }
    gen_res = client.post("/api/quiz/generate", json=gen_payload)
    assert gen_res.status_code == 200
    quiz_data = gen_res.json()
    assert quiz_data["status"] == "success"
    questions = quiz_data["quiz_data"]["questions"]
    assert len(questions) >= 1

    # 2. Submit answers
    submit_payload = {
        "quiz_id": 1,
        "student_answers": {0: questions[0]["correct_index"]},
        "questions_data": questions
    }
    sub_res = client.post("/api/quiz/submit", json=submit_payload)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["status"] == "success"
    assert "score_percent" in sub_data
    assert "detailed_results" in sub_data


def test_feynman_technique_evaluation(client):
    """Tests Feynman technique open-ended explanation evaluation."""
    payload = {
        "document_title": "Data Structures & Algorithmic Analysis",
        "concept_topic": "Amortized Complexity",
        "pages_context": "Dynamic arrays double their capacity when full. While one copy takes O(N), the cost across N items is O(1).",
        "student_explanation": "When the array runs out of room, it buys a house twice as big and moves all its items over. Because it only does this big move occasionally, the moving fee is divided among all the items so each item only pays 1 dollar on average.",
        "student_grade": "engineering"
    }
    response = client.post("/api/quiz/feynman-evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    eval_res = data["evaluation"]
    assert "overall_mastery_score" in eval_res
    assert eval_res["overall_mastery_score"] >= 60
    assert "ai_critique" in eval_res

