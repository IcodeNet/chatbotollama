import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import chalk from "chalk";
import fs from "fs";
import { ChromaClient } from "chromadb";

const app = express();
const port = 3001;

// Increase payload limit for larger responses
app.use(express.json({ limit: "10mb" }));
app.use(cors());

const OLLAMA_PATH = "ollama";
const MODEL_NAME = "flagstone-assistant";
const TIMEOUT_MS = 18000;

// Colorful logging helpers
const log = {
  info: (...args) => console.log(chalk.blue("ℹ"), chalk.cyan(...args)),
  success: (...args) => console.log(chalk.green("✔"), chalk.green(...args)),
  warn: (...args) => console.log(chalk.yellow("⚠"), chalk.yellow(...args)),
  error: (...args) => console.log(chalk.red("✖"), chalk.red(...args)),
  command: (...args) => console.log(chalk.magenta("$"), chalk.magenta(...args)),
  response: (...args) => console.log(chalk.blue("←"), chalk.blue(...args)),
  request: (...args) => console.log(chalk.yellow("→"), chalk.yellow(...args)),
};

// Initialize ChromaDB client with correct configuration
const chroma = new ChromaClient({
  path: "http://localhost:8000",
});

// Create a collection for our documents
const initializeVectorStore = async () => {
  try {
    // Test connection first
    await chroma.heartbeat();
    log.success("ChromaDB connection successful");

    let collection;

    // Try to get existing collection
    try {
      collection = await chroma.getCollection("flagstone_docs");
      log.success("Using existing collection");
      return collection;
    } catch (e) {
      // Collection doesn't exist, create new one
      collection = await chroma.createCollection({
        name: "flagstone_docs",
        metadata: { description: "Flagstone documentation embeddings" },
      });
      log.success("Created new vector store collection");
      return collection;
    }
  } catch (error) {
    log.error("Failed to initialize vector store:", error);
    throw error;
  }
};

// Function to chunk documentation
const chunkDocument = (text, maxChunkSize = 512) => {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += (currentChunk ? " " : "") + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  return chunks;
};

// Function to add documents to vector store
const addDocumentsToVectorStore = async (collection, documents) => {
  try {
    const chunks = documents.flatMap((doc) => chunkDocument(doc));

    // Add chunks to collection with metadata
    await collection.add({
      ids: chunks.map((_, i) => `chunk_${i}`),
      documents: chunks,
      metadatas: chunks.map(() => ({ source: "flagstone_documentation" })),
    });

    log.success(`Added ${chunks.length} chunks to vector store`);
  } catch (error) {
    log.error("Failed to add documents to vector store:", error);
    throw error;
  }
};

// Helper function to list models
const listModels = () => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(OLLAMA_PATH, ["list"]);
    let output = "";
    let error = "";

    childProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    childProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        log.success("Models retrieved successfully");
        resolve(output.trim());
      } else {
        reject(new Error(error || `Failed to list models (code ${code})`));
      }
    });
  });
};

// Helper function to format response as markdown
const formatResponse = (text) => {
  // Split into sections by numbers (1., 2., etc)
  const sections = text.split(/(?=\d+\.)/);

  if (sections.length <= 1) {
    // If no numbered sections, return as is
    return text;
  }

  // Format each section
  return sections
    .map((section) => {
      // Add bold to service names
      section = section.replace(/(Flagstone \w+(?:\s+\w+)*)/g, "**$1**");

      // Add bullet points to features
      section = section.replace(/(?<=\s)-\s/g, "\n* ");

      return section;
    })
    .join("\n\n");
};

// Add at the top with other state
let cacheEnabled = true;

// Add new endpoints for cache control
app.post("/api/cache", (req, res) => {
  const { enabled } = req.body;
  cacheEnabled = enabled;
  log.info(`Cache ${enabled ? "enabled" : "disabled"}`);
  res.json({ success: true });
});

