import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

// Ensure ChartJS is registered
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- 1. NEW: Responsive Styling Logic ---
// We pass windowWidth to this component to calculate styles dynamically
const AnimatedChatBox = ({ isOpen, children, windowWidth }) => {
    
    // Determine dynamic dimensions based on breakpoints
    let boxWidth = 380; // Default Desktop
    let rightPos = 24;
    let bottomPos = 24;
    let maxHeight = 450;
    
    if (windowWidth <= 400) {
        // Very small screens (iPhone SE, etc)
        boxWidth = "calc(100vw - 32px)"; // Full width minus margins
        rightPos = 16;
        bottomPos = 16;
        maxHeight = "75vh"; // Prevent it from being too tall on small screens
    } else if (windowWidth <= 500) {
        // Small/Medium Mobiles
        boxWidth = 360; 
        rightPos = 20;
        bottomPos = 20;
        maxHeight = "80vh";
    } else if (windowWidth <= 600) {
        // Large Phones / Small Tablets
        boxWidth = 380;
        rightPos = 24;
        bottomPos = 24;
        maxHeight = "80vh";
    }

    const style = {
        position: "fixed",
        bottom: bottomPos,
        right: rightPos,
        width: boxWidth,
        zIndex: 999,
        background: "#1f2937",
        color: "#f1f5f9",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        maxHeight: maxHeight,
        height: maxHeight, // Ensure it fills the height on mobile
        overflow: "hidden",
        // Animation properties
        transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out, width 0.3s ease, height 0.3s ease', // Added width/height transition
    };

    if (!isOpen && style.opacity === 0) return null;

    return <div style={style}>{children}</div>;
};

