import ChatBot from "./components/ChatBot";
import { motion } from "framer-motion";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-bold text-center text-gray-800 mb-8"
        >
          Flagstone AI Chat Assistant{" "}
          <span className="block text-sm font-normal text-gray-600 mt-2">
            Powered by Ollama and ChromaDB
          </span>
        </motion.h1>
        <ChatBot />

      </motion.div>
    </div>
  );
}

export default App;