app.post("/api/cache/clear", async (req, res) => {
  try {
    // Clear Ollama's cache
    await fetch("http://localhost:11434/api/show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: MODEL_NAME, command: "cache clear" }),
    });
    log.success("Cache cleared");
    res.json({ success: true });
  } catch (error) {
    log.error("Failed to clear cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

// Update the chat command to use RAG
const runChatCommand = async (message, collection) => {
  log.command(`Processing query with RAG: ${message}`);

  // Query the vector store for relevant chunks
  const results = await collection.query({
    queryTexts: [message],
    nResults: 3,
  });

  const relevantContext = results.documents[0].join("\n\n");

  const structuredPrompt = `
Use the following relevant context to answer the question. Only use information from this context:

${relevantContext}

Question: ${message}

Remember to:
1. Start with "Based on the relevant documentation:"
2. Only use information from the provided context
3. If the context doesn't contain the answer, say so
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt: structuredPrompt,
      options: {
        temperature: 0.0,
        top_p: 0.001,
        top_k: 1,
        repeat_penalty: 1.5,
        cache: cacheEnabled,
        cache_size: 2048,
        stop: ["<|user|>", "ASSISTANT:", "Human:", "I'm afraid", "I'm sorry"],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama API error: ${response.status} ${response.statusText}`
    );
  }

  const reader = response.body.getReader();
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.response) {
          fullResponse += data.response;
          log.response("Chunk:", data.response);
        }
      } catch (e) {
        log.error("Failed to parse chunk:", e);
      }
    }
  }

  // Clean up response without validation
  fullResponse = fullResponse
    .replace(/^(ASSISTANT:|AI:|Human:)/gim, "")
    .replace(/<\|user\|>/g, "")
    .trim();

  // Format and return without validation
  return formatResponse(fullResponse);
};

// Add before the chat endpoint
app.use((req, res, next) => {
  log.info(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
  });
  next();
});

// Initialize vector store and load documents on startup
let vectorCollection;
app.listen(port, async () => {
  log.success(`Server running on port ${port}`);

  try {
    // Initialize vector store
    vectorCollection = await initializeVectorStore();

    // Load and chunk documentation
    const documentation = fs.readFileSync("context/flagstone.md", "utf8");
    await addDocumentsToVectorStore(vectorCollection, [documentation]);

    log.success("RAG system initialized successfully");
  } catch (error) {
    log.error("Failed to initialize RAG system:", error);
  }
});

// Update the chat endpoint to use RAG
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    log.request("Received message:", message);

    if (!message || typeof message !== "string") {
      throw new Error("Invalid message format");
    }

    // Use RAG-enhanced chat command
    const response = await runChatCommand(message, vectorCollection);

    if (!response) {
      throw new Error("Empty response from Ollama");
    }

    log.success("Sending response:", response.slice(0, 100) + "...");
    res.json({ response: response.trim() });
  } catch (error) {
    log.error("Server error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const modelList = await listModels();
    res.json({
      status: "ok",
      models: modelList,
      uptime: process.uptime(),
    });
  } catch (error) {
    log.error("Health check failed:", error);
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// Add this endpoint to manage documents
app.post("/api/docs", async (req, res) => {
  try {
    const { content, filename } = req.body;

    if (!content || !filename) {
      throw new Error("Content and filename are required");
    }

    // Save to file
    const filepath = `context/${filename}`;
    fs.writeFileSync(filepath, content);

    // Clear existing collection
    await vectorCollection.delete();
    vectorCollection = await initializeVectorStore();

    // Read all files from context directory
    const files = fs.readdirSync("context");
    const documents = files
      .filter((file) => file.endsWith(".md"))
      .map((file) => fs.readFileSync(`context/${file}`, "utf8"));

    // Add all documents to vector store
    await addDocumentsToVectorStore(vectorCollection, documents);

    res.json({
      message: "Documentation updated successfully",
      chunks: documents.length,
    });
  } catch (error) {
    log.error("Failed to update documentation:", error);
    res.status(500).json({
      error: "Failed to update documentation",
      details: error.message,
    });
  }
});

// Update the RAG system initialization
const initializeRAGSystem = async () => {
  try {
    vectorCollection = await initializeVectorStore();
    log.success("RAG system initialized");

    // Load initial documents if collection is empty
    const count = await vectorCollection.count();
    if (count === 0) {
      log.info("Collection is empty, loading initial documents...");
      await loadDocumentsIntoVectorStore();
    } else {
      log.info(`Collection contains ${count} documents`);
    }
  } catch (error) {
    log.error("Failed to initialize RAG system:", error);
    throw error;
  }
};
