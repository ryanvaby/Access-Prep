import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

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
    model="gemini-3-flash-preview",
    temperature=0,
    api_key=GOOGLE_API_KEY,
)

# Bank policy (could be separate file in repo)
BANK_POLICY = """
Purpose and Scope
This policy outlines how credit card applications are evaluated for both traditional and non-traditional applicants. The Bank seeks to provide responsible access to credit while accounting for applicants who may not meet conventional credit, income, or employment requirements. Applications are evaluated holistically, and approval is not guaranteed.

Applicant Types
Traditional applicants generally have an established credit history, stable full-time income, government-issued identification, and a consistent residential address. Non-traditional applicants may include students, first-time credit applicants, individuals with limited or no credit history, applicants with variable or non-salaried income, newcomers without local credit history, or individuals relying on alternative sources of financial support.

Non-traditional status does not automatically result in denial. Instead, such applications may require additional information or may be directed toward alternative credit products.

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
Applicants must provide valid identification. Acceptable identification typically includes government-issued photo identification such as a driver’s license or passport. Applicants using a passport or non-local identification may be required to provide additional address verification, such as utility bills, lease agreements, or official correspondence. Enhanced identity verification may be conducted for applicants without standard local identification.

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
    ],
    template="""
You are a financial assistant helping clients prepare for a credit card application.

Use ONLY the bank policy provided below to inform the client on documents and qualifications
needed for a successful application, which may vary based on their profile.
Do not invent rules that are not in the policy.

Bank Policy:
{bank_policy}

Client Profile:
- Student status: {student_status}
- Location: {location}
- Credit history: {credit_history}
- ID type: {id_type}
- Income type: {income_type}

Instructions:
- Analyze all materials the client needs for a successful credit card application.
- If some profile requirements are missing, search for alternatives the client can use.
- Provide practical tips to improve approval chances
- Be clear, concise, and supportive
- You must respond in {response_language}
"""
)

# Chain
chain = prompt | llm

@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat requests from the frontend."""
    try:
        data = request.json
        
        # Extract the required fields for the agent
        agent_input = {
            "student_status": data.get("student_status"),
            "location": data.get("location"),
            "credit_history": data.get("credit_history"),
            "id_type": data.get("id_type"),
            "income_type": data.get("income_type"),
            "response_language": data.get("response_language"),
        }
        
        # Get the user's message from the conversation
        messages = data.get("messages", [])
        if messages:
            user_message = messages[-1].get("content", "")
            agent_input["user_message"] = user_message
        
        # Run the agent and get response
        response = chain.invoke({
            "student_status": agent_input["student_status"],
            "location": agent_input["location"],
            "credit_history": agent_input["credit_history"],
            "id_type": agent_input["id_type"],
            "income_type": agent_input["income_type"],
            "bank_policy": BANK_POLICY,
            "response_language": agent_input["response_language"],
        })
        
        return jsonify({"reply": response.content[0]['text']}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

# # Example call
# input_data = {
#     "student_status": "student",
#     "location": "McLean, Virginia, USA",
#     "credit_history": "thin_file",
#     "id_type": "passport",
#     "income_type": "part_time",
#     "response_language": "Spanish",
# }

# result = run_agent(input_data)
# print(result[0]['text'])
