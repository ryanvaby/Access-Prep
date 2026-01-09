import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
import io
import uuid
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import re
from datetime import datetime, timedelta

# Load environment variables
if load_dotenv is not None:
    load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError(
        "Google API key not found. Please set GOOGLE_API_KEY."
    )

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0,
    api_key=GOOGLE_API_KEY,
)

# In-memory storage for uploaded files, keyed by session_id
# Structure: {session_id: {file_id: {binary_data, file_name, document_type, is_valid, validation_message}}}
file_store = {}

# In-memory storage for session application state
# Structure: {session_id: {required_documents: [...], validated_documents: {...}}}
session_store = {}

# Bank policy (could be separate file in repo)
BANK_POLICY = """
Purpose and Scope
This policy outlines how credit card, secure card, and bank account applications are evaluated for both traditional and non-traditional applicants. The Bank seeks to provide responsible access to credit while accounting for applicants who may not meet conventional credit, income, or employment requirements. Applications are evaluated holistically, and approval is not guaranteed.

Applicant Types
Traditional applicants generally have an established credit history, stable full-time income, government-issued identification, and a consistent residential address. Non-traditional applicants may include students, first-time credit applicants, individuals with limited or no credit history, applicants with variable or non-salaried income, newcomers without local credit history, or individuals relying on alternative sources of financial support.

Non-traditional status does not automatically result in denial. Instead, such applications may require additional information or may be directed toward alternative credit products.

Migrant Workers
Applicants who are migrant workers may face challenges providing traditional documentation. Acceptable alternative documents include employment verification letters, contracts, bank statements showing regular deposits, or proof of financial support. A passport or national identification may be used, supplemented with additional address verification. Secured credit cards or entry-level products may be recommended until a local credit history is established.

Freelance and Self-Employed Applicants
Applicants with non-traditional income sources such as freelance work, consulting, or self-employment may be required to provide recent invoices, tax filings, bank deposit records, or contracts to demonstrate income. Lower initial credit limits or secured products may be offered. Responsible financial history through consistent banking or payment behavior may improve eligibility.

Newcomers to the Country
Applicants who have recently relocated or have limited local credit history may be asked to provide proof of residency, utility bills, lease agreements, or letters confirming financial support. Alternative evidence of financial stability such as bank statements from previous countries or employment contracts may be accepted. Initial products may include secured credit cards or entry-level unsecured cards.

Credit History Evaluation
Applicants with an established credit history are evaluated based on length of history, repayment behavior, current obligations, and overall credit usage.

Applicants with limited, thin, or no credit history are not automatically declined. When credit data is insufficient, the Bank may consider alternative indicators of financial responsibility. These may include bank account history, rent payment records, utility payment history, or other evidence of consistent financial behavior. Applicants with limited credit history are more likely to be considered for student cards, entry-level unsecured cards, or secured credit cards.

Student Applicants
Applicants who identify as students may qualify for student-specific credit products. These applicants are not required to have an extensive credit history but must demonstrate the ability to manage basic financial obligations. Proof of enrollment may be requested. Students without independent income may be asked to provide evidence of financial support or supplemental funds.

Income Assessment
Applicants are evaluated on their ability to repay credit obligations rather than on income source alone. Acceptable income may include full-time or part-time employment, self-employment, freelance work, stipends, scholarships, grants, or financial support from family or guardians where permitted by law.

Applicants with variable or non-traditional income may be required to provide additional documentation. This can include recent pay statements, bank deposit history, tax filings, invoices, contracts, or written explanations of income sources. Lower initial credit limits or secured products may be offered when income stability is unclear.

Alternative Financial Documentation
When traditional income or credit documentation is unavailable or insufficient, applicants may be asked to submit alternative supporting documents. These may include bank statements showing consistent balances or deposits, proof of savings or investments, rental payment history, utility bills demonstrating timely payments, letters confirming financial support, or documentation of scholarships or grants. Submission of alternative documentation does not guarantee approval but may support a more complete evaluation.

Identification and Identity Verification
Applicants must provide valid identification. Acceptable identification typically includes government-issued photo identification such as a driver's license or passport. Applicants using a passport or non-local identification may be required to provide additional address verification, such as utility bills, lease agreements, or official correspondence. Enhanced identity verification may be conducted for applicants without standard local identification.

Residency and Location Considerations
Applicants must reside in a supported geographic region and comply with applicable local regulations. New residents or applicants without an established local history may be subject to additional verification or documentation requirements, including proof of address or residency duration.

Product Matching and Alternative Options
Applicants whose profiles do not meet standard unsecured credit card criteria may be directed toward alternative products. These may include secured credit cards requiring a refundable deposit, student credit cards with lower limits, or entry-level cards designed to help build credit. These products are intended as pathways toward broader credit access through responsible use.

Application Guidance for Non-Traditional Applicants
Applicants are encouraged to provide complete and accurate information, apply for products aligned with their current financial situation, and avoid submitting multiple applications within short periods. Building credit gradually through responsible usage and timely payments can improve future eligibility.

Final Considerations
All applications are evaluated individually based on the information provided and applicable policies. Meeting minimum criteria does not ensure approval. This policy is intended to support fair consideration of applicants with diverse financial backgrounds while maintaining responsible lending practices.
"""

