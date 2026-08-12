import os
import re


COMMON_TECH_KEYWORDS = [
    "Python", "Django", "FastAPI", "Flask", "React", "Next.js", "TypeScript", "JavaScript",
    "Node.js", "Express", "GraphQL", "REST", "SQL", "PostgreSQL", "MySQL", "MongoDB",
    "Redis", "Kafka", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git",
    "TailwindCSS", "HTML", "CSS", "Microservices", "System Design", "Unit Testing",
    "Agile", "Scrum", "Redux", "Linux", "TDD", "Celery", "Pandas", "PyTorch", "TensorFlow"
]

COMMON_SOFT_SKILLS = [
    "Leadership", "Communication", "Problem Solving", "Collaboration", "Mentorship",
    "Cross-functional", "Time Management", "Adaptability", "Critical Thinking", "Ownership"
]


def extract_keywords(text):
    text_lower = text.lower()
    found_tech = []
    for kw in COMMON_TECH_KEYWORDS:
        # Match word boundaries
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found_tech.append(kw)

    found_soft = []
    for kw in COMMON_SOFT_SKILLS:
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found_soft.append(kw)

    return found_tech, found_soft


def scan_ats_match(resume_text, job_description, job_title="Software Engineer"):
    jd_tech, jd_soft = extract_keywords(job_description or job_title)
    all_jd_keywords = set(jd_tech + jd_soft)

    if not all_jd_keywords:
        # Default baseline if JD has very short text
        all_jd_keywords = {"Python", "REST", "SQL", "Git", "Problem Solving", "Communication"}
        jd_tech = ["Python", "REST", "SQL", "Git"]
        jd_soft = ["Problem Solving", "Communication"]

    res_tech, res_soft = extract_keywords(resume_text or "")
    all_res_keywords = set(res_tech + res_soft)

    matched = list(all_jd_keywords.intersection(all_res_keywords))
    missing = list(all_jd_keywords.difference(all_res_keywords))

    match_ratio = len(matched) / len(all_jd_keywords) if all_jd_keywords else 0.5
    # Base score scaled from 45% to 98%
    score = int(min(98, max(35, round(match_ratio * 100))))

    strengths = []
    if matched:
        strengths.append(f"Strong overlap in core technical competencies: {', '.join(matched[:4])}.")
    if any(k in matched for k in ["System Design", "Microservices", "AWS", "Docker", "Kubernetes"]):
        strengths.append("High alignment with cloud architecture and scalability requirements.")
    if not strengths:
        strengths.append("Resume contains relevant foundational software development terminology.")

    suggestions = []
    if missing:
        suggestions.append(f"Incorporate missing key job requirements: {', '.join(missing[:4])} directly into your project bullet points.")
    suggestions.append("Quantify your achievements with metrics (e.g. 'Improved API latency by 35%').")
    suggestions.append("Ensure your target job title appears prominently in your professional summary.")

    return {
        "score": score,
        "score_label": "High Match" if score >= 75 else "Moderate Match" if score >= 55 else "Needs Improvement",
        "matched_keywords": matched,
        "missing_keywords": missing,
        "hard_skills_match_pct": round((len([k for k in matched if k in COMMON_TECH_KEYWORDS]) / max(1, len(jd_tech))) * 100),
        "soft_skills_match_pct": round((len([k for k in matched if k in COMMON_SOFT_SKILLS]) / max(1, len(jd_soft))) * 100) if jd_soft else 100,
        "strengths": strengths,
        "improvement_suggestions": suggestions,
    }


def generate_cover_letter(candidate_name, candidate_experience, resume_text, job_title, company_name, job_description="", tone="professional"):
    name = candidate_name or "Candidate"
    company = company_name or "the hiring team"
    role = job_title or "Software Engineer"
    experience = candidate_experience or "mid-to-senior level software engineering"

    tone_intros = {
        "enthusiastic": f"I was thrilled to discover the {role} position at {company}! Having followed {company}'s impressive engineering innovation and growth, I am eager to bring my background in {experience} to your talented team.",
        "confident": f"With a proven track record of designing scalable cloud platforms and high-throughput APIs, I am writing to express my strong candidacy for the {role} role at {company}.",
        "creative": f"Great software is built at the intersection of robust architecture and delightful user experiences. That is why I am excited to apply for the {role} opening at {company}.",
        "professional": f"I am writing to formally submit my application for the {role} position at {company}. With extensive hands-on experience in {experience}, I am confident in my ability to deliver immediate value to your platform engineering initiatives.",
    }

    intro = tone_intros.get(tone.lower(), tone_intros["professional"])

    # Extract keywords to weave into paragraphs
    tech_keywords, _ = extract_keywords(resume_text + " " + job_description)
    tech_str = ", ".join(tech_keywords[:4]) if tech_keywords else "Python, REST APIs, PostgreSQL, and cloud infrastructure"

    body_1 = f"Throughout my career, I have specialized in architecting reliable backend systems and modern web applications. Working extensively with technologies including {tech_str}, I have focused on writing clean, test-driven code, optimizing database query performance, and implementing robust CI/CD deployment pipelines."

    body_2 = f"What excites me most about {company} is the opportunity to tackle complex scalability challenges while collaborating with a high-performing engineering culture. I thrive in environments where engineers take end-to-end ownership of features—from technical design and architectural trade-offs to deployment and observability."

    closing = f"Thank you for your time and consideration. I would welcome the opportunity to discuss how my technical expertise and problem-solving mindset can contribute to {company}'s ongoing success. I look forward to the possibility of an interview."

    cover_letter_text = f"""Dear Hiring Manager at {company},

{intro}

{body_1}

{body_2}

{closing}

Sincerely,
{name}"""

    return {
        "job_title": role,
        "company_name": company,
        "tone": tone,
        "content": cover_letter_text.strip(),
    }


