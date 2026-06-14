import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileText,
  MessageSquare,
  Settings,
  History,
  Moon,
  Sun,
  Send,
  Trash2,
  Check,
  Copy,
  RefreshCw,
  X,
  Plus,
  Compass,
  Zap,
  Info
} from "lucide-react";
import { generateContent, refineContent, generatePrompt } from "./services/aiService";

// Simple custom markdown-to-html parser
const parseMarkdown = (text) => {
  if (!text) return "";
  
  // Safe escape HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Split into lines to parse block structures
  const lines = html.split("\n");
  let inList = false;
  const parsedLines = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("# ")) {
      if (inList) { inList = false; parsedLines.push("</ul>"); }
      parsedLines.push(`<h1>${trimmed.substring(2)}</h1>`);
    } else if (trimmed.startsWith("## ")) {
      if (inList) { inList = false; parsedLines.push("</ul>"); }
      parsedLines.push(`<h2>${trimmed.substring(3)}</h2>`);
    } else if (trimmed.startsWith("### ")) {
      if (inList) { inList = false; parsedLines.push("</ul>"); }
      parsedLines.push(`<h3>${trimmed.substring(4)}</h3>`);
    } 
    // Bullet points
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        inList = true;
        parsedLines.push("<ul>");
      }
      const itemContent = trimmed.substring(2);
      parsedLines.push(`<li>${parseInlineMarkdown(itemContent)}</li>`);
    } 
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        inList = true;
        parsedLines.push("<ol>");
      }
      const itemContent = trimmed.replace(/^\d+\.\s/, "");
      parsedLines.push(`<li>${parseInlineMarkdown(itemContent)}</li>`);
    } 
    // Empty lines
    else if (trimmed === "") {
      if (inList) {
        inList = false;
        parsedLines.push("</ul>"); // Close list if open
      }
      parsedLines.push("<br />");
    } 
    // Standard Paragraphs
    else {
      if (inList) {
        inList = false;
        parsedLines.push("</ul>");
      }
      parsedLines.push(`<p>${parseInlineMarkdown(line)}</p>`);
    }
  });

  if (inList) {
    parsedLines.push("</ul>");
  }

  return parsedLines.join("");
};

const parseInlineMarkdown = (text) => {
  let parsed = text;
  // Bold **text**
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic *text*
  parsed = parsed.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Inline Code `code`
  parsed = parsed.replace(/`(.*?)`/g, "<code>$1</code>");
  return parsed;
};