# Prompt template
prompt = PromptTemplate(
    input_variables=[
        "student_status",
        "location",
        "credit_history",
        "id_type",
        "income_type",
        "bank_policy",
        "response_language",
    ],
    template="""You are a concise financial assistant. Answer the user's question using ONLY the policy below. Be brief and direct - no lengthy explanations.

Bank Policy:
{bank_policy}

Client Profile: Student: {student_status} | Location: {location} | Credit: {credit_history} | ID: {id_type} | Income: {income_type}

User Question: {user_message}

Keep response SHORT (max 200 words). List required documents only. Respond in {response_language}."""
)

# Chain
chain = prompt | llm

def extract_text_from_pdf(pdf_binary: bytes) -> str:
    """Extract text from PDF using OCR."""
    try:
        pdf_document = fitz.open(stream=pdf_binary, filetype="pdf")
        extracted_text = ""
        
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            # Try to extract text directly first
            text = page.get_text()
            
            # If minimal text, use OCR on page image
            if len(text.strip()) < 50:
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x resolution for better OCR
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                ocr_text = pytesseract.image_to_string(img)
                text = ocr_text
            
            extracted_text += text + "\n"
        
        pdf_document.close()
        return extracted_text
    except Exception as e:
        return f"Error extracting text: {str(e)}"


def validate_document_fields(extracted_text: str, document_type: str) -> dict:
    """
    Validate if required fields are present in extracted text.
    Returns dict with found_fields, missing_fields, and date_check.
    """
    text_lower = extracted_text.lower()
    
    # Field requirements per document type
    field_requirements = {
        "id": {
            "required": ["name", "date", "id", "number"],
            "date_pattern": r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            "date_check": "expiration_not_expired"  # Expiration date should be in future
        },
        "income": {
            "required": ["name", "income", "amount", "date", "employer"],
            "date_pattern": r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            "date_check": "recent_within_6_months"
        },
        "address": {
            "required": ["name", "address", "street", "date"],
            "date_pattern": r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            "date_check": "recent_within_3_months"
        },
        "enrollment": {
            "required": ["name", "student", "enroll", "school", "university"],
            "date_pattern": r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            "date_check": "recent_within_12_months"
        },
        "financial_support": {
            "required": ["name", "support", "amount", "date"],
            "date_pattern": r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            "date_check": "recent_within_6_months"
        }
    }
    
    requirements = field_requirements.get(document_type, field_requirements["id"])
    
    # Check for required fields
    found_fields = []
    missing_fields = []
    
    for field in requirements["required"]:
        if field in text_lower:
            found_fields.append(field)
        else:
            missing_fields.append(field)
    
    # Check date recency
    date_check_result = None
    date_matches = re.findall(requirements["date_pattern"], extracted_text)
    
    if date_matches:
        try:
            # Try to parse the most recent date found
            date_str = date_matches[-1]
            # Handle various date formats
            for fmt in ["%m/%d/%Y", "%m-%d-%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"]:
                try:
                    doc_date = datetime.strptime(date_str, fmt)
                    today = datetime.now()
                    
                    if requirements["date_check"] == "recent_within_6_months":
                        days_old = (today - doc_date).days
                        date_check_result = days_old <= 180  # 6 months
                    elif requirements["date_check"] == "recent_within_3_months":
                        days_old = (today - doc_date).days
                        date_check_result = days_old <= 90  # 3 months
                    elif requirements["date_check"] == "recent_within_12_months":
                        days_old = (today - doc_date).days
                        date_check_result = days_old <= 365  # 12 months
                    elif requirements["date_check"] == "expiration_not_expired":
                        date_check_result = doc_date > today
                    break
                except ValueError:
                    continue
        except Exception:
            pass
    
    return {
        "found_fields": found_fields,
        "missing_fields": missing_fields,
        "date_check": date_check_result,
        "found_count": len(found_fields),
        "required_count": len(requirements["required"])
    }


