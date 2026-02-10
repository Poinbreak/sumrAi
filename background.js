// Setup Context Menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarize-selection",
    title: "Summarize with Gemini",
    contexts: ["selection"]
  });
});

// Handle Context Menu Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarize-selection") {
    // 1. Open the Side Panel (Requires user gesture, which this click is)
    chrome.sidePanel.open({ windowId: tab.windowId });

    // 2. Save text to storage so sidepanel can read it upon loading
    chrome.storage.local.set({ pendingSummary: info.selectionText });
    
    // 3. Optional: Send message if panel is already open
    chrome.runtime.sendMessage({ 
      type: "NEW_SUMMARY_REQUEST", 
      text: info.selectionText,
      mode: "selection" 
    });
  }
});

// Allow clicking the extension icon to open the panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });