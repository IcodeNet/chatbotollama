# Flagstone AI Chat Assistant

An enterprise-grade AI chat assistant powered by Ollama and ChromaDB for context-aware responses about Flagstone's services.

## Features

- Real-time AI chat interface with streaming responses
- Context-aware responses using RAG (Retrieval Augmented Generation)
- Response caching system with toggle and clear options
- FAQ quick access panel
- Auto-scroll functionality
- Request cancellation support
- Enterprise-grade UI with modern design

## Technical Stack

- Frontend: React + Vite
- UI: TailwindCSS + Framer Motion
- Backend: Express.js
- Vector Database: ChromaDB
- LLM: Ollama

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start ChromaDB:
```bash
pip install chromadb
python -m chromadb.app --host 0.0.0.0 --port 8000
```

3. Start the development server:
```bash
npm run dev:all
```

## Architecture

### Frontend Components
- `ChatBot`: Main chat interface with message handling and UI controls
- `ExampleQuestions`: FAQ panel with pre-defined questions
- Message bubbles with Markdown support
- Loading states and animations

### Backend Services
- Express server handling chat requests
- ChromaDB integration for document retrieval
- Ollama integration for AI responses
- Caching system for repeated queries

## API Endpoints

- `POST /api/chat`: Send chat messages
- `POST /api/cache`: Toggle response caching
- `POST /api/cache/clear`: Clear cached responses
- `POST /api/docs`: Update documentation in vector store

## Environment Setup

Required services:
1. Ollama running locally
2. ChromaDB server
3. Node.js backend
4. React frontend

## Development

Run all services:
```bash
npm run dev:all
```

