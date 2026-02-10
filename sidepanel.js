// Configuration - UPDATE THIS WITH YOUR AWS LAMBDA FUNCTION URL
const API_URL = "https://jia72c33ydx4gmqqakqw6phpty0vebxz.lambda-url.ap-south-1.on.aws/"; // e.g., https://xyz...lambda-url.us-east-1.on.aws

// DOM Elements
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const statusText = document.getElementById('status');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check for pending context menu actions on load
  chrome.storage.local.get(['pendingSummary'], (result) => {
    if (result.pendingSummary) {
      messageInput.value = result.pendingSummary;
      chrome.storage.local.remove(['pendingSummary']);
      // Optionally auto-send: chatWithGemini(result.pendingSummary, "selection");
    }
  });
});

// Event Listeners
sendBtn.addEventListener('click', () => {
  sendMessage();
});

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Listener for new messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "NEW_SUMMARY_REQUEST") {
    messageInput.value = request.text;
    chatWithGemini(request.text, request.mode);
  }
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // Validate API URL
  if (API_URL === "YOUR_AWS_LAMBDA_FUNCTION_URL") {
    addMessage(
      "Error: Please configure the AWS Lambda Function URL in sidepanel.js",
      "error"
    );
    return;
  }

  // Add user message to UI
  addMessage(message, "user");
  messageInput.value = '';
  sendBtn.disabled = true;

  // Send to backend
  chatWithGemini(message, "text");
}

async function chatWithGemini(message, type = "text") {
  const chatBoxDiv = document.createElement('div');
  chatBox.appendChild(chatBoxDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  statusText.textContent = 'Connecting...';

  try {
    const response = await fetch(API_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        context_type: type
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Create a div for the bot response
    const botMsgDiv = document.createElement('div');
    botMsgDiv.className = 'message bot-message';
    chatBox.appendChild(botMsgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    statusText.textContent = 'Receiving...';
    let fullText = '';

    // Stream the response
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;

      // Update the DOM with accumulated text (raw for now, can be parsed as Markdown)
      botMsgDiv.innerHTML = parseMarkdown(fullText);
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    statusText.textContent = 'Ready';
  } catch (error) {
    console.error("Error:", error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message bot-message error';
    errorDiv.textContent = `Error: ${error.message}`;
    chatBox.appendChild(errorDiv);
    statusText.textContent = 'Error - check console';

    chatBox.scrollTop = chatBox.scrollHeight;
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

function addMessage(text, sender = "user") {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Simple Markdown parser for formatting
 * Supports: bold, italic, links, headers, lists, code blocks
 */
function parseMarkdown(text) {
  // Escape HTML
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Inline code
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');

  // Line breaks
  text = text.replace(/\n/g, '<br>');

  // Unordered lists
  text = text.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Ordered lists
  text = text.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');

  return text;
}
