import os
from dotenv import load_dotenv
# from google import genai
from openai import OpenAI

load_dotenv()

# api_key = os.getenv("GEMINI_API_KEY")

api_key = os.getenv("OPENROUTER_API_KEY")

if not api_key:
    raise RuntimeError("OPENROUTER_API_KEY missing in .env")

client = OpenAI(
    api_key= api_key,
    base_url= "https://openrouter.ai/api/v1",
    timeout=float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "120")),
    max_retries=int(os.getenv("OPENROUTER_MAX_RETRIES", "1")),
)
    
# client = genai.Client(api_key = api_key)

# def ask_gemini(prompt: str) -> str:
#     response = client.models.generate_content(
#         model = "gemini-3.8-flash",
#         contents = prompt,
#     )
#     return response.text or ""


def ask_gemini(prompt: str) -> str:
    response = client.chat.completions.create(
        model = os.getenv("OPENROUTER_MODEL", "openrouter/free"),
        messages= [
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    answer = response.choices[0].message.content
    return answer or ""