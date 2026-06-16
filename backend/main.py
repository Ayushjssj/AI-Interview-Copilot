from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import os
import re
import fitz
import json

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

load_dotenv()

app = FastAPI(title="AI Interview Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-interview-copilot-rho.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ai_interview_copilot")

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]
history_collection = db["interview_history"]
users_collection = db["users"]

resume_text_store = ""
resume_name_store = ""


class AnswerRequest(BaseModel):
    question: str
    answer: str
    resume_name: str | None = None


class RoadmapRequest(BaseModel):
    evaluation: str


class ReadinessRequest(BaseModel):
    evaluation: str
    roadmap: str | None = None


class UserSignup(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ATSRequest(BaseModel):
    resume_text: str | None = None


class JDMatchRequest(BaseModel):
    job_description: str

class FollowUpRequest(BaseModel):
    question: str
    answer: str
    interview_context: str | None = None

def ask_groq(prompt: str):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert AI technical interviewer, evaluator, ATS analyzer, and career coach.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.4,
        )

        return response.choices[0].message.content

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Groq API error: {str(e)}"
        )


def extract_score(evaluation: str):
    patterns = [
        r"overall score[^0-9]*(\d{1,3})\s*/\s*100",
        r"score[^0-9]*(\d{1,3})\s*/\s*100",
        r"(\d{1,3})\s*/\s*100",
        r"(\d{1,3})%",
    ]

    for pattern in patterns:
        match = re.search(pattern, evaluation, re.IGNORECASE)
        if match:
            score = int(match.group(1))
            return min(score, 100)

    return 0


def parse_json_response(raw_response: str):
    try:
        return json.loads(raw_response)
    except Exception:
        json_match = re.search(r"\{.*\}", raw_response, re.DOTALL)

        if json_match:
            try:
                return json.loads(json_match.group())
            except Exception:
                pass

    return None


def format_datetime(value):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")

    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


@app.get("/")
def home():
    return {"message": "AI Interview Copilot Backend Running"}


@app.post("/signup")
async def signup(user: UserSignup):
    existing_user = await users_collection.find_one(
        {"email": user.email}
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if len(user.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow(),
    }

    result = await users_collection.insert_one(user_data)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id),
    }


@app.post("/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one(
        {"email": user.email}
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        db_user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        {
            "user_id": str(db_user["_id"]),
            "email": db_user["email"],
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(db_user["_id"]),
            "name": db_user["name"],
            "email": db_user["email"],
        },
    }

@app.post("/follow-up-question")
async def follow_up_question(data: FollowUpRequest):
    if not data.question.strip() or not data.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Question and answer are required"
        )

    prompt = f"""
    You are a senior technical interviewer.

    Based on the candidate's answer, generate ONE strong follow-up question.

    Rules:
    - Ask only one question.
    - Make it relevant to the answer.
    - Increase difficulty slightly.
    - Do not give explanation.
    - Do not evaluate here.

    Previous Interview Context:
    {data.interview_context or "No previous context"}

    Current Question:
    {data.question}

    Candidate Answer:
    {data.answer}
    """

    follow_up = ask_groq(prompt)

    return {
        "follow_up_question": follow_up
    }


@app.get("/me")
async def me(
    current_user: dict = Depends(get_current_user)
):
    return current_user


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    global resume_text_store, resume_name_store

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are allowed"
        )

    resume_name_store = file.filename

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum allowed size is 5MB"
        )

    with open("uploaded_resume.pdf", "wb") as f:
        f.write(content)

    try:
        doc = fitz.open("uploaded_resume.pdf")
        text = ""

        for page in doc:
            text += page.get_text()

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read PDF resume"
        )

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text found in resume"
        )

    resume_text_store = text

    prompt = f"""
    Analyze this resume and extract:
    1. Key skills
    2. Projects
    3. Strengths
    4. Weak areas
    5. Suitable job roles

    Resume:
    {resume_text_store}
    """

    analysis = ask_groq(prompt)

    return {
        "message": "Resume uploaded successfully",
        "resume_name": resume_name_store,
        "analysis": analysis,
    }


