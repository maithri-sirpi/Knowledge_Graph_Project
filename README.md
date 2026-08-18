# Kannada Story Knowledge Graph Generator

An interactive, full-stack AI application that processes Kannada stories to segment sentences, extract entities (such as Person, Animal, Place, Object, and Event), map semantic relationships, and automatically load them into a Neo4j Graph Database. The application features a premium dark-themed React visualization interface powered by React Flow.

---

## Technical Stack

- **Backend**: Python 3.10, FastAPI, Uvicorn, Pydantic v2
- **Frontend**: React.js, Vite, React Flow, Lucide Icons
- **Orchestration**: Docker, Docker Compose
- **NLP / extraction**:
  - **Local Heuristics**: Custom rule-based tokenizer and parser for rapid test story verification.
  - **Generative LLM Engine**: Integrates Google Gemini API (`google-generativeai`) and OpenAI GPT API (`openai`) for dynamic entity classification and context-aware relation extraction.
- **Graph Database**: Neo4j Community Edition

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── config.py          # Settings and environment variables
│   │   ├── main.py            # FastAPI app route definitions
│   │   ├── neo4j_client.py    # Database connection manager
│   │   ├── nlp.py             # Heuristics & LLM processing engine
│   │   ├── schemas.py         # Pydantic data schemas
│   │   └── utils.py           # Exporters (CSV, Cypher, GraphML)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EntityViewer.jsx
│   │   │   ├── GraphViewer.jsx
│   │   │   ├── RelationshipViewer.jsx
│   │   │   ├── StatsDashboard.jsx
│   │   │   ├── StoryUpload.jsx
│   │   │   └── TripleViewer.jsx
│   │   ├── App.jsx
│   │   ├── index.css          # Dark Mode styling design system
│   │   └── main.jsx
│   ├── package.json
│   ├── index.html
│   └── Dockerfile
├── docker-compose.yml
├── sample_output.json         # Reference JSON output
└── README.md
```

---

## Setup & Running Instructions

### Method 1: Docker Compose (Recommended)

To run the entire stack (Neo4j, FastAPI Backend, and React Frontend) with a single command, ensure you have **Docker** and **Docker Compose** installed:

1. **(Optional) Configure API Keys**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Boot the Containers**:
   ```bash
   docker-compose up --build
   ```

3. **Access Services**:
   - **Frontend App**: [http://localhost:5173](http://localhost:5173)
   - **FastAPI Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Neo4j Browser Console**: [http://localhost:7474](http://localhost:7474) (Credentials: `neo4j` / `password`)

---

### Method 2: Local Development

To run the services individually on your local host:

#### 1. Setup Neo4j Database
Run a local Neo4j container via docker:
```bash
docker run \
    --name neo4j_local \
    -p 7474:7474 -p 7687:7687 \
    -d \
    -e NEO4J_AUTH=neo4j/password \
    neo4j:5.12-community
```

#### 2. Run Backend (FastAPI)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside `backend/`:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=password
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```
5. Start the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

#### 3. Run Frontend (React)
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Boot the development dev server:
   ```bash
   npm run dev
   ```
4. Open the browser at [http://localhost:5173](http://localhost:5173).

---

## API Documentation

### 1. `POST /extract`
Accepts a Kannada story text body, and performs sentence segmentation and element token extraction.
- **Request Body**:
  ```json
  {
    "text": "ಒಂದಾನೊಂದು ಕಾಲದಲ್ಲಿ ಒಂದು ದಟ್ಟವಾದ ಕಾಡು ಇತ್ತು...",
    "use_llm": true,
    "llm_provider": "gemini"
  }
  ```
- **Returns**:
  ```json
  {
    "sentences": ["sentence 1", "sentence 2"],
    "entities": [{"name": "ಸಿಂಹ", "type": "Animal"}],
    "relationships": [{"subject": "ಸಿಂಹ", "predicate": "lives_in", "object": "ಕಾಡು"}],
    "triples": [{"subject": "ಸಿಂಹ", "predicate": "lives_in", "object": "ಕಾಡು"}]
  }
  ```

### 2. `POST /graph`
Clears existing DB contents and pushes node structures and relationships into Neo4j.
- **Request Body**:
  ```json
  {
    "entities": [{"name": "ಸಿಂಹ", "type": "Animal"}],
    "relationships": [{"subject": "ಸಿಂಹ", "predicate": "lives_in", "object": "ಕಾಡು"}]
  }
  ```

### 3. `GET /graph/json`
Fetches a list of all nodes and relationships stored inside the Neo4j Database.
- **Returns**:
  ```json
  {
    "nodes": [{"id": "ಸಿಂಹ", "label": "ಸಿಂಹ", "type": "Animal"}],
    "links": [{"source": "ಸಿಂಹ", "target": "ಕಾಡು", "type": "lives_in"}]
  }
  ```

### 4. `GET /statistics`
Aggregates and retrieves graph metadata parameters.
- **Returns**:
  ```json
  {
    "total_sentences": 56,
    "total_entities": 5,
    "total_relationships": 7,
    "unique_nodes": 5,
    "unique_edges": 7
  }
  ```

---

## Sample Cypher Queries

When clicking "Neo4j Sync", the backend generates and runs standard Cypher queries to load the graph. Here are the queries for the test Kannada story:

```cypher
// Create Nodes
MERGE (n:Animal {name: "ಸಿಂಹ"});
MERGE (n:Animal {name: "ಇಲಿ"});
MERGE (n:Place {name: "ಕಾಡು"});
MERGE (n:Object {name: "ಬಲೆ"});
MERGE (n:Person {name: "ಬೇಟೆಗಾರ"});

// Create Relationships
MATCH (s:Animal {name: "ಸಿಂಹ"}) MATCH (o:Place {name: "ಕಾಡು"}) MERGE (s)-[:LIVES_IN]->(o);
MATCH (s:Animal {name: "ಸಿಂಹ"}) MATCH (o:Animal {name: "ಇಲಿ"}) MERGE (s)-[:RELEASED]->(o);
MATCH (s:Person {name: "ಬೇಟೆಗಾರ"}) MATCH (o:Object {name: "ಬಲೆ"}) MERGE (s)-[:SET]->(o);
MATCH (s:Object {name: "ಬಲೆ"}) MATCH (o:Animal {name: "ಸಿಂಹ"}) MERGE (s)-[:TRAPPED]->(o);
MATCH (s:Animal {name: "ಇಲಿ"}) MATCH (o:Animal {name: "ಸಿಂಹ"}) MERGE (s)-[:SAVED]->(o);
MATCH (s:Animal {name: "ಸಿಂಹ"}) MATCH (o:Animal {name: "ಇಲಿ"}) MERGE (s)-[:THANKED]->(o);
MATCH (s:Animal {name: "ಸಿಂಹ"}) MATCH (o:Animal {name: "ಇಲಿ"}) MERGE (s)-[:BECAME_FRIEND_OF]->(o);
```

---

## Exporting Formats

Users can export the generated structures via the **Dashboard & Stats** view:
- **JSON**: Visual schema tree showing nodes/links arrays.
- **CSV**: Spreadsheet listing all directed triplets (`Subject, Predicate, Object`).
- **Cypher**: Plaintext file consisting of raw Cypher merge lines.
- **GraphML**: Standard XML layout for desktop graph visualizers.
