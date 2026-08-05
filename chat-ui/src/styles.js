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
  messageTimestamp: {
    fontSize: "12px",
    lineHeight: "1.3",
    opacity: 0.8
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
  },
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

export default styles;