function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("creata_theme") || "dark";
  });

  // API Config state
  const [apiConfig, setApiConfig] = useState(() => {
    const savedGeminiKey = localStorage.getItem("creata_gemini_key") || "";
    const savedOpenAIKey = localStorage.getItem("creata_openai_key") || "";
    const savedMockMode = localStorage.getItem("creata_mock_mode") !== "false"; // default to true
    const savedProvider = localStorage.getItem("creata_provider") || "gemini";
    const savedGeminiModel = localStorage.getItem("creata_gemini_model") || "gemini-1.5-flash";
    const savedOpenAIModel = localStorage.getItem("creata_openai_model") || "gpt-4o";
    return {
      geminiKey: savedGeminiKey,
      openAIKey: savedOpenAIKey,
      mockMode: savedMockMode,
      provider: savedProvider,
      geminiModel: savedGeminiModel,
      openAIModel: savedOpenAIModel
    };
  });

  // Input States
  const [activeType, setActiveType] = useState("blog"); // blog, caption, summary
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  
  // Custom options based on content types
  const [options, setOptions] = useState({
    length: "medium", // short, medium, long
    platform: "LinkedIn", // Instagram, LinkedIn, Twitter/X, Facebook
    includeEmojis: true,
    includeHashtags: true,
    format: "paragraph", // paragraph, bullets
    extraInstructions: ""
  });

  // Output States
  const [generatedContent, setGeneratedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refinement states
  const [refineInput, setRefineInput] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineHistory, setRefineHistory] = useState([]); // conversation log for Gemini/OpenAI

  // Settings & History Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // History storage
  const [historyList, setHistoryList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("creata_history")) || [];
    } catch {
      return [];
    }
  });

  // UI States
  const [copySuccess, setCopySuccess] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  
  // Ref focus
  const outputEndRef = useRef(null);

  // Apply Theme on load
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("creata_theme", theme);
  }, [theme]);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem("creata_gemini_key", apiConfig.geminiKey);
    localStorage.setItem("creata_openai_key", apiConfig.openAIKey);
    localStorage.setItem("creata_mock_mode", apiConfig.mockMode.toString());
    localStorage.setItem("creata_provider", apiConfig.provider);
    localStorage.setItem("creata_gemini_model", apiConfig.geminiModel);
    localStorage.setItem("creata_openai_model", apiConfig.openAIModel);
  }, [apiConfig]);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem("creata_history", JSON.stringify(historyList));
  }, [historyList]);

  // Toast helper
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 2500);
  };

  // Content type change handler
  const handleTypeChange = (type) => {
    setActiveType(type);
    setError(null);
  };

  // Reset inputs helper
  const handleClear = () => {
    setTopic("");
    setOptions({
      length: "medium",
      platform: "LinkedIn",
      includeEmojis: true,
      includeHashtags: true,
      format: "paragraph",
      extraInstructions: ""
    });
    setGeneratedContent("");
    setRefineHistory([]);
    setError(null);
  };

  // Handle generation action
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    
    if (!topic.trim()) {
      setError("Please provide a topic or prompt before generating content.");
      showToast("Topic field is empty!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRefineHistory([]); // Reset refinement log on new generation

    try {
      const result = await generateContent({
        type: activeType,
        topic: topic.trim(),
        tone,
        options,
        apiConfig
      });

      setGeneratedContent(result);
      
      // Setup refinement chat log
      const fullPrompt = generatePrompt({ type: activeType, topic: topic.trim(), tone, options });
      setRefineHistory([
        { role: "user", content: fullPrompt },
        { role: "assistant", content: result }
      ]);

      // Add to History
      const newHistoryItem = {
        id: Date.now(),
        type: activeType,
        topic: topic.trim(),
        tone,
        options: { ...options },
        content: result,
        timestamp: new Date().toLocaleString()
      };
      setHistoryList(prev => [newHistoryItem, ...prev]);
      showToast("Content generated successfully!");

    } catch (err) {
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refinement action
  const handleRefineSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!refineInput.trim()) return;
    if (!generatedContent) {
      showToast("No content to refine!");
      return;
    }

    setRefineLoading(true);
    const instruction = refineInput.trim();
    setRefineInput(""); // Clear field

    try {
      const updatedHistory = [...refineHistory];
      const result = await refineContent({
        refinementPrompt: instruction,
        history: updatedHistory,
        apiConfig
      });

      setGeneratedContent(result);

      // Append refinement transaction to history log
      setRefineHistory(prev => [
        ...prev,
        { role: "user", content: instruction },
        { role: "assistant", content: result }
      ]);
      
      showToast("Content refined!");
      
      // Scroll to bottom of output card if needed
      setTimeout(() => {
        outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err) {
      showToast("Refinement failed: " + err.message);
    } finally {
      setRefineLoading(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopySuccess(true);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Restore item from history
  const handleLoadHistory = (item) => {
    setActiveType(item.type);
    setTopic(item.topic);
    setTone(item.tone);
    setOptions(item.options);
    setGeneratedContent(item.content);
    
    // Set mock refinement history
    const fullPrompt = generatePrompt({ type: item.type, topic: item.topic, tone: item.tone, options: item.options });
    setRefineHistory([
      { role: "user", content: fullPrompt },
      { role: "assistant", content: item.content }
    ]);
    
    setIsHistoryOpen(false);
    showToast("Restored from history!");
  };

  // Delete history item
  const handleDeleteHistory = (id, e) => {
    e.stopPropagation();
    setHistoryList(prev => prev.filter(item => item.id !== id));
    showToast("History item removed.");
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear all generation history?")) {
      setHistoryList([]);
      showToast("All history cleared.");
    }
  };

  // Stats Counters
  const charCount = generatedContent.length;
  const wordCount = generatedContent ? generatedContent.trim().split(/\s+/).filter(Boolean).length : 0;

  const toneChoices = [
    "Professional",
    "Casual",
    "Inspirational",
    "Humorous",
    "Witty",
    "Informative",
    "Persuasive"
  ];

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div className="notification-toast">
          <Check size={16} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* App Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Sparkles size={20} />
          </div>
          <span className="logo-text">CreataAI Labs</span>
          {apiConfig.mockMode ? (
            <span className="badge badge-demo" title="Offline Demo Mode is enabled. Mock responses will be generated.">Mock Mode</span>
          ) : (
            <span className="badge badge-live" title="API integrations are active. Live LLMs will generate content.">Live Mode</span>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-icon-only" 
            onClick={() => setIsHistoryOpen(true)}
            title="Open History"
          >
            <History size={18} />
          </button>
          
          <button 
            className="btn-icon-only" 
            onClick={() => setIsSettingsOpen(true)}
            title="Open Settings"
          >
            <Settings size={18} />
          </button>
          
          <button 
            className="btn-icon-only" 
            onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-layout">
        
        {/* Left Sidebar Input Form */}
        <aside className="sidebar">
          
          {/* Content Type Selector */}
          <div className="sidebar-section">
            <span className="sidebar-label">Content Type</span>
            <div className="type-grid">
              <button
                type="button"
                className={`type-card ${activeType === "blog" ? "active" : ""}`}
                onClick={() => handleTypeChange("blog")}
              >
                <FileText />
                <span>Blog Post</span>
              </button>
              <button
                type="button"
                className={`type-card ${activeType === "caption" ? "active" : ""}`}
                onClick={() => handleTypeChange("caption")}
              >
                <MessageSquare />
                <span>Social Post</span>
              </button>
              <button
                type="button"
                className={`type-card ${activeType === "summary" ? "active" : ""}`}
                onClick={() => handleTypeChange("summary")}
              >
                <Compass />
                <span>Summary</span>
              </button>
            </div>
          </div>

          {/* Topic Inputs */}
          <div className="sidebar-section">
            <label className="sidebar-label" htmlFor="topic-input">
              {activeType === "blog" && "Topic / Keyword Outline"}
              {activeType === "caption" && "Post Topic / Product Idea"}
              {activeType === "summary" && "Source Text to Summarize"}
            </label>
            <textarea
              id="topic-input"
              className="textarea-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                activeType === "blog"
                  ? "e.g., Artificial Intelligence in healthcare, focusing on diagnosis and patient outcomes..."
                  : activeType === "caption"
                  ? "e.g., Announcing the launch of our new SaaS product CreataAI with 20% early discount..."
                  : "Paste the raw article, text block, or essay content you want to summarize..."
              }
              rows={5}
            />
          </div>

          {/* Tone Selector */}
          <div className="sidebar-section">
            <span className="sidebar-label">Writing Tone</span>
            <div className="chips-grid">
              {toneChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`chip ${tone === choice ? "active" : ""}`}
                  onClick={() => setTone(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          {/* Type-Specific Options */}
          {activeType === "blog" && (
            <div className="sidebar-section">
              <span className="sidebar-label">Length</span>
              <div className="chips-grid">
                {["short", "medium", "long"].map((len) => (
                  <button
                    key={len}
                    type="button"
                    className={`chip ${options.length === len ? "active" : ""}`}
                    onClick={() => setOptions(prev => ({ ...prev, length: len }))}
                  >
                    {len.charAt(0).toUpperCase() + len.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeType === "caption" && (
            <>
              <div className="sidebar-section">
                <label className="sidebar-label" htmlFor="platform-select">Platform</label>
                <select
                  id="platform-select"
                  className="select-input"
                  value={options.platform}
                  onChange={(e) => setOptions(prev => ({ ...prev, platform: e.target.value }))}
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Twitter/X">Twitter/X</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div className="sidebar-section" style={{ gap: "0.5rem" }}>
                <span className="sidebar-label">Formatting Toggles</span>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={options.includeEmojis}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeEmojis: e.target.checked }))}
                    />
                    Include Emojis
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={options.includeHashtags}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                    />
                    Include Hashtags
                  </label>
                </div>
              </div>
            </>
          )}

          {activeType === "summary" && (
            <>
              <div className="sidebar-section">
                <span className="sidebar-label">Summary Format</span>
                <div className="chips-grid">
                  <button
                    type="button"
                    className={`chip ${options.format === "paragraph" ? "active" : ""}`}
                    onClick={() => setOptions(prev => ({ ...prev, format: "paragraph" }))}
                  >
                    Paragraph
                  </button>
                  <button
                    type="button"
                    className={`chip ${options.format === "bullets" ? "active" : ""}`}
                    onClick={() => setOptions(prev => ({ ...prev, format: "bullets" }))}
                  >
                    Key Highlights
                  </button>
                </div>
              </div>

              <div className="sidebar-section">
                <span className="sidebar-label">Summary Depth</span>
                <div className="chips-grid">
                  {["short", "medium", "long"].map((len) => (
                    <button
                      key={len}
                      type="button"
                      className={`chip ${options.length === len ? "active" : ""}`}
                      onClick={() => setOptions(prev => ({ ...prev, length: len }))}
                    >
                      {len === "short" ? "Brief" : len === "medium" ? "Standard" : "Detailed"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Extra Instructions */}
          <div className="sidebar-section">
            <label className="sidebar-label" htmlFor="extra-instructions">Custom Constraints (Optional)</label>
            <input
              id="extra-instructions"
              type="text"
              className="text-input"
              value={options.extraInstructions}
              onChange={(e) => setOptions(prev => ({ ...prev, extraInstructions: e.target.value }))}
              placeholder="e.g., mention ChatGPT, use question hooks..."
            />
          </div>

          {/* Action Button Row */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "auto", paddingTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClear}
              style={{ flex: 1 }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              style={{ flex: 2 }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="spin" size={16} />
                  <span>Drafting...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>

        </aside>

        {/* Right Side Output Container */}
        <section className="main-content">
          
          {error && (
            <div className="error-banner">
              <Info size={16} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
              <div>
                <strong>Generation Error:</strong> {error}
                <div style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}>
                  Please check your API key in settings or use Mock Mode.
                </div>
              </div>
            </div>
          )}

          <div className="content-card">
            
            {/* Output Card Header */}
            <div className="card-header">
              <span className="card-title">
                <Zap size={18} style={{ color: "var(--primary)" }} />
                {generatedContent ? (
                  <>Generated {activeType === "blog" ? "Blog Post" : activeType === "caption" ? "Social Caption" : "Summary"}</>
                ) : (
                  <>Output Workspace</>
                )}
              </span>

              {generatedContent && (
                <div className="card-actions">
                  <button
                    className="btn-icon-only"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    title="Regenerate Output"
                  >
                    <RefreshCw size={16} className={isLoading ? "spin" : ""} />
                  </button>
                  <button
                    className="btn-icon-only"
                    onClick={handleCopyToClipboard}
                    title="Copy Content"
                  >
                    {copySuccess ? <Check size={16} style={{ color: "var(--success)" }} /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>

            {/* Output Body */}
            <div className="output-box">
              {isLoading ? (
                <div className="output-placeholder">
                  <RefreshCw className="spin" size={32} style={{ color: "var(--primary)" }} />
                  <h3>CreataAI is thinking...</h3>
                  <p>Synthesizing prompt template and processing model generation. This will take a moment.</p>
                </div>
              ) : generatedContent ? (
                <div 
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(generatedContent) }}
                />
              ) : (
                <div className="output-placeholder">
                  <Compass size={48} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
                  <h3>No content generated yet</h3>
                  <p>Fill out the sidebar parameters with your desired topic, tone, and format, and click <strong>Generate</strong> to begin.</p>
                  
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", maxWidth: "500px" }}>
                    <div style={{ flex: 1, padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>
                      <strong>⚡ Quick Mock Mode</strong><br/>
                      Click Generate instantly. The app starts in offline Mock Mode, so no API keys are required to test the interface.
                    </div>
                    <div style={{ flex: 1, padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>
                      <strong>💡 Custom Refinements</strong><br/>
                      After generating, type in the input bar at the bottom to adjust tone, add paragraphs, or change formatting in real-time.
                    </div>
                  </div>
                </div>
              )}
              <div ref={outputEndRef} />
            </div>

            {/* Output Card Footer / Counters */}
            <div className="card-footer">
              <div className="meta-stats">
                <div className="stat-item">
                  <span>Words:</span>
                  <span className="stat-value">{wordCount}</span>
                </div>
                <div className="stat-item">
                  <span>Characters:</span>
                  <span className="stat-value">{charCount}</span>
                </div>
              </div>
              
              {/* Context indicator */}
              {generatedContent && (
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Info size={12} />
                  <span>Tone: <strong>{tone}</strong></span>
                </div>
              )}
            </div>

          </div>

          {/* Refinement Prompt Bar */}
          {generatedContent && (
            <form onSubmit={handleRefineSubmit} className="refine-container">
              <div className="refine-input-wrapper">
                <Send className="refine-icon" />
                <input
                  type="text"
                  className="refine-input"
                  value={refineInput}
                  onChange={(e) => setRefineInput(e.target.value)}
                  placeholder="Need changes? Instruct CreataAI to edit this content (e.g. 'Make it shorter', 'Format as bullets')..."
                  disabled={refineLoading || isLoading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={refineLoading || isLoading || !refineInput.trim()}
              >
                {refineLoading ? (
                  <RefreshCw className="spin" size={16} />
                ) : (
                  <span>Refine</span>
                )}
              </button>
            </form>
          )}

        </section>

      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings size={18} />
                Configure AI Engines
              </h3>
              <button className="btn-icon-only" onClick={() => setIsSettingsOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body">
              
              {/* Mock Mode Selection */}
              <div className="form-group">
                <span className="sidebar-label">Connection Mode</span>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.95rem", cursor: "pointer", background: "rgba(var(--hue), 10%, 50%, 0.05)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <input
                    type="checkbox"
                    checked={apiConfig.mockMode}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, mockMode: e.target.checked }))}
                  />
                  <div>
                    <strong>Enable Mock Mode (Offline)</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                      Generates mock content without contacting third-party APIs. Perfect for testing layout.
                    </div>
                  </div>
                </label>
              </div>

              {!apiConfig.mockMode && (
                <>
                  {/* Provider Selection */}
                  <div className="form-group">
                    <span className="sidebar-label">Select AI Provider</span>
                    <div className="chips-grid">
                      <button
                        type="button"
                        className={`chip ${apiConfig.provider === "gemini" ? "active" : ""}`}
                        onClick={() => setApiConfig(prev => ({ ...prev, provider: "gemini" }))}
                      >
                        Google Gemini (Recommended)
                      </button>
                      <button
                        type="button"
                        className={`chip ${apiConfig.provider === "openai" ? "active" : ""}`}
                        onClick={() => setApiConfig(prev => ({ ...prev, provider: "openai" }))}
                      >
                        OpenAI GPT-4o
                      </button>
                    </div>
                  </div>

                  {/* Gemini Key */}
                  {apiConfig.provider === "gemini" && (
                    <>
                      <div className="form-group">
                        <label className="sidebar-label" htmlFor="gemini-model-select">Gemini Model</label>
                        <select
                          id="gemini-model-select"
                          className="select-input"
                          value={apiConfig.geminiModel}
                          onChange={(e) => setApiConfig(prev => ({ ...prev, geminiModel: e.target.value }))}
                        >
                          <option value="gemini-1.5-flash">gemini-1.5-flash (Default)</option>
                          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                          <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="sidebar-label" htmlFor="gemini-key">Gemini API Key</label>
                        <input
                          id="gemini-key"
                          type="password"
                          className="text-input"
                          value={apiConfig.geminiKey}
                          onChange={(e) => setApiConfig(prev => ({ ...prev, geminiKey: e.target.value }))}
                          placeholder="AIzaSy..."
                        />
                        <div className="api-instructions">
                          Get a free Gemini API Key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "underline" }}>Google AI Studio <Plus size={10} style={{ display: "inline" }} /></a>.
                        </div>
                      </div>
                    </>
                  )}

                  {/* OpenAI Key */}
                  {apiConfig.provider === "openai" && (
                    <>
                      <div className="form-group">
                        <label className="sidebar-label" htmlFor="openai-model-select">OpenAI Model</label>
                        <select
                          id="openai-model-select"
                          className="select-input"
                          value={apiConfig.openAIModel}
                          onChange={(e) => setApiConfig(prev => ({ ...prev, openAIModel: e.target.value }))}
                        >
                          <option value="gpt-4o">gpt-4o (Recommended)</option>
                          <option value="gpt-4o-mini">gpt-4o-mini</option>
                          <option value="gpt-4">gpt-4</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="sidebar-label" htmlFor="openai-key">OpenAI API Key</label>
                        <input
                          id="openai-key"
                          type="password"
                          className="text-input"
                          value={apiConfig.openAIKey}
                          onChange={(e) => setApiConfig(prev => ({ ...prev, openAIKey: e.target.value }))}
                          placeholder="sk-proj-..."
                        />
                        <div className="api-instructions">
                          Get an OpenAI API Key from your <a href="https://platform.openai.com/" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "underline" }}>OpenAI Dashboard <Plus size={10} style={{ display: "inline" }} /></a>.
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setIsSettingsOpen(false)}>
                Save & Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* History Slide Drawer */}
      <div className={`history-drawer ${isHistoryOpen ? "open" : ""}`}>
        <div className="history-header">
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <History size={18} />
            Saved History
          </h3>
          <button className="btn-icon-only" onClick={() => setIsHistoryOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="history-list">
          {historyList.length > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleClearAllHistory}
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Trash2 size={12} />
                  Clear All
                </button>
              </div>
              {historyList.map((item) => (
                <div
                  key={item.id}
                  className="history-item"
                  onClick={() => handleLoadHistory(item)}
                >
                  <div className="history-item-meta">
                    <span style={{ textTransform: "capitalize", fontWeight: "600", color: "var(--primary)" }}>
                      {item.type} ({item.tone})
                    </span>
                    <span>{item.timestamp.split(",")[1]?.trim() || item.timestamp}</span>
                  </div>
                  <div className="history-item-title">
                    {item.topic}
                  </div>
                  <div className="history-item-snippet">
                    {item.content.replace(/[#*`_]/g, "").substring(0, 100)}...
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                    <button
                      className="btn-icon-only"
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      style={{ width: "1.5rem", height: "1.5rem", borderRadius: "3px" }}
                      title="Delete entry"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="history-empty">
              <History size={32} style={{ opacity: 0.3 }} />
              <p>No generation history yet.</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Items you generate will appear here for restoring later.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