@app.get("/generate-questions")
def generate_questions():
    if not resume_text_store:
        raise HTTPException(
            status_code=400,
            detail="Please upload resume first"
        )

    prompt = f"""
    Generate 10 interview questions based on this resume.

    Include:
    - 3 technical questions
    - 2 project-based questions
    - 2 HR questions
    - 2 problem-solving questions
    - 1 behavioral question

    Keep questions clear, practical, and interview-ready.

    Resume:
    {resume_text_store}
    """

    questions = ask_groq(prompt)

    return {"questions": questions}


@app.post("/evaluate-answer")
async def evaluate_answer(data: AnswerRequest):
    if not data.question.strip() or not data.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Question and answer are required"
        )

    prompt = f"""
    You are an expert AI interviewer.

    Evaluate the candidate answer and return ONLY valid JSON.

    JSON format:
    {{
      "communication": 0,
      "technical_depth": 0,
      "confidence": 0,
      "problem_solving": 0,
      "overall_score": 0,
      "feedback": ""
    }}

    Rules:
    - Scores must be out of 100.
    - Feedback should be detailed but concise.
    - Do not return markdown.
    - Do not return extra text outside JSON.

    Interview Question:
    {data.question}

    Candidate Answer:
    {data.answer}
    """

    raw_response = ask_groq(prompt)
    score_data = parse_json_response(raw_response)

    if not score_data:
        score_data = {
            "communication": 75,
            "technical_depth": 75,
            "confidence": 75,
            "problem_solving": 75,
            "overall_score": 75,
            "feedback": raw_response,
        }

    required_fields = [
        "communication",
        "technical_depth",
        "confidence",
        "problem_solving",
        "overall_score",
        "feedback",
    ]

    for field in required_fields:
        if field not in score_data:
            score_data[field] = 75 if field != "feedback" else raw_response

    history_data = {
        "question": data.question,
        "answer": data.answer,
        "evaluation": score_data["feedback"],
        "communication": int(score_data["communication"]),
        "technical_depth": int(score_data["technical_depth"]),
        "confidence": int(score_data["confidence"]),
        "problem_solving": int(score_data["problem_solving"]),
        "overall_score": int(score_data["overall_score"]),
        "resume_name": data.resume_name or resume_name_store or "Unknown Resume",
        "created_at": datetime.utcnow(),
    }

    await history_collection.insert_one(history_data)

    return {
        "evaluation": score_data["feedback"],
        "scores": {
            "communication": history_data["communication"],
            "technical_depth": history_data["technical_depth"],
            "confidence": history_data["confidence"],
            "problem_solving": history_data["problem_solving"],
            "overall_score": history_data["overall_score"],
            "feedback": score_data["feedback"],
        },
    }


@app.get("/history")
async def get_history():
    history = []

    cursor = history_collection.find().sort("created_at", -1)

    async for item in cursor:
        history.append(
            {
                "id": str(item["_id"]),
                "question": item.get("question", ""),
                "answer": item.get("answer", ""),
                "evaluation": item.get("evaluation", ""),
                "communication": item.get("communication", 0),
                "technical_depth": item.get("technical_depth", 0),
                "confidence": item.get("confidence", 0),
                "problem_solving": item.get("problem_solving", 0),
                "overall_score": item.get("overall_score", 0),
                "resume_name": item.get("resume_name", "Unknown Resume"),
                "created_at": format_datetime(item.get("created_at")),
            }
        )

    return {"history": history}


