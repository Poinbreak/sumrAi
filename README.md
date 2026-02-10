# Gemini Summarizer Extension 🚀

A powerful Chrome Extension that uses Google's Gemini 1.5 Flash API to summarize text, images, and YouTube videos instantly. 

Designed for speed and efficiency, this tool integrates directly into your browser's side panel, allowing you to get concise summaries and chat with your content without leaving the current tab.

## ✨ Features

* **Contextual Summarization:** Right-click any selected text on a webpage to generate an instant summary.
* **YouTube Intelligence:** Automatically detects YouTube video URLs and generates summaries from transcripts.
* **Chat with Page:** Open the side panel to ask follow-up questions about the summarized content.
* **Grounded Truth:** Uses Google Search Grounding to provide sources and citations for facts.
* **Serverless Backend:** Powered by a robust FastAPI backend running on AWS Lambda.

## 🛠️ Architecture

* **Frontend:** Chrome Extension (Manifest V3), JavaScript, HTML/CSS.
* **Backend:** Python (FastAPI) wrapped in `Mangum`.
* **Infrastructure:** AWS Lambda (Serverless Compute), AWS API Gateway (Function URL).
* **AI Engine:** Google Gemini 1.5 Flash via the `google-genai` SDK.

## 🚀 Quick Start Instructions

### 1. Backend Setup (AWS)
1.  Navigate to the `backend` folder.
2.  Install dependencies locally to a package folder (required for Lambda):
    ```bash
    pip install -t package -r requirements.txt
    cp main.py lambda_handler.py package/
    cd package && zip -r ../deployment.zip .
    ```
3.  Upload `deployment.zip` to your AWS Lambda function.
4.  Set the Handler to `lambda_handler.handler`.
5.  Set Environment Variable `GEMINI_API_KEY` with your Google AI Studio key.
6.  Enable Function URL (Auth: NONE, Invoke Mode: BUFFERED).

### 2. Extension Setup (Chrome)
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** (top right).
3.  Click **Load unpacked**.
4.  Select the folder containing your `manifest.json`.
5.  Update `sidepanel.js` with your specific AWS Lambda Function URL.

## 🐛 Known Bugs & Troubleshooting

| Issue | Description | Status | Fix / Workaround |
| :--- | :--- | :--- | :--- |
| **Video Transcript Fail** | Some YouTube videos do not have accessible transcripts via the API. | ⚠️ Open | The model falls back to a general summary based on metadata if transcript fetch fails. |
| **CORS Errors** | "Failed to fetch" error in the console when calling the backend. | ✅ Solved | Ensure `CORSMiddleware` is added in FastAPI and Function URL auth is set to NONE. |
| **AWS Module Not Found** | `Runtime.ImportModuleError: No module named 'mangum'` on AWS Lambda. | ⚠️ **Active** | **Cause:** Zipping files on Windows often creates permission issues or incorrect folder structures. <br> **Fix:** Use the provided `build.py` script to zip files with correct Linux permissions (`chmod 755`) and flattened structure. |

## 🤝 Contributing
Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

---
*Built with ❤️ using Gemini API and AWS.*
