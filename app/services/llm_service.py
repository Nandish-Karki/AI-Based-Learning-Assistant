import os
import json
import re # Import the 're' module
from dotenv import load_dotenv
import ollama
import google.generativeai as genai
from app.helpers.prompt_helper import get_prompt

# Load environment variables from .env
load_dotenv()

# ----------------------------
# Gemini 2.5 Pro Client Setup
# ----------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# ----------------------------
# LLaMA 3.2 (Ollama) Function
# ----------------------------
def call_llama_for_module_name(text: str) -> str:
    """
    Generate a short descriptive title (3-6 words) for the given module content using LLaMA 3.2.
    """
    prompt = f"""
You are an expert course designer.

Given the following content from a learning module, return only a short, descriptive title (3 to 6 words max) that summarizes the content.

Do not explain. Do not list multiple titles. Just return a single title.
No extra slashes, quotes, or formatting.

Content:
\"\"\"
{text}
\"\"\"

Title:
    """
    try:
        response = ollama.chat(
            model='llama3.2:latest',
            messages=[{"role": "user", "content": prompt}]
        )
        raw_title = response['message']['content']
        clean_title = raw_title.strip().strip('"').strip("'")
        return clean_title
    except Exception as e:
        print("Error generating module title with LLaMA:", e)
        return "Untitled Module"

# ----------------------------
# Gemini 2.5 Pro Function
# ----------------------------
def generate_answer(question: str, module_content: str, emotion: str) -> dict:
    """
    Generate an answer using Gemini 2.5 Pro given a question, module content, and emotional context.
    """
    prompt = get_prompt(question, module_content, emotion)
    
    try:
        resp = model.generate_content(prompt)
        raw = resp.text.strip()
    except Exception as e:
        print("Gemini API request failed:", e)
        return {"answer": "Error generating answer.", "supporting_texts": []}

    answer_obj = {"answer": raw, "supporting_texts": []} # Default fallback

    cleaned_raw = raw.strip()

    # Attempt to extract JSON from a markdown code block
    json_match = re.search(r'```json\s*(\{.*\})\s*```', cleaned_raw, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
        try:
            answer_obj = json.loads(json_str)
        except json.JSONDecodeError:
            # If JSON within markdown is malformed, fall back to raw text
            pass
    else:
        # If no JSON markdown block, try to parse the whole raw text as JSON
        try:
            answer_obj = json.loads(cleaned_raw)
        except json.JSONDecodeError:
            # If raw text is not JSON, use it as plain answer (already set as default)
            pass
    
    # Final check: if the 'answer' field itself is a stringified JSON, parse it
    if isinstance(answer_obj.get("answer"), str):
        try:
            nested_json = json.loads(answer_obj["answer"])
            if isinstance(nested_json, dict) and "answer" in nested_json:
                answer_obj["answer"] = nested_json["answer"]
        except json.JSONDecodeError:
            pass # Not a nested JSON string, keep as is

    return answer_obj

# ----------------------------
# Example Usage
# ----------------------------
if __name__ == "__main__":
    sample_text = "In this module, we cover the basics of neural networks, including layers, activation functions, and backpropagation."
    
    # LLaMA title generation
    title = call_llama_for_module_name(sample_text)
    print("Generated Module Title:", title)
    
    # Gemini 2.5 Pro answer generation
    answer = generate_answer(
        question="Explain backpropagation in simple terms.",
        module_content=sample_text,
        emotion="neutral"
    )
    print("Generated Answer:", answer)