@app.get("/dashboard-stats")
async def dashboard_stats():
    total_interviews = await history_collection.count_documents({})
    history = await history_collection.find().to_list(length=1000)

    scores = []

    for item in history:
        score = item.get("overall_score", 0)

        if not score:
            score = extract_score(item.get("evaluation", ""))

        if score:
            scores.append(score)

    average_score = round(sum(scores) / len(scores)) if scores else 0
    best_score = max(scores) if scores else 0

    latest_interview = "No interviews yet"

    if history:
        latest = sorted(
            history,
            key=lambda x: x.get("created_at", datetime.min),
            reverse=True,
        )[0]

        latest_interview = latest.get("resume_name", "Unknown Resume")

    return {
        "total_interviews": total_interviews,
        "average_score": average_score,
        "best_score": best_score,
        "total_reports": total_interviews,
        "latest_interview": latest_interview,
    }


@app.post("/generate-roadmap")
async def generate_roadmap(data: RoadmapRequest):
    if not data.evaluation.strip():
        raise HTTPException(
            status_code=400,
            detail="Evaluation is required to generate roadmap"
        )

    prompt = f"""
    You are a senior FAANG interview mentor and career coach.

    Based on the interview evaluation below, generate a personalized learning roadmap.

    Include:
    1. Strengths
    2. Weak Areas
    3. Improvement Suggestions
    4. Recommended Topics to Learn
    5. 10 Practice Questions
    6. Detailed 7-Day Study Plan
    7. Final Career Advice

    Make the roadmap detailed, practical, and actionable.

    Interview Evaluation:
    {data.evaluation}
    """

    roadmap = ask_groq(prompt)

    return {"roadmap": roadmap}


@app.post("/generate-readiness-report")
async def generate_readiness_report(data: ReadinessRequest):
    if not data.evaluation.strip():
        raise HTTPException(
            status_code=400,
            detail="Evaluation is required to generate readiness report"
        )

    prompt = f"""
    You are an expert AI career coach and technical hiring evaluator.

    Based on the interview evaluation and roadmap, generate:

    1. Interview Readiness Percentage
    2. Hiring Probability Percentage
    3. Recommended Job Roles
    4. Strong Areas
    5. Weak Areas
    6. Final Hiring Recommendation
    7. Short improvement advice

    Interview Evaluation:
    {data.evaluation}

    Learning Roadmap:
    {data.roadmap or "Not generated yet"}
    """

    report = ask_groq(prompt)

    return {"readiness_report": report}


@app.delete("/history/{history_id}")
async def delete_history(history_id: str):
    if not ObjectId.is_valid(history_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid history ID"
        )

    result = await history_collection.delete_one({"_id": ObjectId(history_id)})

    if result.deleted_count == 1:
        return {"message": "History deleted successfully"}

    raise HTTPException(
        status_code=404,
        detail="History not found"
    )


@app.post("/ats-score")
async def ats_score(data: ATSRequest):
    if not resume_text_store:
        raise HTTPException(
            status_code=400,
            detail="Please upload resume first"
        )

    prompt = f"""
    You are an expert ATS resume analyzer.

    Analyze this resume and return a professional ATS report.

    Include:
    1. ATS Score out of 100
    2. Missing Keywords
    3. Weak Resume Areas
    4. Strong Resume Areas
    5. Skills to Add
    6. Resume Improvement Suggestions
    7. Final ATS Recommendation

    Resume:
    {resume_text_store}
    """

    ats_report = ask_groq(prompt)

    return {
        "ats_report": ats_report
    }


@app.post("/jd-match")
async def jd_match(data: JDMatchRequest):
    if not resume_text_store:
        raise HTTPException(
            status_code=400,
            detail="Please upload resume first"
        )

    if not data.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description is required"
        )

    prompt = f"""
    You are an expert ATS resume matcher and technical recruiter.

    Compare the candidate resume with the job description.

    Generate a professional Resume vs Job Description Match Report.

    Include:
    1. Overall Match Score out of 100
    2. Hiring Probability Percentage
    3. Strong Matches
    4. Missing Skills
    5. Missing Keywords
    6. Resume Improvement Suggestions
    7. Interview Preparation Focus Areas
    8. Final Recommendation

    Candidate Resume:
    {resume_text_store}

    Job Description:
    {data.job_description}
    """

    jd_report = ask_groq(prompt)

    return {
        "jd_report": jd_report
    }