"""Documents & Academic Ingestion API (Phase 3)."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.db.session import get_db
from backend.db.models import Document, Page, Chunk, DailyTarget, Student
from backend.agents.ingestion_agent import (
    ingestion_agent,
    IngestDocumentRequest,
    CalculateTargetsRequest
)

router = APIRouter(prefix="/documents", tags=["Academic Documents & Ingestion"])

# Pre-curated high-yield academic textbook samples
SAMPLE_PRESETS = {
    "dsa": {
        "title": "Data Structures & Algorithmic Analysis (Core CS)",
        "filename": "dsa_core_curriculum.pdf",
        "pages": [
            {"page_number": 1, "text": "Chapter 1: Asymptotic Analysis & Big-O Notation. The running time of an algorithm depends upon the input size and growth rate. Big-O defines the upper bound, Omega defines the lower bound, and Theta defines the tight asymptotic bound. Understanding cache locality and memory hierarchy is essential."},
            {"page_number": 2, "text": "Chapter 1.2: Amortized Complexity. Dynamic arrays double in size when capacity is reached. While a single reallocation takes O(N) time, the amortized cost across N insertions is strictly O(1)."},
            {"page_number": 3, "text": "Chapter 2: Linear Data Structures. Singly linked lists provide O(1) head insertion but O(N) arbitrary access. Doubly linked lists maintain pointers to both next and previous nodes, enabling O(1) removal given a node reference."},
            {"page_number": 4, "text": "Chapter 2.2: Stacks and Queues. Stacks operate on LIFO (Last In First Out) semantics, crucial for call stacks and DFS. Queues operate on FIFO (First In First Out), powering BFS and task scheduling pipelines."},
            {"page_number": 5, "text": "Chapter 3: Binary Search Trees & Self-Balancing AVL Trees. An unbalanced BST degrades to O(N) worst-case height. AVL trees maintain balance factors between -1 and +1 through LL, RR, LR, and RL rotations, guaranteeing O(log N) lookup."},
            {"page_number": 6, "text": "Chapter 3.2: Red-Black Trees. Red-Black trees enforce coloring invariants to ensure no path is more than twice as long as any other path. Used in standard C++ std::map and Java TreeMap implementations."},
            {"page_number": 7, "text": "Chapter 4: Priority Queues & Binary Heaps. Min-heaps satisfy the heap-order property where every parent is less than or equal to its children. Heapify operates in O(N) time, while insertion and extract-min operate in O(log N)."},
            {"page_number": 8, "text": "Chapter 4.2: Huffman Coding & Greedy Algorithms. Optimal prefix-free coding constructs a binary tree from symbol frequencies using a min-priority queue, minimizing expected bit length."},
            {"page_number": 9, "text": "Chapter 5: Graph Representations. Graphs are represented via Adjacency Matrices (O(V^2) memory, O(1) edge lookup) or Adjacency Lists (O(V + E) memory, optimal for sparse real-world networks)."},
            {"page_number": 10, "text": "Chapter 5.2: Graph Traversals. Breadth-First Search (BFS) computes shortest paths in unweighted graphs using a FIFO queue. Depth-First Search (DFS) discovers connected components and topological sort using recursion."},
            {"page_number": 11, "text": "Chapter 6: Shortest Path Algorithms. Dijkstra's algorithm uses a priority queue to compute single-source shortest paths in O((V + E) log V) time. Bellman-Ford handles negative edge weights in O(V * E) and detects negative cycles."},
            {"page_number": 12, "text": "Chapter 6.2: Minimum Spanning Trees. Kruskal's algorithm uses Union-Find with path compression and rank heuristics. Prim's algorithm grows a cut using a priority queue in O(E log V)."},
            {"page_number": 13, "text": "Chapter 7: Dynamic Programming Paradigm. DP solves optimization problems by breaking them down into overlapping subproblems with optimal substructure. Memoization uses top-down caching; tabulation builds bottom-up state tables."},
            {"page_number": 14, "text": "Chapter 7.2: Classic DP Formulations. 0/1 Knapsack, Longest Common Subsequence (LCS), Matrix Chain Multiplication, and Edit Distance. Space optimization reduces 2D tables to 1D sliding rows."},
            {"page_number": 15, "text": "Chapter 8: Advanced Tree Structures. Segment Trees and Fenwick Trees (Binary Indexed Trees) allow O(log N) point updates and range sum queries over dynamic arrays."},
            {"page_number": 16, "text": "Chapter 8.2: Disjoint Set Union (Union-Find). Near constant amortized time O(alpha(N)) via union by rank and path compression, essential for network connectivity and cycle detection."},
            {"page_number": 17, "text": "Chapter 9: Hashing & Collision Resolution. Hash functions distribute keys uniformly across buckets. Chaining resolves collisions via linked lists; open addressing uses linear probing, quadratic probing, or double hashing."},
            {"page_number": 18, "text": "Chapter 9.2: Consistent Hashing. In distributed systems, consistent hashing minimizes key remapping when nodes are added or removed, utilizing a virtual ring with replication."},
            {"page_number": 19, "text": "Chapter 10: NP-Completeness & Approximation. P vs NP dilemma. Reduction proofs for 3-SAT, Vertex Cover, and Traveling Salesperson Problem (TSP). Greedy 2-approximation for Vertex Cover."},
            {"page_number": 20, "text": "Chapter 10.2: Algorithmic Synthesis & Interview Blueprint. Systematic problem-solving framework: Constraints analysis -> Edge cases -> Brute force baseline -> Space/time trade-offs -> Production-grade implementation."}
        ]
    },
    "os": {
        "title": "Operating Systems: Virtualization, Concurrency & Persistence",
        "filename": "operating_systems_three_easy_pieces.pdf",
        "pages": [
            {"page_number": 1, "text": "Chapter 1: The Abstraction of the Process. The OS virtualizes the CPU by creating the illusion of infinite private processors. Process Control Blocks (PCBs) store register state, program counters, and memory pointers during context switches."},
            {"page_number": 2, "text": "Chapter 2: CPU Scheduling Mechanisms. Limited Direct Execution (LDE) allows code to run natively on hardware while maintaining control via kernel traps, timer interrupts, and privileged CPU modes."},
            {"page_number": 3, "text": "Chapter 3: Scheduling Policies. Multi-Level Feedback Queues (MLFQ) prioritize interactive I/O-bound jobs while preventing starvation for long-running CPU-bound background compute jobs."},
            {"page_number": 4, "text": "Chapter 4: Virtual Memory & Address Translation. Base and bounds registers provide simple memory virtualization. Paging eliminates external fragmentation by dividing physical memory into fixed-size page frames."},
            {"page_number": 5, "text": "Chapter 5: Translation Lookaside Buffers (TLB). Hardware caches for page table entries. TLB hits provide single-cycle address translation, while TLB misses trigger hardware page table walks or software trap handlers."},
            {"page_number": 6, "text": "Chapter 6: Multi-Level Page Tables & Inverted Page Tables. Tree structures reduce memory footprint by omitting unallocated virtual address ranges from page tables."},
            {"page_number": 7, "text": "Chapter 7: Swapping & Page Replacement Algorithms. LRU (Least Recently Used), Clock algorithm, and optimal Belady's MIN replacement policy. Thrashing occurs when working sets exceed physical RAM."},
            {"page_number": 8, "text": "Chapter 8: Concurrency & Threads. Threads share a virtual address space but maintain private call stacks and thread-local storage. Race conditions arise during unsynchronized shared memory writes."},
            {"page_number": 9, "text": "Chapter 9: Locks & Mutual Exclusion. Test-and-Set, Compare-and-Swap, and ticket locks. Spinlocks waste CPU cycles under high contention; futexes sleep threads in kernel queues."},
            {"page_number": 10, "text": "Chapter 10: Condition Variables & Semaphores. Semaphores combine integer counters with wait queues. Producer-Consumer bounded buffers implemented using empty, full, and mutex semaphores."},
            {"page_number": 11, "text": "Chapter 11: Deadlock Prevention & Recovery. Coffman's four conditions: Mutual exclusion, Hold and wait, No preemption, and Circular wait. Banker's algorithm ensures safe resource allocation states."},
            {"page_number": 12, "text": "Chapter 12: Persistence & File Systems. Inodes store file metadata and direct/indirect block pointers. Directory entries map filenames to inode numbers across hierarchical disk sectors."},
            {"page_number": 13, "text": "Chapter 13: Crash Consistency & Journaling. Write-Ahead Logging (WAL) ensures atomic file system updates. Journal commit transactions prevent fsck corruption during sudden power failures."},
            {"page_number": 14, "text": "Chapter 14: Log-Structured File Systems (LFS). LFS buffers writes in memory and writes them sequentially to disk segments, maximizing write throughput and flash endurance."},
            {"page_number": 15, "text": "Chapter 15: Flash-based Solid State Disks (SSDs). Flash Translation Layer (FTL), block erasure vs page writes, and wear-leveling algorithms to prevent premature memory cell degradation."}
        ]
    },
    "math": {
        "title": "Advanced Mathematics & Calculus",
        "filename": "advanced_mathematics_calculus.pdf",
        "pages": [
            {"page_number": 1, "text": "Chapter 1: Multivariable Calculus & Partial Derivatives. Functions of multiple variables f(x, y). The gradient vector points in the direction of greatest rate of increase. Directional derivatives compute rates of change along arbitrary unit vectors."},
            {"page_number": 2, "text": "Chapter 2: Optimization & Lagrange Multipliers. Finding unconstrained extrema via the Hessian matrix (second derivative test). Constrained optimization requires equating gradient of objective function to scaled constraint gradient."},
            {"page_number": 3, "text": "Chapter 3: Multiple Integrals & Coordinate Systems. Double integrals over general regions in Cartesian coordinates. Coordinate transformations using the Jacobian determinant for Polar, Cylindrical, and Spherical coordinate integration."},
            {"page_number": 4, "text": "Chapter 4: Vector Calculus & Line Integrals. Vector fields, divergence, and curl. Work done along a parameterized curve. Fundamental Theorem for line integrals and conservative vector fields."},
            {"page_number": 5, "text": "Chapter 5: Green's Theorem & Stokes' Theorem. Relating double integrals over a plane region to circulation line integrals around its boundary. Surface integrals and flux calculations across parametric surfaces."},
            {"page_number": 6, "text": "Chapter 6: Divergence Theorem (Gauss's Theorem). Equating outward net flux through a closed surface with the volume integral of the field's divergence."},
            {"page_number": 7, "text": "Chapter 7: Linear Algebra & Matrix Decompositions. Vector spaces, linear independence, basis, and dimension. Matrix rank and nullity theorem."},
            {"page_number": 8, "text": "Chapter 8: Eigenvalues & Eigenvectors. Characteristic polynomial, diagonalizability, and algebraic vs geometric multiplicities."},
            {"page_number": 9, "text": "Chapter 9: Singular Value Decomposition (SVD). Decomposing arbitrary matrices A = U Sigma V^T. Low-rank matrix approximation and Principal Component Analysis (PCA)."},
            {"page_number": 10, "text": "Chapter 10: Differential Equations. First-order ODEs: separable, exact, and integrating factors. Second-order linear differential equations with constant coefficients."},
            {"page_number": 11, "text": "Chapter 11: Laplace Transforms. Definition, linearity, and shift theorems. Solving initial value problems and differential systems with discontinuous forcing functions."},
            {"page_number": 12, "text": "Chapter 12: Fourier Analysis. Periodic functions, Fourier series coefficients, and Dirichlet conditions. Continuous Fourier transform and frequency domain signal representations."},
            {"page_number": 13, "text": "Chapter 13: Probability & Random Variables. Probability spaces, Bayes' theorem, discrete (Binomial, Poisson) and continuous (Gaussian, Exponential) distributions."},
            {"page_number": 14, "text": "Chapter 14: Expectation, Variance & Covariance. Joint probability density functions, marginals, and independence. Law of Large Numbers and Central Limit Theorem."},
            {"page_number": 15, "text": "Chapter 15: Convex Optimization. Convex sets, convex functions, Jensen's inequality, and dual formulations for machine learning loss minimization."}
        ]
    },
    "networks": {
        "title": "Computer Networks: Top-Down Architecture",
        "filename": "computer_networks_top_down.pdf",
        "pages": [
            {"page_number": 1, "text": "Chapter 1: The Internet Core & Edge. Network edge (hosts, access networks) vs network core (packet switching vs circuit switching). Statistical multiplexing, queuing delays, and packet loss."},
            {"page_number": 2, "text": "Chapter 2: Application Layer Protocols. Principles of network applications. HTTP/1.1 vs HTTP/2 multiplexing vs HTTP/3 (QUIC). DNS hierarchy, recursive queries, and caching records."},
            {"page_number": 3, "text": "Chapter 3: Transport Layer & UDP. Multiplexing and demultiplexing via port numbers. UDP connectionless semantics, checksum calculation, and real-time streaming use cases."},
            {"page_number": 4, "text": "Chapter 4: Principles of Reliable Data Transfer. Stop-and-Wait protocol vs pipelined protocols: Go-Back-N (GBN) and Selective Repeat (SR). Sequence numbering and cumulative acknowledgments."},
            {"page_number": 5, "text": "Chapter 5: TCP Connection Management & Flow Control. Three-way handshake (SYN, SYN-ACK, ACK), connection teardown (FIN, ACK, TIME_WAIT). Flow control using the sliding receive window (rwnd)."},
            {"page_number": 6, "text": "Chapter 6: TCP Congestion Control. Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery. AIMD (Additive Increase Multiplicative Decrease) dynamics and BBR algorithms."},
            {"page_number": 7, "text": "Chapter 7: Network Layer Data Plane. Router architectures, longest prefix matching, and packet forwarding. IPv4 addressing, subnet masks (CIDR), NAT (Network Address Translation), and IPv6 transition."},
            {"page_number": 8, "text": "Chapter 8: Network Layer Control Plane. Routing algorithms: Link-State (Dijkstra) vs Distance-Vector (Bellman-Ford). Intra-AS routing (OSPF) vs Inter-AS routing (BGP policy routing)."},
            {"page_number": 9, "text": "Chapter 9: Software-Defined Networking (SDN). Separation of control plane and data plane. OpenFlow protocol, centralized controllers, and programmable forwarding tables."},
            {"page_number": 10, "text": "Chapter 10: Link Layer & Local Area Networks. Framing, error detection (CRC polynomials), and multiple access protocols (CSMA/CD in Ethernet, CSMA/CA in 802.11 WiFi)."},
            {"page_number": 11, "text": "Chapter 11: MAC Addressing & Address Resolution Protocol (ARP). ARP translation between 32-bit IP addresses and 48-bit hardware MAC addresses. Ethernet switch self-learning tables."},
            {"page_number": 12, "text": "Chapter 12: Network Security & Cryptography. Symmetric encryption (AES), asymmetric key exchange (RSA, Diffie-Hellman), and TLS 1.3 cryptographic handshake."}
        ]
    }
}


@router.post("/upload")
def upload_or_ingest_document(
    payload: IngestDocumentRequest,
    db: Session = Depends(get_db)
):
    """Processes document text or structured pages, generates embeddings, and calculates retention-scaled targets."""
    pages_to_process = payload.pages or []

    # If raw text is provided without explicit pages, split into 350-word pages
    if not pages_to_process and payload.text_content:
        words = payload.text_content.split()
        page_size = 350
        page_num = 1
        for i in range(0, len(words), page_size):
            p_text = " ".join(words[i:i + page_size])
            pages_to_process.append({"page_number": page_num, "text": p_text})
            page_num += 1

    if not pages_to_process:
        pages_to_process = [{"page_number": 1, "text": payload.title}]

    # Run Ingestion Agent
    result = ingestion_agent.process_document(
        title=payload.title,
        filename=payload.filename or f"{payload.title.lower().replace(' ', '_')}.pdf",
        pages_data=pages_to_process,
        retention_score=payload.retention_score,
        grade_level=payload.grade_level,
        daily_allocated_hours=payload.daily_allocated_hours
    )

    # Persist Document into DB
    try:
        doc = Document(
            title=payload.title,
            filename=result["filename"],
            total_pages=result["total_pages"]
        )
        db.add(doc)
        db.flush()

        # Save Pages
        for p in result["pages"]:
            db_page = Page(
                document_id=doc.id,
                page_number=p["page_number"],
                text=p["text"]
            )
            db.add(db_page)

        # Save Chunks
        for c in result["chunks"]:
            db_chunk = Chunk(
                document_id=doc.id,
                page_number=c["page_number"],
                chunk_index=c["chunk_index"],
                chunk_text=c["chunk_text"],
                embedding=c.get("embedding")
            )
            db.add(db_chunk)

        # Save Daily Targets if student_id provided
        if payload.student_id:
            for t in result["target_plan"]["daily_targets"]:
                db_target = DailyTarget(
                    document_id=doc.id,
                    student_id=payload.student_id,
                    day_number=t["day_number"],
                    start_page=t["start_page"],
                    end_page=t["end_page"],
                    is_completed=False
                )
                db.add(db_target)

        db.commit()
        db.refresh(doc)
        result["document_id"] = doc.id
    except Exception as e:
        db.rollback()
        # Non-fatal DB issue: still return computational result
        result["document_id"] = 1
        result["db_note"] = str(e)

    return result


import io
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None


@router.post("/upload-file")
async def upload_document_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    student_id: Optional[int] = Form(1),
    retention_score: Optional[float] = Form(0.75),
    grade_level: Optional[str] = Form("engineering"),
    daily_allocated_hours: Optional[float] = Form(1.5),
    db: Session = Depends(get_db)
):
    """Parses uploaded PDF, DOCX, or TXT study material, creates structured pages, chunks, and retention targets."""
    contents = await file.read()
    filename = file.filename or "uploaded_study_material.pdf"
    file_ext = filename.lower().split(".")[-1] if "." in filename else "pdf"
    doc_title = title or filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    pages_to_process = []

    if file_ext == "pdf" and pypdf is not None:
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(contents))
            for idx, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages_to_process.append({"page_number": idx + 1, "text": page_text.strip()})
        except Exception as e:
            # Fallback if pdf parsing fails
            pages_to_process = []

    elif file_ext in ["docx", "doc"] and docx is not None:
        try:
            doc_obj = docx.Document(io.BytesIO(contents))
            all_text = "\n".join([p.text for p in doc_obj.paragraphs if p.text.strip()])
            words = all_text.split()
            page_size = 350
            for idx, i in enumerate(range(0, len(words), page_size)):
                p_text = " ".join(words[i:i + page_size])
                pages_to_process.append({"page_number": idx + 1, "text": p_text})
        except Exception as e:
            pages_to_process = []

    # If TXT / Markdown or fallback
    if not pages_to_process:
        try:
            text_decoded = contents.decode("utf-8", errors="ignore")
        except Exception:
            text_decoded = str(contents)
        
        words = text_decoded.split()
        if not words:
            words = [f"Study material from {filename}"]
        page_size = 350
        for idx, i in enumerate(range(0, len(words), page_size)):
            p_text = " ".join(words[i:i + page_size])
            pages_to_process.append({"page_number": idx + 1, "text": p_text})

    if not pages_to_process:
        pages_to_process = [{"page_number": 1, "text": f"Study material from {filename}"}]

    # Run Ingestion Agent
    result = ingestion_agent.process_document(
        title=doc_title,
        filename=filename,
        pages_data=pages_to_process,
        retention_score=retention_score or 0.75,
        grade_level=grade_level or "engineering",
        daily_allocated_hours=daily_allocated_hours or 1.5
    )

    # Persist into DB
    try:
        doc = Document(
            title=doc_title,
            filename=filename,
            total_pages=result["total_pages"]
        )
        db.add(doc)
        db.flush()

        for p in result["pages"]:
            db_page = Page(
                document_id=doc.id,
                page_number=p["page_number"],
                text=p["text"]
            )
            db.add(db_page)

        for c in result["chunks"]:
            db_chunk = Chunk(
                document_id=doc.id,
                page_number=c["page_number"],
                chunk_index=c["chunk_index"],
                chunk_text=c["chunk_text"],
                embedding=c.get("embedding")
            )
            db.add(db_chunk)

        if student_id:
            for t in result["target_plan"]["daily_targets"]:
                db_target = DailyTarget(
                    document_id=doc.id,
                    student_id=student_id,
                    day_number=t["day_number"],
                    start_page=t["start_page"],
                    end_page=t["end_page"],
                    is_completed=False
                )
                db.add(db_target)

        db.commit()
        db.refresh(doc)
        result["document_id"] = doc.id
    except Exception as e:
        db.rollback()
        result["document_id"] = 1
        result["db_note"] = str(e)

    return result


@router.post("/calculate-targets")
def calculate_retention_targets(payload: CalculateTargetsRequest):
    """Calculates cognitive science reading targets without re-ingesting document text."""
    return ingestion_agent.calculate_daily_targets(
        total_pages=payload.total_pages,
        retention_score=payload.retention_score,
        grade_level=payload.grade_level,
        daily_allocated_hours=payload.daily_allocated_hours
    )


@router.get("/sample/{preset}")
def get_sample_preset_document(
    preset: str,
    retention_score: float = 0.75,
    grade_level: str = "engineering",
    allocated_hours: float = 1.5,
    db: Session = Depends(get_db)
):
    """Retrieves a rich pre-curated academic textbook preset and calculates its daily target plan."""
    preset_key = preset.lower().strip()
    if preset_key not in SAMPLE_PRESETS:
        preset_key = "dsa"

    sample = SAMPLE_PRESETS[preset_key]
    req = IngestDocumentRequest(
        title=sample["title"],
        filename=sample["filename"],
        pages=sample["pages"],
        retention_score=retention_score,
        grade_level=grade_level,
        daily_allocated_hours=allocated_hours
    )
    return upload_or_ingest_document(req, db=db)


@router.get("/{document_id}")
def get_document_details(document_id: int, db: Session = Depends(get_db)):
    """Retrieves metadata, total pages, and target roadmap for an ingested document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    pages = db.query(Page).filter(Page.document_id == document_id).order_by(Page.page_number).all()
    targets = db.query(DailyTarget).filter(DailyTarget.document_id == document_id).order_by(DailyTarget.day_number).all()

    return {
        "id": doc.id,
        "title": doc.title,
        "filename": doc.filename,
        "total_pages": doc.total_pages,
        "pages_count": len(pages),
        "daily_targets": [
            {
                "day_number": t.day_number,
                "start_page": t.start_page,
                "end_page": t.end_page,
                "is_completed": t.is_completed
            }
            for t in targets
        ]
    }


@router.get("/")
def list_documents(db: Session = Depends(get_db)):
    """Lists all ingested documents."""
    docs = db.query(Document).order_by(Document.created_at.desc()).limit(20).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "filename": d.filename,
            "total_pages": d.total_pages,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in docs
    ]
