import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const createSession = (title = "New Chat", messages = []) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    messages,
    createdAt: new Date().toISOString(),
    hasCustomTitle: false
  });

  const getSessionTitle = (messages) => {
    const firstUser = messages.find((msg) => msg.role === "user" && msg.text?.trim());
    const text = firstUser?.text?.trim();
    if (!text) return "New Chat";
    // Return the full first user message text for auto-generated titles.
    return text;
  };

  const loadSessions = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("chat_sessions") || "null");
      if (stored?.sessions?.length) {
        // Ensure backwards-compatibility: sessions missing `hasCustomTitle`
        // should default to (session.title !== "New Chat").
        const normalized = stored.sessions.map((s) => ({
          ...s,
          hasCustomTitle:
            typeof s.hasCustomTitle === "boolean"
              ? s.hasCustomTitle
              : s.title !== "New Chat"
        }));
        return {
          sessions: normalized,
          activeChatId: stored.activeChatId || normalized[0].id
        };
      }

      const oldChat = JSON.parse(localStorage.getItem("chat_messages") || "null");
      if (Array.isArray(oldChat)) {
        const session = createSession(getSessionTitle(oldChat), oldChat);
        // For legacy single-chat format, consider the title custom when
        // it isn't the default "New Chat" (backwards-compatibility).
        session.hasCustomTitle = session.title !== "New Chat";
        return { sessions: [session], activeChatId: session.id };
      }
    } catch (err) {
      // fall back to a fresh session
    }

    const session = createSession();
    return { sessions: [session], activeChatId: session.id };
  };

  const initialData = loadSessions();
  const [sessions, setSessions] = useState(initialData.sessions);
  const [activeChatId, setActiveChatId] = useState(initialData.activeChatId);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedCodeBlockId, setCopiedCodeBlockId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState("");
  const [typingChatId, setTypingChatId] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("mini_gpt_theme") || "dark");

  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const chatRef = useRef([]);
  const shouldAutoScrollRef = useRef(true);
  const copyTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    const chatElement = chatContainerRef.current;
    if (chatElement) {
      chatElement.scrollTo({
        top: chatElement.scrollHeight,
        behavior: "smooth"
      });
      return;
    }

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest"
    });
  };

  const renderMarkdownCode = ({ inline, className, children, ...props }) => {
    const isFenced = !inline;
    const codeText = String(children).replace(/\n$/, "");
    // Use the code text as a stable identifier so re-renders keep the same id
    const codeBlockId = codeText;

    if (!isFenced) {
      return (
        <code className={className} {...props}>
          {codeText}
        </code>
      );
    }

    return (
      <div style={styles.codeBlockWrapper}>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(codeText);
              setCopiedCodeBlockId(codeBlockId);
              if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
              }
              copyTimeoutRef.current = setTimeout(() => {
                setCopiedCodeBlockId(null);
                copyTimeoutRef.current = null;
              }, 2000);
            } catch (err) {
              console.error("Failed to copy code block", err);
            }
          }}
          style={styles.copyButton}
        >
          {copiedCodeBlockId === codeBlockId ? "Copied!" : "Copy"}
        </button>
        <pre style={styles.codeBlockPre}>
          <code className={className} {...props}>
            {codeText}
          </code>
        </pre>
      </div>
    );
  };

  const TypingIndicator = () => (
    <div style={styles.messageRow}>
      <div style={{ ...styles.messageBubble, backgroundColor: "#444654" }}>
        <div style={styles.typingIndicatorContainer}>
          <span style={styles.typingDot}></span>
          <span style={styles.typingDot}></span>
          <span style={styles.typingDot}></span>
        </div>
      </div>
    </div>
  );

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeChatId) || sessions[0],
    [sessions, activeChatId]
  );
  const chat = useMemo(() => activeSession?.messages || [], [activeSession]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    setTypingChatId(activeChatId);
    // Immediately jump to the latest messages when user sends
    shouldAutoScrollRef.current = true;
    scrollToBottom();

    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    const userMessage = { role: "user", text: input };
    const apiMessages = [...chatRef.current, userMessage];
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== activeChatId) return session;
        const updatedMessages = [
          ...session.messages,
          userMessage
        ];
        return {
          ...session,
          messages: updatedMessages,
          title:
            session.title === "New Chat" && session.messages.length === 0 && !session.hasCustomTitle
              ? getSessionTitle([userMessage])
              : session.title
        };
      })
    );

    const messages = apiMessages.map((msg) => ({
      role: msg.role === "bot" ? "assistant" : "user",
      content: msg.text
    }));

    try {
      const res = await fetch("https://mini-chatgpt-backend-nvjy.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages })
      });

      const data = await res.json();
      let fullText = "";

      if (!res.ok) {
        const errorText = data?.reply?.message || data?.message || res.statusText || "API request failed.";
        fullText = `⚠️ API error: ${errorText}`;
      } else if (typeof data?.reply?.choices?.[0]?.message?.content === "string") {
        fullText = data.reply.choices[0].message.content;
      } else {
        const errorText = data?.reply?.message || data?.message || "Unexpected response format.";
        fullText = `⚠️ API error: ${errorText}`;
      }

      // Add empty bot message and clear typing indicator
      setTypingChatId(null);
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeChatId) return session;
          const updated = [...session.messages];
          updated.push({ role: "bot", text: "" });
          return { ...session, messages: updated };
        })
      );

      // 🧠 WORD-BY-WORD STREAMING
      const words = fullText.split(" ");
      let index = 0;

      streamIntervalRef.current = setInterval(() => {
        index++;

        setSessions((prev) =>
          prev.map((session) => {
            if (session.id !== activeChatId) return session;
            const updated = [...session.messages];
            updated[updated.length - 1] = {
              role: "bot",
              text: words.slice(0, index).join(" ")
            };
            return { ...session, messages: updated };
          })
        );

        if (index >= words.length) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
          // When streaming completes, keep focus on input so user can type next message
          inputRef.current?.focus();
        }
      }, 50); // ⏱️ speed (60–120 ideal)

    } catch (error) {
      console.error("sendMessage caught error", error);
      setTypingChatId(null);
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeChatId) return session;
          const updated = [...session.messages];
          updated.push({ role: "bot", text: "⚠️ Error occurred" });
          return { ...session, messages: updated };
        })
      );
    }

    setInput("");
    setLoading(false);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions((prev) => {
      const remaining = prev.filter((session) => session.id !== sessionId);
      if (remaining.length === 0) {
        const session = createSession();
        setActiveChatId(session.id);
        return [session];
      }
      if (sessionId === activeChatId) {
        setActiveChatId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleChatScroll = () => {
    const chatElement = chatContainerRef.current;
    if (!chatElement) return;

    const distanceFromBottom =
      chatElement.scrollHeight - (chatElement.scrollTop + chatElement.clientHeight);
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  };

  const handleStartEdit = (sessionId, currentTitle) => {
    setEditingSessionId(sessionId);
    setEditingSessionTitle(currentTitle);
  };

  const handleSaveEdit = (sessionId) => {
    if (editingSessionTitle.trim()) {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, title: editingSessionTitle.trim(), hasCustomTitle: true }
            : session
        )
      );
    }
    setEditingSessionId(null);
    setEditingSessionTitle("");
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingSessionTitle("");
  };

  // Auto scroll to newest message when chat updates, only when user is near bottom
  useLayoutEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [chat]);

  // Keep a ref to the latest chat state, so sendMessage always uses the freshest conversation
  useLayoutEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  // Persist chat sessions to localStorage whenever sessions or active chat changes
  useEffect(() => {
    localStorage.setItem(
      "chat_sessions",
      JSON.stringify({ sessions, activeChatId })
    );
  }, [sessions, activeChatId]);

  // Auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Persist theme selection
  useEffect(() => {
    try {
      localStorage.setItem("mini_gpt_theme", theme);
    } catch (e) {
      // ignore write errors
    }
  }, [theme]);

  const stylesToUse = useMemo(() => {
    if (theme !== "light") return styles;

    return {
      ...styles,
      app: { ...styles.app, backgroundColor: "#f7f8fb", color: "#0f1720" },
      sidebar: { ...styles.sidebar, backgroundColor: "#ffffff", borderRight: "1px solid #e6e9ee" },
      logoCircle: { ...styles.logoCircle, backgroundColor: "#0ea37f", color: "white" },
      sessionItem: { ...styles.sessionItem, backgroundColor: "#ffffff", border: "1px solid #eef0f3", color: "#0f1720" },
      sessionItemActive: { ...styles.sessionItemActive, borderColor: "#0ea37f", backgroundColor: "#f0faf6" },
      sessionItemSubtitle: { ...styles.sessionItemSubtitle, color: "#6b7280" },
      inputContainer: { ...styles.inputContainer, backgroundColor: "#ffffff", borderTop: "1px solid #e6e9ee" },
      inputBox: { ...styles.inputBox, backgroundColor: "#ffffff" },
      input: { ...styles.input, color: "#0f1720" },
      messageBubble: { ...styles.messageBubble, color: "#0f1720" },
      copyButton: { ...styles.copyButton, backgroundColor: "#ffffff", border: "1px solid #e6e9ee", color: "#0f1720" },
      userBubble: "#10a37f",
      assistantBubble: "#f1f3f5",
      userText: "#ffffff",
      assistantText: "#0f1720",
      scrollbarTrack: "#f1f3f5",
      scrollbarThumb: "#d1d5db",
      scrollbarThumbHover: "#9ca3af"
    };
  }, [theme]);

  const styleTag = useMemo(() => {
    const isLight = theme === "light";
    const track = isLight ? stylesToUse.scrollbarTrack : "#1f1f23";
    const thumb = isLight ? stylesToUse.scrollbarThumb : "#343541";
    const thumbHover = isLight ? stylesToUse.scrollbarThumbHover : "#4b4b53";
    return `\n      #app-root pre{overflow-x:auto;max-width:100%;}\n      #app-root pre code{white-space:pre;}\n      @keyframes typing { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-10px); } }\n      #app-root { scrollbar-color: ${thumb} ${track}; scrollbar-width: thin; }\n      #app-root ::-webkit-scrollbar { width: 10px; height: 10px; }\n      #app-root ::-webkit-scrollbar-track { background: ${track}; }\n      #app-root ::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 8px; border: 2px solid ${track}; }\n      #app-root ::-webkit-scrollbar-thumb:hover { background: ${thumbHover}; }\n    `;
  }, [theme, stylesToUse]);

  return (
    <div id="app-root" style={stylesToUse.app}>
      <style>{styleTag}</style>
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoCircle}>AI</div>
          <div>
            <div style={styles.sidebarTitle}>MiniGPT</div>
            <div style={styles.sidebarSubtitle}>Conversational AI</div>
          </div>
          <button
            type="button"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            style={styles.themeToggleBtn}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>

        <button
          style={styles.newChatBtn}
          onClick={() => {
            if (streamIntervalRef.current) {
              clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = null;
            }
            setTypingChatId(null);
            const session = createSession();
            setSessions((prev) => [...prev, session]);
            setActiveChatId(session.id);
            chatRef.current = [];
            shouldAutoScrollRef.current = true;
            setInput("");
            setLoading(false);
              inputRef.current?.focus();
          }}
        >
          + New Chat
        </button>

        <div style={styles.sidebarHistory}>
          <div style={styles.sidebarSectionTitle}>Chat History</div>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                ...styles.sessionItem,
                ...(session.id === activeChatId ? styles.sessionItemActive : {})
              }}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveChatId(session.id);
                setTypingChatId(null);
                shouldAutoScrollRef.current = true;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveChatId(session.id);
                  setTypingChatId(null);
                  shouldAutoScrollRef.current = true;
                }
              }}
            >
              <div style={styles.sessionItemHeader}>
                {editingSessionId === session.id ? (
                  <input
                    type="text"
                    value={editingSessionTitle}
                    onChange={(e) => setEditingSessionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(session.id);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    onBlur={() => handleSaveEdit(session.id)}
                    autoFocus
                    style={styles.editInput}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div style={styles.sessionItemTitle} title={session.title}>{session.title}</div>
                )}
                <div style={styles.sessionItemActions} onClick={(e) => e.stopPropagation()}>
                  {editingSessionId !== session.id && (
                    <button
                      type="button"
                      style={styles.editBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(session.id, session.title);
                      }}
                      aria-label={`Rename chat ${session.title}`}
                      title={`Rename: ${session.title}`}
                    >
                      ✎
                    </button>
                  )}
                  <button
                    type="button"
                    style={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    aria-label={`Delete chat ${session.title}`}
                    title={`Delete: ${session.title}`}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div style={styles.sessionItemSubtitle}>
                {new Date(session.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>

        {/* Chat */}
        <div
          ref={chatContainerRef}
          style={styles.chatArea}
          onScroll={handleChatScroll}
        >
          {chat.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.messageRow,
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  backgroundColor:
                    msg.role === "user" ? "#10a37f" : "#444654"
                }}
              >
                {msg.role === "bot" ? (
                  <ReactMarkdown components={{ code: renderMarkdownCode }}>
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          {typingChatId === activeChatId && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputContainer}>
          <div style={styles.inputBox}>
            <input
              ref={inputRef}
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Send a message..."
              style={styles.input}
            />
            <button onClick={sendMessage} disabled={loading} style={styles.sendBtn}>
              {loading ? "..." : "➤"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#343541",
    color: "white"
  },
  sidebar: {
    width: "280px",
    minWidth: "260px",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#202123",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    borderRight: "1px solid #2a2b32"
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "10px"
  },
  logoCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    backgroundColor: "#10a37f",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "16px"
  },
  sidebarTitle: {
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "4px"
  },
  sidebarSubtitle: {
    color: "#9aa0a6",
    fontSize: "13px"
  },
  newChatBtn: {
    padding: "12px 14px",
    backgroundColor: "#343541",
    border: "1px solid #555",
    color: "white",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left"
  },
  sidebarHistory: {
    flex: 1,
    overflowY: "auto",
    paddingRight: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px"
  },
  sidebarSectionTitle: {
    fontSize: "13px",
    color: "#9aa0a6",
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  },
  sessionItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    boxSizing: "border-box",
    borderRadius: "12px",
    backgroundColor: "#17181b",
    border: "1px solid transparent",
    color: "white",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  sessionItemHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px"
  },
  deleteBtn: {
    border: "none",
    background: "transparent",
    color: "#9aa0a6",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    padding: "0",
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  editBtn: {
    border: "none",
    background: "transparent",
    color: "#9aa0a6",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: 1,
    padding: "0",
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  editInput: {
    flex: 1,
    background: "#343541",
    border: "1px solid #10a37f",
    color: "white",
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "14px",
    outline: "none"
  },
  sessionItemActive: {
    borderColor: "#10a37f",
    backgroundColor: "#202123"
  },
  sessionItemTitle: {
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0
  },
  sessionItemActions: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "70px",
    flex: "0 0 70px"
  },
  sessionItemSubtitle: {
    fontSize: "12px",
    color: "#8c9299"
  },
  historyPlaceholder: {
    padding: "10px",
    borderRadius: "12px",
    backgroundColor: "#161617",
    border: "1px solid #2f3136"
  },
  historyPlaceholderItem: {
    color: "#b1b5ba",
    fontSize: "14px",
    lineHeight: 1.5
  },
  main: {
    flex: 1,
    minWidth: "320px",
    display: "flex",
    flexDirection: "column"
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px"
  },
  messageRow: {
    display: "flex",
    marginBottom: "15px"
  },
  messageBubble: {
    padding: "12px 16px",
    borderRadius: "12px",
    maxWidth: "70%",
    lineHeight: "1.5"
  },
  codeBlockWrapper: {
    position: "relative",
    marginTop: "12px"
  },
  codeBlockPre: {
    overflowX: "auto",
    maxWidth: "100%",
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "#1e1f24",
    margin: 0
  },
  copyButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    backgroundColor: "#343541",
    border: "1px solid #555",
    color: "white",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    cursor: "pointer"
  },
  inputContainer: {
    flexShrink: 0,
    padding: "15px",
    borderTop: "1px solid #555",
    backgroundColor: "#40414f"
  },
  inputBox: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#343541",
    borderRadius: "25px",
    padding: "5px 10px"
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "white",
    padding: "10px"
  },
  sendBtn: {
    backgroundColor: "#10a37f",
    border: "none",
    borderRadius: "50%",
    width: "35px",
    height: "35px",
    color: "white",
    cursor: "pointer"
  },
  typingIndicatorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  typingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#888",
    animation: "typing 1.4s infinite"
  }
  ,
  themeToggleBtn: {
    marginLeft: "auto",
    background: "transparent",
    border: "1px solid transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: "16px",
    padding: "6px 8px",
    borderRadius: "8px",
    lineHeight: 1
  }
};

export default App;