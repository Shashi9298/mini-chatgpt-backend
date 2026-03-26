import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);

    const userMessage = { role: "user", text: input };

    // Add user + typing placeholder
    setChat(prev => [
      ...prev,
      userMessage,
      { role: "bot", text: "Typing..." }
    ]);

    try {
      const messages = [
        ...chat,
        userMessage
      ].map(msg => ({
        role: msg.role === "bot" ? "assistant" : "user",
        content: msg.text
      }));

      const res = await fetch("https://mini-chatgpt-backend-nvjy.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages })
      });

      const data = await res.json();
      console.log(data);
      const fullText = data.reply.choices[0].message.content;

      // 🧠 WORD-BY-WORD STREAMING
      const words = fullText.split(" ");
      let index = 0;

      // Replace "Typing..." with empty first
      setChat(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: "" };
        return updated;
      });

      const interval = setInterval(() => {
        index++;

        setChat(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            text: words.slice(0, index).join(" ")
          };
          return updated;
        });

        if (index >= words.length) {
          clearInterval(interval);
        }
      }, 50); // ⏱️ speed (60–120 ideal)

    } catch (error) {
      setChat(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: "⚠️ Error occurred"
        };
        return updated;
      });
    }

    setInput("");
    setLoading(false);
  };

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div style={styles.app}>
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>MiniGPT</div>
        <button style={styles.newChatBtn} onClick={() => setChat([])}>
          + New Chat
        </button>
      </div>

      {/* Main */}
      <div style={styles.main}>

        {/* Chat */}
        <div style={styles.chatArea}>
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
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
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
    backgroundColor: "#343541",
    color: "white"
  },
  sidebar: {
    width: "250px",
    backgroundColor: "#202123",
    padding: "15px",
    display: "flex",
    flexDirection: "column"
  },
  sidebarTitle: {
    fontSize: "18px",
    marginBottom: "20px"
  },
  newChatBtn: {
    padding: "10px",
    backgroundColor: "#343541",
    border: "1px solid #555",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer"
  },
  main: {
    flex: 1,
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
  inputContainer: {
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
  }
};

export default App;