import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Bot, User, Loader2 } from 'lucide-react';
import { assistantService } from '../services/assistantService';
import { useYoga } from '../context/YogaContext';
import { useAuth } from '../context/AuthContext';

const SUGGESTED_PROMPTS = [
  "How do I correctly align my front knee in Warrior II?",
  "How do I improve my balance in Tree Pose?",
  "Common mistakes in Downward-Facing Dog?",
  "Give me a 10-minute beginner yoga routine.",
  "What should I eat before and after a yoga workout?",
  "How does the AI alignment score evaluate my posture?"
];

export default function AIAssistant() {
  const { selectedPose } = useYoga();
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: "m-welcome",
      role: "assistant",
      content: "Hello Ananya! 👋 I am your FitVerse AI Fitness & Yoga Companion. How can I guide your practice or posture today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const context = {
        current_pose: selectedPose?.name || null,
        weekly_goal: user?.weekly_goal_minutes || 150
      };

      const res = await assistantService.sendMessage(text, context, messages);
      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.reply || "I am here to help you improve your yoga practice!"
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "I'm having a brief connection pause with the coach service, but remember to keep your spine neutral, breathe steadily, and keep knees tracking straight over your toes!"
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "m-welcome-reset",
        role: "assistant",
        content: "Conversation refreshed. What would you like to explore next?"
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-130px)] bg-white rounded-3xl border border-[#F0E6F7] shadow-card overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 px-6 border-b border-[#F0E6F7] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-fitverse-lavender p-1.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden border border-purple-100">
            <img src="/assets/ai_coach_robot.svg" alt="FitVerse AI Coach" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-fitverse-dark">FitVerse AI Coach</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-fitverse-mint text-fitverse-green-success font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-fitverse-green-success animate-pulse"></span>
                Gemini Powered
              </span>
            </div>
            <p className="text-xs text-fitverse-muted">Ask anything about yoga postures, biomechanics, recovery & fitness</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Clear Conversation"
          className="p-2 rounded-xl text-fitverse-muted hover:text-fitverse-error hover:bg-red-50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FCFAFD]">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? "bg-fitverse-purple text-white shadow-xs"
                    : "bg-fitverse-lavender text-fitverse-purple"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[78%] p-4 rounded-3xl text-sm leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-fitverse-purple to-[#8F52C6] text-white rounded-tr-xs shadow-sm font-medium"
                    : "bg-white text-fitverse-dark border border-[#F0E6F7] rounded-tl-xs shadow-card whitespace-pre-line"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-fitverse-lavender flex items-center justify-center text-xs font-bold text-fitverse-purple">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white text-fitverse-muted border border-[#F0E6F7] rounded-3xl rounded-tl-xs p-4 flex items-center gap-2 shadow-xs text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-fitverse-purple" />
              <span>Thinking and formulating yoga guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      <div className="p-3 px-6 bg-white border-t border-[#F5EDFA] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-fitverse-muted shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-fitverse-purple" />
          Suggested:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="text-xs px-3 py-1.5 rounded-full bg-[#F5EDFA] hover:bg-fitverse-lavender text-fitverse-dark font-medium transition-colors whitespace-nowrap shrink-0 border border-[#EADBFA] cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 px-6 bg-white border-t border-[#F0E6F7]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about yoga poses, alignment tips, nutrition, or workouts..."
            className="flex-1 bg-[#FAF6FD] border border-[#EADBFA] rounded-2xl px-5 py-3 text-sm text-fitverse-dark placeholder-fitverse-muted focus:outline-none focus:border-fitverse-purple focus:ring-2 focus:ring-fitverse-purple/20 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-3 rounded-2xl transition-all shadow-md cursor-pointer ${
              input.trim() && !loading
                ? "bg-fitverse-purple hover:bg-[#975fc3] text-white"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