def generate_interview_prep(job_title, company_name, job_description="", interview_type="technical"):
    role = job_title or "Software Engineer"
    company = company_name or "Company"

    questions = [
        {
            "id": 1,
            "category": "System Architecture & Scalability",
            "question": f"How would you design a high-throughput, fault-tolerant service architecture for {company}'s core platform?",
            "why_they_ask": "Evaluates architectural maturity, understanding of caching, database bottlenecks, and distributed systems.",
            "talking_points": [
                "Discuss stateless microservice architecture with API gateways and load balancers.",
                "Mention asynchronous message queues (e.g. Kafka/Celery) for non-blocking operations.",
                "Detail caching strategies with Redis and read-replica database scaling.",
            ],
            "star_framework": {
                "situation": "Previous platform experienced high query latency during peak load.",
                "task": "Redesign data access layers and implement an automated caching tier.",
                "action": "Introduced Redis caching with cache-aside pattern and optimized PostgreSQL composite indexes.",
                "result": "Reduced p99 API response times by 48% and decreased database CPU utilization by 60%."
            }
        },
        {
            "id": 2,
            "category": "Technical Problem Solving",
            "question": "Can you walk through an instance where you debugged a critical production outage or severe performance regression?",
            "why_they_ask": "Tests composure under pressure, root-cause analysis methodology, and observability practices.",
            "talking_points": [
                "Explain systematic troubleshooting: logs, APM traces, error metrics.",
                "Highlight rollback vs. fast-forward fix decision making.",
                "Discuss post-mortem culture and preventive regression test suites.",
            ],
            "star_framework": {
                "situation": "A newly deployed service caused connection pool exhaustion in production.",
                "task": "Identify root cause immediately and restore service availability.",
                "action": "Isolated unclosed database connections in asynchronous workers, pushed a hotfix, and added connection pool health alarms.",
                "result": "Restored full service within 12 minutes with zero data loss, followed by a blameless post-mortem."
            }
        },
        {
            "id": 3,
            "category": "Behavioral & STAR Method",
            "question": "Tell me about a time you had a technical disagreement with a teammate or stakeholder. How did you resolve it?",
            "why_they_ask": "Evaluates empathy, constructive collaboration, and ability to balance engineering purity with business delivery.",
            "talking_points": [
                "Focus on shared goals and business impact rather than personal preferences.",
                "Use data, benchmarks, or small prototypes to validate assumptions.",
                "Commit fully once a decision is agreed upon.",
            ],
            "star_framework": {
                "situation": "Team debated between monolithic service extension vs. introducing a new microservice.",
                "task": "Align engineering team on an approach that met strict delivery deadlines without accumulating technical debt.",
                "action": "Built a rapid prototype and benchmarked complexity; agreed to start modular within the monolith with clear service boundaries.",
                "result": "Delivered feature 2 weeks ahead of schedule while keeping the codebase decoupled for future extraction."
            }
        },
        {
            "id": 4,
            "category": "Culture & Alignment",
            "question": f"Why are you interested in joining {company} specifically at this stage of your career?",
            "why_they_ask": "Assesses genuine enthusiasm, research on company mission, and long-term retention potential.",
            "talking_points": [
                f"Reference {company}'s market positioning, engineering challenges, or product focus.",
                "Connect your career goals with the team's immediate roadmap.",
                "Highlight your eagerness to mentor and level up team standards.",
            ],
            "star_framework": {
                "situation": "Seeking a role with meaningful ownership and complex technical problems.",
                "task": "Find an engineering team with high standards and collaborative culture.",
                "action": f"Researched {company}'s tech stack and vision, recognizing strong synergy with my backend/full-stack strengths.",
                "result": "Ready to hit the ground running and make significant contributions from day one."
            }
        },
    ]

    return {
        "job_title": role,
        "company_name": company,
        "interview_type": interview_type,
        "total_questions": len(questions),
        "questions": questions,
    }