export default function FloatingAIChatWithCharts({ studentId }) {
  // --- 2. NEW: Window Resize Listener ---
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      type: "text",
      content: "Hi! I'm your AI Internship Assistant. I can show your performance trends and recommend internships."
    }
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]); // Scroll when opened too

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { sender: "user", type: "text", content: input };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("analytics") || lowerInput.includes("chart") || lowerInput.includes("performance")) {
        const res = await fetch(`/api/studentAnalytics?studentId=${studentId}`);
        const data = await res.json();

        if (!data || !data.evaluations) {
          setMessages(prev => [...prev, { sender: "ai", type: "text", content: "Sorry, I could not fetch your performance data." }]);
        } else {
          const performanceChart = {
            labels: data.evaluations.map(e =>
              new Date(e.week_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            ),
            datasets: [
              {
                label: "Quality",
                data: data.evaluations.map(e => e.quality_rating),
                borderColor: "#fb923c",
                backgroundColor: "rgba(251, 146, 60, 0.2)",
                tension: 0.4,
              },
              {
                label: "Productivity",
                data: data.evaluations.map(e => e.productivity_rating),
                borderColor: "#34C759",
                backgroundColor: "rgba(52, 199, 89, 0.2)",
                tension: 0.4,
              },
              {
                label: "Teamwork",
                data: data.evaluations.map(e => e.teamwork_rating),
                borderColor: "#0ea5e9",
                backgroundColor: "rgba(14, 165, 233, 0.2)",
                tension: 0.4,
              }
            ]
          };

          const matchText = data.matches && data.matches.length
            ? "Top Internship Matches:\n" + data.matches.map(m => `${m.name} (Score: ${m.score})`).join("\n")
            : "No matches available at the moment.";

          setMessages(prev => [
            ...prev,
            { sender: "ai", type: "text", content: "Here's your performance analysis and top matches:" },
            { sender: "ai", type: "chart", content: performanceChart },
            { sender: "ai", type: "text", content: matchText }
          ]);
        }
      } else {
        setMessages(prev => [...prev, { sender: "ai", type: "typing" }]);

        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, message: input })
        });

        let data;
        try {
          data = await res.json();
        } catch {
          data = { reply: "Sorry, I could not process your request at the moment." };
        }

        setMessages(prev => {
            const newMessages = prev.filter(m => m.type !== "typing");
            return [...newMessages, { sender: "ai", type: "text", content: data.reply, animating: true }]; 
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev.filter(m => m.type !== "typing"), { sender: "ai", type: "text", content: "Oops! Something went wrong." }]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button - Responsive Position */}
      <div style={{ 
          position: "fixed", 
          bottom: windowWidth <= 400 ? 16 : 24, 
          right: windowWidth <= 400 ? 16 : 24, 
          zIndex: 999 
      }}>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            background: "#fb923c",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            opacity: isOpen ? 0.9 : 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.05)' : 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1)' : 'scale(1)')}
        >
          {isOpen ? '×' : '🤖'}
        </button>
      </div>

      {/* Responsive Chat Widget */}
      <AnimatedChatBox isOpen={isOpen} windowWidth={windowWidth}>
        {/* Header */}
        <div
          style={{
            padding: 12,
            background: "#374151",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            fontWeight: "600",
            fontSize: windowWidth < 400 ? 14 : 16 // Smaller text on small mobile
          }}
        >
          <span>AI Internship Assistant</span>
          <button
            onClick={() => setIsOpen(false)}
            style={{ 
                background: "transparent", 
                color: "#e5e7eb", 
                border: "none", 
                fontSize: 20, 
                cursor: "pointer",
                lineHeight: "1",
                padding: "0 6px",
                borderRadius: "4px",
                transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4b5563")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            &times;
          </button>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, padding: 12, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {messages.map((msg, idx) => (
            <div 
                key={idx} 
                style={{ 
                    textAlign: msg.sender === "user" ? "right" : "left", 
                    marginBottom: 12,
                    opacity: msg.animating ? 0 : 1,
                    transform: msg.animating ? 'translateY(10px)' : 'translateY(0)',
                    transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                    animationDelay: '0.1s', 
                    animationFillMode: 'forwards'
                }}
                ref={msg.animating ? (el) => {
                    if (el && msg.animating) {
                        setTimeout(() => {
                            setMessages(prev => prev.map((m, i) => i === idx ? { ...m, animating: false } : m));
                        }, 50); 
                    }
                } : null}
            >
              {msg.type === "text" && (
                <span
                  style={{
                    background: msg.sender === "user" ? "#fb923c" : "#374151",
                    color: msg.sender === "user" ? "#fff" : "#f1f5f9",
                    padding: "8px 12px",
                    borderRadius: msg.sender === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                    display: "inline-block",
                    maxWidth: "85%",
                    whiteSpace: "pre-wrap",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    fontSize: windowWidth < 400 ? 13 : 14 // Readable font on mobile
                  }}
                >
                  {msg.content}
                </span>
              )}
              {msg.type === "chart" && (
                <div style={{ 
                    background: "#2a3340",
                    padding: 10,
                    borderRadius: 12,
                    marginTop: 8, 
                    textAlign: "left"
                }}>
                  {/* Chart height adjusted for mobile */}
                  <div style={{ height: windowWidth < 400 ? 180 : 220 }}>
                     <Line data={msg.content} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              )}
              {msg.type === "typing" && (
                <span style={{ fontStyle: "italic", color: "#9ca3af" }}>
                    AI is typing<span className="typing-dot">.</span><span className="typing-dot" style={{animationDelay: '0.2s'}}>.</span><span className="typing-dot" style={{animationDelay: '0.4s'}}>.</span>
                </span>
              )}
            </div>
          ))}
          {loading && !messages.some(m => m.type === "typing") && <div style={{ color: "#9ca3af" }}>AI is typing...</div>}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input Area */}
        <div style={{ display: "flex", borderTop: "1px solid #4b5563", padding: 8, alignItems: "center" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask..." // Shorter placeholder on mobile
            disabled={loading}
            style={{
              flex: 1,
              padding: 10,
              height: 40,
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#1e293b",
              color: "#f1f5f9",
              fontSize: 14,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#fb923c")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#4b5563")}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            style={{ 
                background: "#fb923c", 
                border: "none", 
                padding: windowWidth < 400 ? "0 10px" : "0 16px", // Compact button on mobile
                borderRadius: 8, 
                color: "#fff", 
                marginLeft: 8,
                height: 40,
                fontWeight: "600",
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: "background-color 0.2s, opacity 0.2s"
            }}
            onMouseEnter={(e) => (!loading && (e.currentTarget.style.backgroundColor = "#e87e2f"))}
            onMouseLeave={(e) => (!loading && (e.currentTarget.style.backgroundColor = "#fb923c"))}
            disabled={loading}
          >
            {windowWidth < 400 ? ">" : "Send"} {/* Icon vs Text on small screen */}
          </button>
        </div>
      </AnimatedChatBox>
    </>
  );
}