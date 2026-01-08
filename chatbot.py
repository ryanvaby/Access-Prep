import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# Load environment variables
if load_dotenv is not None:
    load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError(
        "Google API key not found. Please set GOOGLE_API_KEY."
    )

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-lite",
    temperature=0,
    api_key=GOOGLE_API_KEY,
)

# Bank policy (could be separate file in repo)
BANK_POLICY = """
- Students and first-time applicants are eligible for secured or student credit cards.
- Applicants with thin or no credit history should apply for entry-level cards.
- Passport is acceptable ID only with additional address verification.
- Part-time income is acceptable but should be supplemented with proof of funds.
- Applicants should avoid applying for multiple cards within a short time period.
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
- You must respond in the language given by the client.
"""
)

# Chain
chain = prompt | llm

def run_agent(input_json: dict) -> str:
    response = chain.invoke({
            "student_status": input_json["student_status"],
            "location": input_json["location"],
            "credit_history": input_json["credit_history"],
            "id_type": input_json["id_type"],
            "income_type": input_json["income_type"],
            "bank_policy": BANK_POLICY,
            "response_language": input_json["response_language"],
        })

    return response.content

# # Example call
# input_data = {
#     "student_status": "student",
#     "location": "Ontario, Canada",
#     "credit_history": "thin_file",
#     "id_type": "passport",
#     "income_type": "part_time",
#     "response_language": "Spanish",
# }

# result = run_agent(input_data)
# print(result)
# print("--- End of Response ---")