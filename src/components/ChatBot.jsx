import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  TrashIcon,
  StopIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import ExampleQuestions from "./ExampleQuestions";


function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingDots, setThinkingDots] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [controller, setController] = useState(null);
  const messagesEndRef = useRef(null);
  const [runningQuestion, setRunningQuestion] = useState(null);
  const [cacheEnabled, setCacheEnabled] = useState(true);

  const scrollToBottom = () => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Thinking message that updates every 4 seconds
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setThinkingDots((prev) => (prev + 1) % 4);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const getThinkingMessage = () => {
    const dots = ".".repeat(thinkingDots + 1);
    const messages = [
      "Analyzing your question",
      "Processing request",
      "Consulting Flagstone knowledge",
      "Preparing response",
    ];
    return `${messages[thinkingDots]}${dots}`;
  };

  const clearChat = () => {
    // Only clear messages, don't cancel running questions
    setMessages([]);

    // Keep the selected question and input if a question is running
    if (!isLoading) {
      setSelectedQuestion("");
      setInput("");
    }
  };

  const cancelRequest = () => {
    if (controller) {
      console.log("Cancelling request...");
      controller.abort();
      setIsLoading(false);
      setController(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Get the current input value at time of submission
    const currentInput = input.trim();
    if (!currentInput) return;

    // Clear selected question if input was typed manually
    if (currentInput !== selectedQuestion) {
      setSelectedQuestion("");
    }

    const userMessage = { role: "user", content: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput(currentInput);
    setRunningQuestion(currentInput);
    setIsLoading(true);
    setThinkingDots(0);

    // Create new AbortController for this request
    const abortController = new AbortController();
    setController(abortController);

    try {
      console.log("Sending POST request to /api/chat");
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ message: currentInput }),
        signal: abortController.signal,
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.details || "Failed to get response");
      }

      const data = await response.json();
      console.log("Received response data:", data);

      if (!data.response) {
        throw new Error("Empty response from server");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response.replace(/^ASSISTANT:\s*/i, "").trim(),
        },
      ]);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request cancelled by user");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Request cancelled by user.",
          },
        ]);
        return;
      }
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setController(null);
      setRunningQuestion(null);
      setInput("");
    }
  };

  const handleQuestionClick = (question, shouldCancel = false) => {
    // If there's a running question, cancel it first
    if (isLoading && controller) {
      cancelRequest();
    }

    // If clicking the same question that's already selected
    if (question === selectedQuestion && !isLoading) {
      setSelectedQuestion("");
      setInput("");
      return;
    }

    // If clicking a different question, update state and submit
    setSelectedQuestion(question || "");
    setInput(question || "");

    // Submit immediately if it's a new question
    if (question) {
      // Use setTimeout to ensure state updates before submit
      setTimeout(() => {
        const event = { preventDefault: () => {} };
        handleSubmit(event);
      }, 0);
    }
  };

  // Function to format currency numbers only
  const formatContent = (content) => {
    // First, handle currency amounts with commas to prevent markdown list interpretation

    // Then handle any remaining line breaks after currency amounts
    return content.replace(
      /([£$€][\d,.]+)(?: (?:million|k|thousand|m))?\s*\n+/g,
      (match) => match.trim() + " "
    );
  };

  const MessageContent = ({ message }) => {
    const isError =
      message.role === "assistant" && message.content.startsWith("Error:");

    if (isError) {
      return (
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-100 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-100 mb-1">Error Occurred</p>
            <p className="text-red-100">
              {message.content.replace("Error:", "").trim()}
            </p>
          </div>
          <XCircleIcon className="w-5 h-5 text-red-100 mt-1 flex-shrink-0" />
        </div>
      );
    }

    return (
      <div className="flex items-start space-x-2">
        {message.role === "assistant" ? (
          <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
        ) : (
          <UserCircleIcon className="w-5 h-5 text-white mt-1 flex-shrink-0" />
        )}
        <div
          className={`flex-1 prose prose-sm max-w-none ${
            message.role === "user" ? "prose-invert" : ""
          }`}
        >
          {message.role === "assistant" ? (
            <ReactMarkdown>{formatContent(message.content)}</ReactMarkdown>
          ) : (
            <p className="text-white">{message.content}</p>
          )}
        </div>
      </div>
    );
  };

  const toggleCache = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !cacheEnabled }),
      });
      if (response.ok) {
        setCacheEnabled(!cacheEnabled);
      }
    } catch (error) {
      console.error("Failed to toggle cache:", error);
    }
  };

  const clearCache = async () => {
    try {
      await fetch("http://localhost:3001/api/cache/clear", { method: "POST" });
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  };

  return (
    <div className="min-h-screen px-4">


      <div className="max-w-7xl mx-auto flex gap-8">
        <div className="hidden lg:block">
          <ExampleQuestions
            onQuestionClick={handleQuestionClick}
            selectedQuestion={selectedQuestion}
            isLoading={isLoading}
          />
        </div>
        <div className="flex-1 flex flex-col h-[85vh] bg-gradient-to-br from-white to-slate-50/90 rounded-xl shadow-2xl overflow-hidden border border-slate-200/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full"
          >
            {/* Controls bar */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700">
              {/* Top controls with glass effect */}
              <div className="p-4 backdrop-blur-sm bg-white/5 flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <motion.button
                    onClick={clearChat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm text-slate-300 hover:text-red-400 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Clear Chat
                  </motion.button>

                  <label className="flex items-center space-x-2 text-sm text-slate-300">
                    <span>Cache Responses</span>
                    <input
                      type="checkbox"
                      checked={cacheEnabled}
                      onChange={toggleCache}
                      className="form-checkbox h-4 w-4 text-blue-500 rounded border-slate-600 bg-slate-700 focus:ring-blue-500/50 focus:ring-offset-slate-800"
                    />
                  </label>

                  <motion.button
                    onClick={clearCache}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm text-slate-300 hover:text-blue-400 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-all duration-200"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Clear Cache
                  </motion.button>
                </div>

                <label className="flex items-center space-x-2 text-sm text-slate-300">
                  <span>Auto-scroll</span>
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-500 rounded border-slate-600 bg-slate-700 focus:ring-blue-500/50 focus:ring-offset-slate-800"
                  />
                </label>
              </div>

              {/* Input form with glass effect */}
              <motion.form
                onSubmit={handleSubmit}
                className="p-4 backdrop-blur-sm bg-white/5 border-t border-slate-700/50"
              >
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 p-3 bg-slate-800/50 text-slate-200 placeholder-slate-400 border border-slate-600 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                      transition-all duration-200"
                  />
                  {isLoading ? (
                    <motion.button
                      type="button"
                      onClick={cancelRequest}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium
                        hover:from-red-600 hover:to-red-700
                        transition-all duration-200
                        inline-flex items-center space-x-2
                        shadow-lg shadow-red-500/25"
                    >
                      <StopIcon className="w-5 h-5" />
                      <span>Cancel</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium
                        hover:from-blue-600 hover:to-blue-700
                        transition-all duration-200
                        disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed
                        inline-flex items-center space-x-2
                        shadow-lg shadow-blue-500/25"
                    >
                      <span>Send</span>
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              </motion.form>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white/30 backdrop-blur-sm scrollbar-slim">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                        message.role === "user"
                          ? "message-bubble message-bubble-user text-white rounded-tr-none"
                          : message.content.startsWith("Error:")
                          ? "bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tl-none"
                          : "message-bubble message-bubble-assistant bg-white/80 backdrop-blur-sm rounded-tl-none border border-slate-200/50"
                      }`}
                    >
                      <MessageContent message={message} />
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-4"
                >
                  <div className="bg-secondary p-4 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex items-center space-x-2">
                      <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-600">
                        {getThinkingMessage()}
                      </span>
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            delay: 0.2,
                          }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            delay: 0.4,
                          }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
