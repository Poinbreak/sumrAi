from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from google.genai import types
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs

app = FastAPI()

# Initialize Gemini Client
# Paste your Gemini API key here
client = genai.Client(api_key="-api_key_here")


class ChatRequest(BaseModel):
    message: str
    context_type: str  # 'text', 'youtube', 'selection', 'image'
    image_data: str = None  # Base64 string if image


def get_video_id(url):
    """Extract video ID from YouTube URL"""
    try:
        query = urlparse(url)
        if query.hostname == 'youtu.be':
            return query.path[1:]
        if query.hostname in ('www.youtube.com', 'youtube.com'):
            if query.path == '/watch':
                p = parse_qs(query.query)
                return p['v'][0]
    except:
        pass
    return None


def generate_stream(prompt, tools=None):
    """Generator for streaming Gemini response"""

    # Highly optimized system instruction
    sys_instruction = """You are a precision summarization engine. 
    1. Summarize the user's input concisely.
    2. If the user asks a question, answer it using the context provided.
    3. Use bullet points for readability.
    4. ALWAYS cite your sources using the grounding tools provided.
    5. Output properly formatted Markdown."""

    response = client.models.generate_content_stream(
        model="gemini-1.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            tools=tools,  # Enable Google Search Grounding if provided
            temperature=0.3,  # Low temp for factual summaries
        ),
        contents=[prompt],
    )

    for chunk in response:
        if chunk.text:
            yield chunk.text


@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    prompt_text = req.message
    tools = [{"google_search": {}}]  # Default to enabled search

    # 1. Handle YouTube
    if req.context_type == "youtube":
        vid_id = get_video_id(req.message)
        if vid_id:
            try:
                # Get transcript
                transcript_list = YouTubeTranscriptApi.get_transcript(vid_id)
                transcript_text = " ".join([t["text"] for t in transcript_list])
                prompt_text = f"Here is the transcript of a video. Please provide a comprehensive summary with key points and main ideas:\n\n{transcript_text}"
                # Disable search for transcript summaries to force using the video content
                tools = None
            except Exception as e:
                prompt_text = f"I could not retrieve the transcript (Error: {str(e)}). Please summarize this video URL using your internal knowledge: {req.message}"

    # 2. Handle Text Selection
    elif req.context_type in ["selection", "text"]:
        if req.context_type == "selection":
            prompt_text = f"Please provide a comprehensive and well-structured summary of the following selected text. Use bullet points for clarity and organize by key topics:\n\n{req.message}"
        else:
            prompt_text = f"Please answer the following question or process the following text:\n\n{req.message}"

    # 3. Handle Image (Gemini Vision)
    elif req.context_type == "image" and req.image_data:
        prompt_text = f"Please analyze this image and describe what you see:\n\n{req.message}"

    return StreamingResponse(
        generate_stream(prompt_text, tools), media_type="text/plain"
    )


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