def validate_document(pdf_binary: bytes, document_type: str, response_language: str = "en") -> dict:
    """
    Validate a PDF document using OCR text extraction.
    Checks if extracted text contains relevant keywords for the document type.
    """
    
    # Step 1: Extract text via OCR
    extracted_text = extract_text_from_pdf(pdf_binary)
    
    if "Error extracting text" in extracted_text or len(extracted_text.strip()) < 20:
        return {
            "is_valid": False,
            "validation_message": "INVALID: Could not read document. Please ensure it's a clear, high-quality scan.",
            "raw_response": extracted_text
        }
    
    # Step 2: Basic heuristics - check if extracted text contains any meaningful content
    text_lower = extracted_text.lower()
    
    # Define keyword hints per document type
    keyword_hints = {
        "id": ["id", "identifier", "license", "passport", "driver", "number", "issue", "expir"],
        "income": ["income", "salary", "wage", "pay", "earning", "employer", "revenue", "tax"],
        "address": ["address", "street", "city", "state", "zip", "road", "avenue", "lane", "apt"],
        "enrollment": ["student", "enroll", "school", "university", "college", "course", "semester"],
        "financial_support": ["support", "grant", "scholarship", "aid", "financial", "award"],
    }
    
    hints = keyword_hints.get(document_type, [])
    
    # Count how many keywords are present
    keyword_count = sum(1 for hint in hints if hint in text_lower)
    has_relevant_keywords = keyword_count >= 1  # Need at least one keyword match
    
    # If we have at least a few words of readable text and some keywords, accept it
    word_count = len(text_lower.split())
    
    if word_count > 30 or has_relevant_keywords:
        is_valid = True
        validation_message = f"✓ {document_type.replace('_', ' ').capitalize()} validated"
    else:
        is_valid = False
        validation_message = f"INVALID: Document appears to be unreadable or not a {document_type.replace('_', ' ')}. Please try a different document."
    
    # DEBUG: log validation result
    print(f"[VALIDATE] Document type: {document_type}")
    print(f"[VALIDATE] Word count: {word_count}, Keywords found: {keyword_count}")
    print(f"[VALIDATE] Extracted text length: {len(extracted_text)}")
    print(f"[VALIDATE] Valid: {is_valid}")
    
    return {
        "is_valid": is_valid,
        "validation_message": validation_message,
        "raw_response": f"words={word_count}, keywords={keyword_count}"
    }


@app.route("/api/determine-required-documents", methods=["POST"])
def determine_required_documents():
    """
    Determine all required documents for the user's profile upfront.
    Called when starting an application.
    """
    try:
        data = request.json
        session_id = data.get("session_id")
        
        agent_input = {
            "pathway": data.get("pathway"),
            "location": data.get("location"),
            "credit_history": data.get("credit_history"),
            "proof_of_address": data.get("proof_of_address"),
            "tax_id": data.get("tax_id"),
            "income_type": data.get("income_type"),
            "applying_for": data.get("applying_for"),
            "response_language": data.get("response_language", "en"),
        }
        
        # Prompt to determine all required documents
        determination_prompt = PromptTemplate(
            input_variables=[
                "pathway",
                "location",
                "credit_history",
                "proof_of_address",
                "tax_id",
                "income_type",
                "applying_for",
                "bank_policy",
                "response_language",
            ],
            template="""You are a financial assistant. Based on the bank policy and this client's profile, determine EXACTLY which documents they need to provide.

CRITICAL: You must respect the client's actual pathway. Do NOT assume they are a student unless the pathway is "student". Consider what product they're applying for (credit_card, secured_card, or bank_account) when determining docs.

Bank Policy:
{bank_policy}

Client Profile: 
- Pathway/Type: {pathway}
- Location: {location}
- Credit History: {credit_history}
- Proof of Address Available: {proof_of_address}
- Tax ID Type: {tax_id}
- Income Type: {income_type}
- Applying For: {applying_for}

DOCUMENT DETERMINATION LOGIC:
1. ID document is ALWAYS required
2. INCOME is required based on: income_type and applying_for product
3. ADDRESS is required based on: proof_of_address field (if "no", may still need it; if "yes", might be optional)
4. ENROLLMENT is required ONLY if pathway is "student"
5. FINANCIAL_SUPPORT is required ONLY if pathway is "student" or income_type is "benefits"

Based on this SPECIFIC profile, determine what documents are needed.

RESPOND WITH ONLY A JSON OBJECT (no other text):
{{
  "required_documents": ["document_type_1", "document_type_2", ...],
  "explanation": "Brief explanation of why these are needed for this specific profile (max 50 words)"
}}

Document types must be one of: id, income, address, enrollment, financial_support

Examples:
- For a student applying for credit_card: {{"required_documents": ["id", "income", "address", "enrollment", "financial_support"], "explanation": "Students need enrollment proof and financial support documentation..."}}
- For a newcomer applying for bank_account: {{"required_documents": ["id", "address", "income"], "explanation": "Newcomers need address proof and income verification..."}}
- For a gig worker applying for secured_card: {{"required_documents": ["id", "income", "address"], "explanation": "Gig workers need income documentation and address proof..."}}

Respond ONLY with the JSON object."""
        )
        
        determination_chain = determination_prompt | llm
        
        response = determination_chain.invoke({
            "pathway": agent_input["pathway"],
            "location": agent_input["location"],
            "credit_history": agent_input["credit_history"],
            "proof_of_address": agent_input["proof_of_address"],
            "tax_id": agent_input["tax_id"],
            "income_type": agent_input["income_type"],
            "applying_for": agent_input["applying_for"],
            "bank_policy": BANK_POLICY,
            "response_language": agent_input["response_language"],
        })
        
        # Parse the JSON response
        import json
        response_text = response.content.strip()
        # Extract JSON if it's wrapped in other text
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        required_docs = result.get("required_documents", [])
        explanation = result.get("explanation", "")
        
        # Store in session
        if session_id not in session_store:
            session_store[session_id] = {}
        
        session_store[session_id]["required_documents"] = required_docs
        session_store[session_id]["validated_documents"] = {}
        
        print(f"[DETERMINE] Session {session_id} initialized with required docs: {required_docs}")
        
        return jsonify({
            "required_documents": required_docs,
            "explanation": explanation
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/session-status", methods=["POST"])
def get_session_status():
    """Get the current session status including required and validated documents."""
    try:
        data = request.json
        session_id = data.get("session_id")
        
        if not session_id or session_id not in session_store:
            return jsonify({
                "required_documents": [],
                "validated_documents": {},
                "pending_documents": [],
                "all_complete": False
            }), 200
        
        session_data = session_store[session_id]
        required = session_data.get("required_documents", [])
        validated = set(session_data.get("validated_documents", {}).keys())
        pending = [doc for doc in required if doc not in validated]
        
        return jsonify({
            "required_documents": required,
            "validated_documents": list(validated),
            "pending_documents": pending,
            "all_complete": len(pending) == 0 and len(required) > 0
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/upload", methods=["POST"])
def upload():
    """Handle document upload and validation."""
    try:
        # Get file, document type, and session ID
        if "file" not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files["file"]
        document_type = request.form.get("document_type", "id")
        session_id = request.form.get("session_id")
        
        if not session_id:
            return jsonify({"error": "No session_id provided"}), 400
        
        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400
        
        if not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF files are supported"}), 400
        
        # Read the PDF binary
        pdf_binary = file.read()
        
        # Validate document via OCR text extraction
        validation_result = validate_document(pdf_binary, document_type)
        
        # Generate file ID and store
        file_id = str(uuid.uuid4())
        if session_id not in file_store:
            file_store[session_id] = {}
        
        file_store[session_id][file_id] = {
            "binary": pdf_binary,
            "file_name": secure_filename(file.filename),
            "document_type": document_type,
            "is_valid": validation_result["is_valid"],
            "validation_message": validation_result["validation_message"],
        }
        
        # Track validated documents in session
        if session_id not in session_store:
            session_store[session_id] = {"required_documents": [], "validated_documents": {}}
        
        if validation_result["is_valid"]:
            session_store[session_id]["validated_documents"][document_type] = file_id
            # Ensure required_documents list exists
            if "required_documents" not in session_store[session_id]:
                session_store[session_id]["required_documents"] = []
            
            # DEBUG: Log validation
            print(f"[UPLOAD] Document '{document_type}' validated for session {session_id}")
            print(f"[UPLOAD] Session state: required={session_store[session_id]['required_documents']}, validated={list(session_store[session_id]['validated_documents'].keys())}")
        else:
            print(f"[UPLOAD] Document '{document_type}' INVALID for session {session_id}: {validation_result['validation_message']}")
        
        # Return file attachment metadata
        return jsonify({
            "fileId": file_id,
            "fileName": secure_filename(file.filename),
            "fileSize": len(pdf_binary),
            "documentType": document_type,
            "uploadedAt": int(__import__("time").time() * 1000),
            "isValid": validation_result["is_valid"],
            "validationMessage": validation_result["validation_message"],
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat requests from the frontend."""
    try:
        data = request.json
        session_id = data.get("session_id")
        
        # Extract the required fields for the agent
        agent_input = {
            "pathway": data.get("pathway"),
            "location": data.get("location"),
            "credit_history": data.get("credit_history"),
            "proof_of_address": data.get("proof_of_address"),
            "tax_id": data.get("tax_id"),
            "income_type": data.get("income_type"),
            "applying_for": data.get("applying_for"),
            "response_language": data.get("response_language"),
        }
        
        # Get session's predetermined required documents
        required_documents = []
        validated_doc_types = set()
        if session_id in session_store:
            required_documents = session_store[session_id].get("required_documents", [])
            # Get validated documents from session store (most reliable)
            validated_dict = session_store[session_id].get("validated_documents", {})
            validated_doc_types = set(validated_dict.keys())
            print(f"[CHAT] Session {session_id} found. Required: {required_documents}, Validated from store: {list(validated_doc_types)}")
        else:
            print(f"[CHAT] Session {session_id} NOT FOUND in session_store. Available sessions: {list(session_store.keys())}")
        
        # Also check validated_files passed in current request and add them to session if not already there
        validated_files = data.get("validated_files", [])
        if validated_files:
            # Handle both string array and object array formats
            display_list = []
            for f in validated_files:
                if isinstance(f, str):
                    display_list.append(f)
                elif isinstance(f, dict):
                    display_list.append(f.get('documentType', 'unknown'))
            print(f"[CHAT] Found validated_files in request: {display_list}")
            
            for file_info in validated_files:
                if isinstance(file_info, str):
                    doc_type = file_info
                    is_valid = True
                elif isinstance(file_info, dict):
                    doc_type = file_info.get("documentType", "unknown")
                    is_valid = file_info.get("isValid", False)
                else:
                    continue
                
                print(f"[CHAT]   Processing file: type={doc_type}, isValid={is_valid}, already in session={doc_type in validated_doc_types}")
                if is_valid and doc_type not in validated_doc_types:
                    validated_doc_types.add(doc_type)
                    # Also update session store for future requests
                    if session_id not in session_store:
                        session_store[session_id] = {"required_documents": [], "validated_documents": {}}
                    session_store[session_id]["validated_documents"][doc_type] = "file_id"
                    print(f"[CHAT]   Added {doc_type} to session validated_documents")
        else:
            print(f"[CHAT] No validated_files in request")
        
        # Build document validation context
        validated_docs_context = ""
        if validated_doc_types:
            validated_list = [f"✓ {doc_type.replace('_', ' ').capitalize()}" for doc_type in sorted(validated_doc_types)]
            validated_docs_context = f"Documents Already Verified:\n" + "\n".join(validated_list) + "\n\n"
        
        # Find the next document to ask for (from the required list only)
        next_doc_to_request = None
        if required_documents:
            for doc in required_documents:
                if doc not in validated_doc_types:
                    next_doc_to_request = doc
                    break
        
        # Build context about what's needed
        docs_context = ""
        if required_documents:
            docs_list = ", ".join([d.replace("_", " ").capitalize() for d in required_documents])
            docs_context = f"\n\nRequired Documents for this application: {docs_list}\n"
            
            if next_doc_to_request:
                pending = [d.replace("_", " ").capitalize() for d in required_documents if d not in validated_doc_types]
                docs_context += f"Pending: {', '.join(pending)}"
            elif validated_doc_types:
                docs_context += f"Status: All required documents received! ✓"
        
        # Get the user's message from the conversation
        messages = data.get("messages", [])
        user_message = ""
        is_upload_message = False
        if messages:
            user_message = messages[-1].get("content", "")
            is_upload_message = "[Document uploaded:" in user_message
            agent_input["user_message"] = user_message
        
        # Build next_doc instruction
        next_doc_instruction = ""
        if next_doc_to_request and (is_upload_message or user_message.lower() in ["", "next", "what's next"]):
            next_doc_instruction = f"\n\nIMPORTANT: The user just uploaded a document. Now ask them to upload the NEXT pending document: **{next_doc_to_request.replace('_', ' ').capitalize()}**. Be specific and helpful about what this document should contain."
        
        # Update the prompt template to include validated documents context
        system_prompt = f"""You are a friendly financial assistant helping clients prepare for applications. Answer conversationally using ONLY the policy provided to guide users through document collection for their application.

{validated_docs_context}{docs_context}{next_doc_instruction}

Bank Policy:
{{bank_policy}}

Client Profile: Pathway: {{pathway}} | Location: {{location}} | Credit: {{credit_history}} | Tax ID: {{tax_id}} | Income: {{income_type}} | Applying For: {{applying_for}}

User Message: {{user_message}}

YOUR ROLE:
1. ONLY discuss documents from the required list above. Do NOT ask for any other documents.
2. IMPORTANT: NEVER ask for documents that are already verified (marked with ✓). If a document is verified, DO NOT ask for it again.
3. If a document shows as rejected (✗): Be direct—tell the user exactly why it didn't meet requirements and ask for the correct document from the required list that hasn't been verified yet.
4. If documents are verified (✓): Acknowledge them and ask for the NEXT document from the required list that is still pending.
5. If the user says they don't have a required document: Offer alternatives from the policy, but the document MUST be from the required list and NOT already verified.
6. If all required documents are verified: Congratulate them and explain next steps.
7. When a document is successfully uploaded, ALWAYS ask for the NEXT pending document from the list, or congratulate if all are complete.
7. Ask for ONE specific document at a time, with clear examples.

CRITICAL RULES:
- The only documents this user needs are: {', '.join(required_documents) if required_documents else 'TBD'}
- Already verified documents: {', '.join(sorted(validated_doc_types)) if validated_doc_types else 'None yet'}
- NEVER ask for a document if it's already in the verified list above
- Do NOT ask for any documents not on the required list, even if the policy mentions them

EXAMPLE OF CORRECT BEHAVIOR:
- User uploads ID (valid) → Acknowledge: "Great, your ID is verified ✓" → Ask for next pending document
- User uploads ID again (after it's verified) → WRONG: Don't ask for ID again. Instead ask for next pending document
- If no documents verified yet and ID+Income+Address required → Ask only for ID first

IMPORTANT: When a document is rejected, use the validation message to explain what went wrong. For example:
- "That wasn't the right document. I need **proof of enrollment**—like a student ID, acceptance letter, or enrollment verification from your school. Can you upload that?"
- "That document didn't validate as a proof of address. I need something like a **utility bill** or **lease agreement** with your name and address clearly visible."

TONE:
- Conversational and encouraging
- BE DIRECT about rejected documents (don't be vague)
- Keep under 100 words
- Bold key documents using **markdown**
- One document request at a time, but ONLY if it hasn't been verified yet
- Respond in {{response_language}}
"""
        
        chat_prompt = PromptTemplate(
            input_variables=[
                "pathway",
                "location",
                "credit_history",
                "proof_of_address",
                "tax_id",
                "income_type",
                "applying_for",
                "bank_policy",
                "user_message",
                "response_language",
            ],
            template=system_prompt,
        )
        
        chat_chain = chat_prompt | llm
        
        # DEBUG: Show what the LLM will be told
        print(f"\n[CHAT] About to call LLM with:")
        print(f"  Required Documents: {required_documents}")
        print(f"  Validated Documents: {sorted(validated_doc_types)}")
        print(f"  Context shown to LLM:\n{validated_docs_context}{docs_context}")
        
        # Run the agent and get response
        response = chat_chain.invoke({
            "user_message": agent_input["user_message"],
            "pathway": agent_input["pathway"],
            "location": agent_input["location"],
            "credit_history": agent_input["credit_history"],
            "proof_of_address": agent_input["proof_of_address"],
            "tax_id": agent_input["tax_id"],
            "income_type": agent_input["income_type"],
            "applying_for": agent_input["applying_for"],
            "bank_policy": BANK_POLICY,
            "response_language": agent_input["response_language"],
        })
        
        return jsonify({"reply": response.content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)