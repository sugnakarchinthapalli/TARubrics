# api/index.py

from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

import os
import io
import json
import uuid
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from pypdf import PdfReader
from docx import Document
from google import generativeai as genai

# Initialize FastAPI app
app = FastAPI()

# --- Supabase Configuration ---
# Retrieve Supabase URL and Key from environment variables set by Vercel integration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # In a real production environment, you might want more robust logging or error handling
    # For now, raising a RuntimeError will clearly indicate a configuration issue.
    raise RuntimeError("Supabase URL or Key environment variables are not set. Please check Vercel project settings.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Gemini AI Configuration ---
# Retrieve Gemini API Key from environment variable
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set. Please add it to Vercel project settings.")

genai.configure(api_key=GEMINI_API_KEY)
# Using gemini-1.5-flash for faster responses, suitable for screening
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# --- Helper Functions ---

def extract_text_from_pdf(file_stream: io.BytesIO) -> str:
    """Extracts text from a PDF file stream."""
    try:
        reader = PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        raise ValueError("Could not process PDF file.")

def extract_text_from_docx(file_stream: io.BytesIO) -> str:
    """Extracts text from a DOCX file stream."""
    try:
        document = Document(file_stream)
        text = "\n".join([paragraph.text for paragraph in document.paragraphs])
        return text
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        raise ValueError("Could not process DOCX file.")

async def call_gemini_for_rubric(old_rubric: str, job_description: str) -> str:
    """
    Calls Gemini to generate a new evaluation rubric based on an old one and a new JD.
    """
    prompt = f"""
    You are an expert Talent Acquisition AI Assistant.
    I have this evaluation rubric of some other role and I want a new evaluation rubric for the JD I have uploaded.
    Here is the Old evaluation rubric:
    {old_rubric}

    Here is the Job Description for the new role:
    {job_description}

    I want you to create a new evaluation rubric in the same format as the old one,
    so that interviewers and AI can understand correctly to assess Resumes.
    Ensure the new rubric is tailored specifically to the provided Job Description.
    """
    try:
        response = gemini_model.generate_content(prompt)
        # Ensure the response is text and handle potential issues
        if response.text:
            return response.text
        else:
            raise ValueError("AI did not return a valid rubric text.")
    except Exception as e:
        print(f"Error generating rubric with Gemini: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating rubric with AI: {e}")

async def call_gemini_for_resume_evaluation(job_description: str, rubric: str, resume_text: str) -> Dict[str, Any]:
    """
    Calls Gemini to evaluate a resume against a JD and rubric, returning structured JSON.
    """
    prompt = f"""
    You are an expert Talent Acquisition AI Assistant. Your primary function is to assist Talent Acquisition professionals by analyzing candidate CVs against a specific Job Description and a detailed evaluation rubric. You will provide a preliminary assessment and stack ranking in a structured consolidated table format. Your analysis must be objective, strictly evidence-based (citing information from the CVs), and clearly highlight candidate alignment with the role's requirements. Your output will be used for preliminary screening, with human oversight and interviews to follow. Accuracy, adherence to the requested format, and clear justification are paramount.

    Job Description:
    {job_description}

    Evaluation Rubric:
    {rubric}

    Candidate CV Text:
    {resume_text}

    Please evaluate the candidate CV against the Job Description and Rubric.
    Output the results as a JSON object with the following structure:
    {{
        "overall_score": <integer from 1 to 100>,
        "competency_scores": {{
            "Competency 1 Name": <integer score from 1 to 4>,
            "Competency 2 Name": <integer score from 1 to 4>,
            ...
        }},
        "justification": "Detailed justification based on evidence from CV, explaining scores for each competency and overall fit.",
        "pass_fail_status": "Pass" or "Fail",
        "cited_evidence": [
            "Specific quote or phrase from CV supporting a point",
            "Another specific quote or phrase from CV"
        ]
    }}
    Ensure all competency names in "competency_scores" exactly match the rubric.
    """
    try:
        # Requesting a structured JSON response
        response = gemini_model.generate_content(
            contents=[{"parts": [{"text": prompt}]}],
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": {
                    "type": "OBJECT",
                    "properties": {
                        "overall_score": {"type": "INTEGER"},
                        "competency_scores": {
                            "type": "OBJECT",
                            "additionalProperties": {"type": "INTEGER"}
                        },
                        "justification": {"type": "STRING"},
                        "pass_fail_status": {"type": "STRING", "enum": ["Pass", "Fail"]},
                        "cited_evidence": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"}
                        }
                    },
                    "required": ["overall_score", "competency_scores", "justification", "pass_fail_status", "cited_evidence"]
                }
            }
        )
        # The response.text will already be a JSON string due to response_mime_type
        return json.loads(response.text)
    except json.JSONDecodeError as e:
        print(f"AI response was not valid JSON: {response.text if 'response' in locals() else 'No response text'}")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        print(f"Error evaluating resume with Gemini: {e}")
        raise HTTPException(status_code=500, detail=f"Error evaluating resume with AI: {e}")

# --- API Endpoints ---

@app.post("/api/roles")
async def create_role(title: str = Form(...), description: str = Form(...), old_rubric: Optional[str] = Form(None)):
    """
    Creates a new job role with its description and optionally generates a new rubric.
    """
    rubric_text = None
    if old_rubric:
        rubric_text = await call_gemini_for_rubric(old_rubric, description)

    try:
        response = supabase.table("roles").insert({
            "title": title,
            "description": description,
            "rubric_text": rubric_text
        }).execute()
        return JSONResponse(content=response.data, status_code=201)
    except Exception as e:
        print(f"Error in create_role endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating role: {e}")

@app.get("/api/roles")
async def get_roles():
    """
    Retrieves all saved job roles.
    """
    try:
        response = supabase.table("roles").select("*").order("created_at", desc=True).execute()
        return JSONResponse(content=response.data)
    except Exception as e:
        print(f"Error in get_roles endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching roles: {e}")

@app.get("/api/roles/{role_id}")
async def get_role_details(role_id: str):
    """
    Retrieves a specific job role's details.
    """
    try:
        response = supabase.table("roles").select("*").eq("id", role_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Role not found")
        return JSONResponse(content=response.data)
    except Exception as e:
        print(f"Error in get_role_details endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching role details: {e}")

@app.post("/api/roles/{role_id}/upload-resume")
async def upload_and_screen_resume(
    role_id: str,
    resume_file: UploadFile = File(...)
):
    """
    Uploads a resume, screens it against the specified role's JD and rubric,
    and saves the evaluation results.
    """
    # 1. Get Job Description and Rubric for the role
    try:
        role_response = supabase.table("roles").select("description, rubric_text").eq("id", role_id).single().execute()
        if not role_response.data:
            raise HTTPException(status_code=404, detail="Role not found.")
        job_description = role_response.data["description"]
        rubric = role_response.data["rubric_text"]
        if not rubric:
            raise HTTPException(status_code=400, detail="No evaluation rubric found for this role. Please generate one first.")
    except Exception as e:
        print(f"Error fetching role data for resume upload: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching role data: {e}")

    # 2. Extract text from resume file
    file_extension = resume_file.filename.split(".")[-1].lower()
    file_stream = io.BytesIO(await resume_file.read())
    resume_text = ""
    try:
        if file_extension == "pdf":
            resume_text = extract_text_from_pdf(file_stream)
        elif file_extension == "docx":
            resume_text = extract_text_from_docx(file_stream)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOCX.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the resume. File might be empty or corrupted.")

    # 3. Upload resume file to Supabase Storage
    try:
        # Ensure the filename is unique to avoid conflicts in storage
        file_path_in_storage = f"{role_id}/{uuid.uuid4()}_{resume_file.filename}"
        storage_response = supabase.storage.from_("resumes").upload(
            file_path_in_storage,
            file_stream.getvalue(),
            {"content-type": resume_file.content_type}
        )
        # Supabase storage returns a dictionary with 'path' and 'id'
        # The public URL is constructed from the bucket name and the path
        # Note: Supabase public URL structure is fixed: {SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{path_in_bucket}
        public_file_url = f"{SUPABASE_URL}/storage/v1/object/public/resumes/{file_path_in_storage}"
    except Exception as e:
        print(f"Error uploading file to Supabase Storage: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading resume file: {e}")

    # 4. Call Gemini AI for evaluation
    evaluation_result = {}
    overall_score = 0
    try:
        evaluation_result = await call_gemini_for_resume_evaluation(job_description, rubric, resume_text)
        overall_score = evaluation_result.get("overall_score", 0) # Default to 0 if not found
    except HTTPException as e:
        # Catch specific HTTPException from AI call and re-raise
        raise e
    except Exception as e:
        print(f"Error during Gemini evaluation: {e}")
        # If AI fails, we still want to save the resume and note the error
        evaluation_result = {"error": str(e), "message": "AI evaluation failed. Please check logs."}
        overall_score = 0 # Indicate failure

    # 5. Save evaluation results to Supabase
    try:
        insert_response = supabase.table("resumes").insert({
            "role_id": role_id,
            "file_name": resume_file.filename,
            "file_url": public_file_url,
            "score": overall_score,
            "evaluation_details": evaluation_result
        }).execute()
        return JSONResponse(content=insert_response.data, status_code=201)
    except Exception as e:
        print(f"Error saving evaluation to Supabase: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving evaluation results: {e}")

@app.get("/api/roles/{role_id}/results")
async def get_resume_results_for_role(role_id: str):
    """
    Retrieves all screened resumes and their evaluation results for a specific role.
    """
    try:
        response = supabase.table("resumes").select("*").eq("role_id", role_id).order("created_at", desc=True).execute()
        return JSONResponse(content=response.data)
    except Exception as e:
        print(f"Error in get_resume_results_for_role endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching resume results: {e}")
