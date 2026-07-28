#!/usr/bin/env bash
# =============================================================================
# Invoice AI — Full Stack Installer
# Sets up DeepSeek (via Ollama), ChromaDB, Python RAG service, and
# wires everything into your existing Next.js procurement system.
#
# Usage:  chmod +x scripts/install.sh && ./scripts/install.sh
# =============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[invoice-ai]${NC} $1"; }
ok()   { echo -e "${GREEN}[ok]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
fail() { echo -e "${RED}[error]${NC} $1"; exit 1; }

echo -e "\n${BOLD}Invoice AI — Installation${NC}"
echo "════════════════════════════════════════════"
echo "  DeepSeek-R1 (via Ollama) + ChromaDB RAG"
echo "  Safe add-on for your procurement system"
echo "════════════════════════════════════════════\n"

# ── 1. Check prerequisites ────────────────────────────────────────────────────
log "Checking prerequisites..."

command -v node >/dev/null 2>&1  || fail "Node.js not found. Install from https://nodejs.org"
command -v python3 >/dev/null 2>&1 || fail "Python 3.9+ not found."
command -v pip3 >/dev/null 2>&1  || fail "pip3 not found."

NODE_VER=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "fail")
[[ "$NODE_VER" == "fail" ]] && fail "Node.js 18+ required. Current: $(node --version)"

PYTHON_VER=$(python3 -c "import sys; exit(0 if sys.version_info >= (3,9) else 1)" 2>/dev/null && echo "ok" || echo "fail")
[[ "$PYTHON_VER" == "fail" ]] && fail "Python 3.9+ required. Current: $(python3 --version)"

ok "Prerequisites satisfied"

# ── 2. Install Ollama + DeepSeek ─────────────────────────────────────────────
log "Checking Ollama..."

if ! command -v ollama >/dev/null 2>&1; then
  log "Installing Ollama..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew >/dev/null 2>&1; then
      brew install ollama
    else
      curl -fsSL https://ollama.com/install.sh | sh
    fi
  else
    curl -fsSL https://ollama.com/install.sh | sh
  fi
  ok "Ollama installed"
else
  ok "Ollama already installed ($(ollama --version 2>/dev/null || echo 'version unknown'))"
fi

# Start Ollama in background if not running
if ! curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
  log "Starting Ollama server..."
  ollama serve &>/tmp/ollama.log &
  OLLAMA_PID=$!
  sleep 3
  curl -sf http://localhost:11434/api/tags >/dev/null 2>&1 || fail "Ollama failed to start. Check /tmp/ollama.log"
  ok "Ollama server started (pid $OLLAMA_PID)"
else
  ok "Ollama server already running"
fi

# Pull DeepSeek-R1
DEEPSEEK_MODEL="${DEEPSEEK_MODEL:-deepseek-r1:8b}"
log "Checking for model: $DEEPSEEK_MODEL"

if ! ollama list 2>/dev/null | grep -q "${DEEPSEEK_MODEL%%:*}"; then
  log "Pulling $DEEPSEEK_MODEL (this may take several minutes on first run)..."
  echo -e "${YELLOW}  Model sizes: 8b ≈ 5GB RAM | 14b ≈ 9GB RAM | 1.5b ≈ 1GB RAM${NC}"
  ollama pull "$DEEPSEEK_MODEL" || fail "Failed to pull $DEEPSEEK_MODEL"
  ok "Model ready: $DEEPSEEK_MODEL"
else
  ok "Model already available: $DEEPSEEK_MODEL"
fi

# Pull embedding model for RAG
EMBED_MODEL="nomic-embed-text"
if ! ollama list 2>/dev/null | grep -q "$EMBED_MODEL"; then
  log "Pulling embedding model ($EMBED_MODEL)..."
  ollama pull "$EMBED_MODEL" || warn "Could not pull $EMBED_MODEL — RAG will use keyword fallback"
else
  ok "Embedding model ready: $EMBED_MODEL"
fi

# ── 3. Python RAG environment ─────────────────────────────────────────────────
log "Setting up Python RAG environment..."

VENV_DIR=".venv-invoice-ai"

if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
  ok "Virtual environment created: $VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
pip install --quiet --upgrade pip

log "Installing Python dependencies (chromadb, fastapi, uvicorn)..."
pip install --quiet \
  chromadb==0.5.23 \
  fastapi==0.115.5 \
  uvicorn==0.32.1 \
  httpx==0.28.0 \
  pydantic==2.10.3 \
  python-dotenv==1.0.1 \
  pymupdf==1.24.14 \
  pytesseract==0.3.13

ok "Python dependencies installed"

# ── 4. Seed ChromaDB with policies ───────────────────────────────────────────
log "Seeding ChromaDB with AP policy documents..."
python3 scripts/seed_chroma.py && ok "ChromaDB seeded with policies" || warn "ChromaDB seed failed — will retry on first request"

# ── 5. Environment file ───────────────────────────────────────────────────────
if [[ ! -f ".env.local" ]]; then
  cp .env.local.example .env.local
  ok "Created .env.local from template"
else
  warn ".env.local already exists — skipping (check .env.local.example for new keys)"
fi

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Installation complete${NC}"
echo "════════════════════════════════════════════"
echo -e "  ${GREEN}✓${NC} DeepSeek model: $DEEPSEEK_MODEL"
echo -e "  ${GREEN}✓${NC} Embedding model: $EMBED_MODEL"
echo -e "  ${GREEN}✓${NC} ChromaDB: local persistent store"
echo -e "  ${GREEN}✓${NC} Python RAG service: ready"
echo ""
echo "Next steps:"
echo "  1. Start the RAG service:  npm run rag:start"
echo "  2. Start your app:         npm run dev"
echo "  3. Health check:           curl http://localhost:3000/api/invoice/health"
echo "════════════════════════════════════════════"