This starts:
- Frontend on port 5173
- Backend on port 3001
- ChromaDB on port 8000

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Ollama](https://ollama.ai/) installed locally
- [Git](https://git-scm.com/)
- [ChromaDB](https://www.trychroma.com/) (for RAG implementation)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd flagstone-chatbot
```

2. Create context directory and add documentation:
```bash
# Create the context directory
mkdir -p context

# Create the initial documentation file
touch context/flagstone.md

# Add your documentation content to context/flagstone.md
# You can either manually copy the content or use the /api/docs endpoint later
```

4. Start ChromaDB:
```powershell
# Install required packages
pip install chromadb uvicorn
pip install sentence-transformers
pip install chromadb-default-embed

# Start ChromaDB server with uvicorn
uvicorn chromadb.app:app --host 0.0.0.0 --port 8000 --log-level debug
```

Note: If you get embedding errors:
```powershell
# Make sure you have all required dependencies
pip install --upgrade pip
pip install chromadb[all]
pip install sentence-transformers
pip install chromadb-default-embed

# If you still see errors, try:
pip install torch torchvision torchaudio
```

Troubleshooting:
1. If port 8000 is in use:
```powershell
netstat -ano | findstr :8000
# If port is in use, try a different port:
uvicorn chromadb.app:app --host 0.0.0.0 --port 8001 --log-level debug
```

2. If you see no server output:
```powershell
$env:PYTHONUNBUFFERED="1"
uvicorn chromadb.app:app --host 0.0.0.0 --port 8000 --log-level debug --reload
```

5. Create the Flagstone Assistant model:
```bash
# First, make sure Ollama is running
ollama serve

# Create the model using our Modelfile
npm run update-model

# Verify the model was created
ollama list
```

6. Start the application:
```bash
# Start the server (make sure ChromaDB is running first!)
npm run server

# In a new terminal, start the client
npm run client

# Or run both together
npm run dev:all
```

## RAG System

The chatbot uses Retrieval-Augmented Generation (RAG) to provide more accurate and context-aware responses.

## Performance Optimization

The system is optimized for fast response times through several mechanisms:

### Model Configuration
```dockerfile
# Modelfile optimizations
PARAMETER temperature 0.0
PARAMETER top_k 1
PARAMETER top_p 0.001
PARAMETER num_ctx 2048
PARAMETER num_thread 4
PARAMETER repeat_penalty 1.5
```

### RAG Optimizations
- Limited context retrieval (2 most relevant chunks)
- Optimized vector search parameters
- Concise prompt structure
- Multi-threading enabled

### Server Configuration
```javascript
// Optimized options for Ollama requests
options: {
  temperature: 0.0,
  top_p: 0.001,
  top_k: 1,
  repeat_penalty: 1.5,
  cache: true,
  cache_size: 2048,
  num_ctx: 2048,
  num_thread: 4,
}
```

### Response Caching
- Built-in response caching through Ollama
- Toggle caching via UI
- Clear cache functionality
- Cache size management

### Performance Monitoring
The system includes comprehensive performance monitoring across all components:

#### Server-Side Timing
```javascript
// Example server logs with timing information
[INFO] Starting request processing...
[INFO] Vector search completed in 127ms
[INFO] Context retrieval: 2 chunks in 89ms
[INFO] LLM generation started at 216ms
[INFO] Response received in 1842ms
[INFO] Total request time: 2058ms
```

#### Monitored Components
1. Vector Search Performance
   - Document chunk retrieval time
   - Number of chunks retrieved
   - Search quality metrics

2. LLM Response Generation
   - Model loading time
   - Token generation speed
   - Total generation time

3. End-to-End Request Timing
   - API request latency
   - Processing overhead
   - Total response time

#### Performance Metrics
```javascript
// Example metrics from a typical request
{
  vectorSearch: {
    duration: "127ms",
    chunksRetrieved: 2,
    searchQuality: 0.89
  },
  llmGeneration: {
    modelLoadTime: "45ms",
    tokenGeneration: "1797ms",
    tokensGenerated: 256
  },
  totalRequest: {
    apiLatency: "89ms",
    processing: "172ms",
    total: "2058ms"
  }
}
```

#### Monitoring Tools
- Console logging with timing information
- Performance tracking in browser DevTools
- Server-side metrics collection

#### Optimization Targets
- Vector search: < 150ms
- Context retrieval: < 100ms
- LLM generation: < 2000ms
- Total request: < 2500ms

#### Performance Analysis
Monitor these metrics to identify:
- Bottlenecks in the pipeline
- Areas for optimization
- Resource usage patterns
- Cache effectiveness

### System Requirements for Optimal Performance
- 16GB RAM recommended
- Multi-core CPU (4+ cores)
- SSD storage
- GPU acceleration (optional)

### How it Works

1. Document Processing:
   - Documentation is stored in `context/flagstone.md`
   - Documents are automatically chunked into smaller pieces
   - Chunks are stored in ChromaDB vector store

2. Query Processing:
   - User questions are used to retrieve relevant document chunks
   - Retrieved context is provided to the LLM
   - LLM generates responses based on the specific context

### Managing Documentation

Add or update documentation using the API:
```bash
curl -X POST http://localhost:3001/api/docs \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "new-doc.md",
    "content": "# New Documentation\n\nThis is new content..."
  }'
```

Or manually:
1. Add markdown files to the `context` directory
2. Restart the server to reindex the documentation

## Model Management

### Model Configuration

The model uses:
- Base: Mistral (good balance of performance and accuracy)
- RAG system for real-time context from documentation
- Optimized parameters for chat interactions

## Project Structure

```
flagstone-chatbot/
├── Modelfile              # Ollama model definition
├── server.js             # Express server for chat API
├── test.py              # ChromaDB test script
├── src/
│   ├── components/       # React components
│   │   ├── ChatBot.jsx  # Main chat interface
│   │   └── ExampleQuestions.jsx  # FAQ panel
│   ├── App.jsx          # Root component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles and themes
├── context/             # Documentation for RAG system
│   └── flagstone.md     # Flagstone documentation
├── package.json         # Project dependencies
├── tailwind.config.js   # Tailwind CSS configuration
└── .gitignore          # Git ignore rules
```

## Environment Variables

Create a `.env` file if needed:
```env
PORT=3001              # Server port
OLLAMA_HOST=localhost  # Ollama host
OLLAMA_PORT=11434     # Ollama port
```

## Contributing

1. Update documentation sources in create-model.ps1
2. Test changes locally
3. Rebuild the model
4. Verify responses

## Troubleshooting

Common issues:

1. Model not found:
```bash
# Check if model exists
ollama list

# Rebuild if needed
ollama create flagstone-assistant -f Modelfile
```

2. Server connection issues:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve
```

3. Model responses not updated:
```bash
# Force rebuild the model
ollama create flagstone-assistant -f Modelfile
```

## System Requirements

1. **Hardware Requirements**:
   - 8GB RAM minimum (16GB recommended)
   - 4 CPU cores minimum
   - 20GB free disk space
   - CPU with virtualization support enabled in BIOS

2. **Software Requirements**:
   - Windows 10/11
   - WSL2 enabled
   - Virtualization enabled in BIOS
   - Docker Desktop with WSL2 backend

## Docker Desktop Setup

1. **Enable WSL2**:
   ```powershell
   # Install WSL2
   wsl --install

   # Enable virtualization features
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

   # Restart your computer
   ```

2. **Install Docker Desktop**:
   - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
   - During installation:
     - Select "Use WSL2 instead of Hyper-V"
     - Enable "Install required Windows components for WSL2"

3. **Configure Docker Desktop**:
   - Open Docker Desktop
   - Go to Settings > General
   - Ensure "Use WSL2 based engine" is checked
   - Go to Settings > Resources > WSL Integration
   - Enable integration with your WSL distro

## Quick Start

1. **Install Ollama**
   - Download and install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
   - Enable WSL2 integration in Docker Desktop settings
   - Download and install Ollama from [ollama.ai/download](https://ollama.ai/download)

3. **Clone and Setup**
   ```powershell
   # Clone the repository
   git clone <repository-url>
   cd ChatBotOllama

   # Install dependencies
   npm install
   ```

4. **Create the AI Model**
   ```powershell
   # Verify Ollama is running
   ollama list

   # Create the Flagstone assistant model
   ollama create flagstone-assistant -f Modelfile

   # Test the model
   ollama run flagstone-assistant "What services does Flagstone offer?"
   ```

5. **Start the Application**
   ```powershell
   # Terminal 1: Start the backend server
   npm run server

   # Terminal 2: Start the frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:3001](http://localhost:3001)

## Troubleshooting

### Common Issues

1. **Ollama Not Responding**
   ```powershell
   # Check if Ollama is running
   ollama list

   # If not responding, restart Docker Desktop
   # Then try creating the model again
   ollama create flagstone-assistant -f Modelfile
   ```

2. **Port Conflicts**
   - Ensure ports 3000 and 3001 are available
   - Check if other services are using these ports
   - Modify port numbers in vite.config.js and server.js if needed

3. **Model Creation Errors**
   ```powershell
   # Remove existing model if there are issues
   ollama rm flagstone-assistant

   # Recreate the model
   ollama create flagstone-assistant -f Modelfile
   ```

### Verification Steps

1. **Check Docker**
   - Open Docker Desktop
   - Verify WSL2 integration is enabled
   - Check Docker is running

2. **Verify Ollama**
   ```powershell
   # Should show available models
   ollama list

   # Test direct model response
   ollama run flagstone-assistant "Hello, what services does Flagstone offer?"
   ```

3. **Test Backend**
   ```powershell
   # Start server and check for any errors
   npm run server

   # In a new terminal, test the API endpoint
   curl -X POST http://localhost:3001/api/chat `
     -H "Content-Type: application/json" `
     -d "{\"message\":\"Hello, what services does Flagstone offer?\"}"
   ```

4. **Test Frontend**
   ```powershell
   # Start development server
   npm run dev

   # Check browser console for any errors
   # Verify network requests in browser DevTools
   ```

5. **Debug Logs**
   - Check server console for:
     ```
     Received message: [Your message]
     Ollama chunk: [Response chunks]
     Final response: [Complete response]
     Sending response: [Cleaned response]
     ```
   - Check browser console for:
     ```
     Sending message: [Your message]
     Received response data: {response: "..."}
     ```

6. **Common Issues**
   - If server shows response but client doesn't:
     - Check browser network tab
     - Verify response format
     - Check for CORS errors
   - If Ollama responds but server doesn't:
     - Check server logs
     - Verify process.spawn execution
     - Check error handling

## Project Structure

```
ChatBotOllama/
├── src/
│   ├── components/
│   │   └── ChatBot.jsx    # Main chat component
│   ├── App.jsx            # Root component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── server.js             # Backend server
├── Modelfile             # Ollama model definition
├── index.html            # HTML entry point
├── vite.config.js        # Vite configuration
├── postcss.config.cjs    # PostCSS configuration
├── tailwind.config.cjs   # Tailwind configuration
└── package.json          # Project dependencies
```

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run dev:all` - Start both frontend and backend

## Development Notes

- Frontend runs on port 3000
- Backend runs on port 3001
- Ollama API runs on port 11434
- Uses Tailwind CSS for styling
- Framer Motion for animations
- Vite for development server

## Support

If you encounter any issues:
1. Check the troubleshooting section
2. Verify all prerequisites are installed
3. Ensure Docker Desktop is running
4. Check console logs for errors

## Overview

This chatbot is specifically designed to help users understand:
- Flagstone's cash deposit platform features
- Account types and requirements
- FSCS protection details
- Security measures
- Savings strategies
- Account opening process

## Common Commands

```powershell
# List available models
ollama list

# Test the model
ollama run flagstone-assistant "What are Flagstone's main features?"

# Remove and recreate model (if needed)
ollama rm flagstone-assistant
ollama create flagstone-assistant -f Modelfile
```

## Development

The application runs on:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Ollama API: http://localhost:11434

## Project Structure

```
ChatBotOllama/
├── src/
│   ├── components/
│   │   ├── ChatBot.jsx
│   │   └── ChatBot.css
│   ├── App.jsx
│   └── index.js
├── server.js
├── Modelfile
└── package.json
```

## Features

### Chat Interface
- Real-time responses
- Loading states
- Error handling
- Responsive design
- Markdown support for formatted responses

### AI Capabilities
- Comprehensive knowledge of Flagstone's platform
- Understanding of:
  - Account types and features
  - FSCS protection details
  - Security measures
  - Account requirements
  - Savings strategies
  - Platform benefits

## Configuration

### Server Configuration
- The server runs on port 3001 by default
- CORS is enabled for local development
- Error handling for AI model responses

### Model Configuration
The AI model is configured with:
- Temperature: 0.7 (balanced creativity and accuracy)
- Top-k: 50
- Top-p: 0.95
- Custom response templates
- Specific domain knowledge about Flagstone

## Customization

### Styling
- Modify `src/components/ChatBot.css` to change the appearance
- The chat interface uses CSS classes for easy styling:
  - `.chatbot-container`: Main container
  - `.chat-messages`: Messages container
  - `.message.user`: User message styling
  - `.message.assistant`: AI response styling

### AI Model
- The model is defined in `Modelfile`
- Includes comprehensive Flagstone-specific information
- Can be updated with new content as needed

## Windows-Specific Notes

### File Paths
- Use Windows-style paths in PowerShell (`\` instead of `/`)
- Use forward slashes (`/`) in code and configuration files
- Be mindful of line endings (CRLF vs LF)

### Port Access
- Check Windows Defender Firewall settings
- Ensure ports 3000 (React) and 3001 (Server) are accessible
- Verify Ollama port 11434 is not blocked

### Performance
- Ensure adequate system resources for WSL2
- Configure Docker Desktop resource limits appropriately
- Close unnecessary applications when running the model

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- Built with [Ollama](https://ollama.ai/)
- Based on [Mistral AI](https://mistral.ai/) model
- Content from [Flagstone](https://www.flagstoneim.com/)
- Designed and Architected by Byron Thanopoulos (TOGAF Architect)

## Ollama Commands and Expected Outputs

### 1. Check Available Models
```powershell
ollama list
```
Expected output:
```
NAME                 ID          SIZE   MODIFIED
flagstone-assistant  mistral     4.1GB  2024-03-10 14:30:20
mistral             mistral     4.1GB  2024-03-10 14:25:15
```

### 2. Create Model
```powershell
ollama create flagstone-assistant -f Modelfile
```
Expected output:
```
Downloading mistral model...
Downloaded mistral model
Creating flagstone-assistant from Modelfile... done
Model 'flagstone-assistant' created successfully
```

### 3. Test Model
```powershell
ollama run flagstone-assistant "What services does Flagstone offer?"
```
Expected output:
```
Flagstone offers a leading cash deposit platform with the following key services:

1. Access to 60+ banking partners through a single application
2. Account management for instant access, notice, and fixed-term accounts
3. FSCS protection up to £85,000 per bank (£170,000 for joint accounts)
4. Holding account functionality through HSBC
5. Portfolio management and optimization tools
```

### 4. Remove Model
```powershell
ollama rm flagstone-assistant
```
Expected output:
```
Removed model 'flagstone-assistant'
```

### 5. Check Ollama Version
```powershell
ollama --version
```
Expected output:
```
ollama version 0.1.27
```

### Common Error Messages and Solutions

1. **Docker Not Running**
```
Error: Cannot connect to the Docker daemon... Is the docker daemon running?
```
Solution: Start Docker Desktop and wait for it to fully initialize

2. **Port Already in Use**
```
Error: listen tcp 127.0.0.1:11434: bind: Only one usage of each socket address
```
Solution: Ollama is already running. Continue with your commands.

3. **Model Not Found**
```
Error: model 'flagstone-assistant' not found
```
Solution: Create the model using the Modelfile first

4. **Invalid Modelfile**
```
Error: command must be one of "from", "license", "template", "system"...
```

## Troubleshooting RAG

1. ChromaDB Connection Issues:
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Verify Docker container
docker ps | grep chroma
```

2. Document Processing Issues:
```bash
# Check context directory
ls -l context/

# Verify file permissions
chmod 644 context/*.md
```

3. Vector Store Issues:
```bash
# Remove existing collection
curl -X DELETE http://localhost:8000/api/v1/collections/flagstone_docs

# Restart server to recreate collection
npm run server
```

## System Initialization (Windows 11)

After initial setup, follow this startup sequence:

1. Restart your machine to ensure clean state

2. After restart, start services in this order:
```powershell
# 1. Start Docker Desktop
# Wait for Docker Desktop to fully initialize (green icon in system tray)

# 2. Start ChromaDB container
docker start chroma
# Or if first time:
docker run -d --name chroma -p 8000:8000 chromadb/chroma

# 3. Start Ollama
ollama serve

# 4. Verify services are running
docker ps  # Should show chroma container
curl http://localhost:8000/api/v1/heartbeat  # Should return OK
curl http://localhost:11434/api/tags  # Should show Ollama models

# 5. Start the application
npm run server  # In one terminal
npm run client  # In another terminal
```

Common Startup Issues:
1. If Docker container won't start:
```powershell
# Remove existing container and recreate
docker rm chroma
docker run -d --name chroma -p 8000:8000 chromadb/chroma
```

2. If services won't connect after sleep/hibernate:
```powershell
# Restart Docker Desktop
# Then restart ChromaDB container
docker restart chroma
```

3. If WSL issues occur:
```powershell
# Open PowerShell as Administrator
wsl --shutdown
wsl --update
# Restart Docker Desktop
```