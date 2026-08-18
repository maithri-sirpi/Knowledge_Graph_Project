import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from app.schemas import StoryPayload, Entity, Relationship, ExtractionResponse, GraphStatistics
from app.nlp import process_story
from app.neo4j_client import neo4j_client
from app.utils import generate_csv, generate_cypher_script, generate_graphml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title="Kannada Story Knowledge Graph Generator API",
    description="Backend service to extract entities and relations from Kannada stories and sync with Neo4j.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory cache to store the last extraction result for easy access
last_extraction = {
    "sentences": [],
    "entities": [],
    "relationships": []
}

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up FastAPI application...")
    neo4j_client.connect()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down FastAPI application...")
    neo4j_client.close()

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Kannada Story Knowledge Graph Generator API",
        "neo4j_connected": neo4j_client.is_connected()
    }

@app.post("/extract", response_model=ExtractionResponse)
def extract_story_elements(payload: StoryPayload):
    """
    Sentence segments, tokenizes, and extracts Entities and Relationships 
    from the provided Kannada story.
    """
    try:
        response = process_story(payload)
        
        # Save to cache
        last_extraction["sentences"] = response.sentences
        last_extraction["entities"] = response.entities
        last_extraction["relationships"] = response.relationships
        
        return response
    except Exception as e:
        logger.error(f"Error extracting story: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# We will define a payload for /graph
from pydantic import BaseModel
class GraphSyncRequest(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]

@app.post("/graph")
def sync_graph_with_neo4j(payload: GraphSyncRequest):
    """
    Clears the existing graph and inserts the provided entities and relationships 
    into the Neo4j database, generating Cypher queries.
    """
    if not neo4j_client.is_connected():
        # Try reconnecting
        neo4j_client.connect()
        if not neo4j_client.is_connected():
            raise HTTPException(
                status_code=503, 
                detail="Neo4j connection is unavailable. Verify that your Docker container is running."
            )
            
    try:
        # Clear existing database nodes
        neo4j_client.clear_graph()
        
        # Create new nodes and relationships
        queries = neo4j_client.create_graph(payload.entities, payload.relationships)
        
        return {
            "status": "success",
            "message": f"Successfully created {len(payload.entities)} nodes and {len(payload.relationships)} relationships.",
            "queries": queries
        }
    except Exception as e:
        logger.error(f"Error syncing with Neo4j: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/json")
def get_graph_json():
    """
    Returns the graph nodes and links currently stored in Neo4j.
    """
    try:
        data = neo4j_client.get_graph_data()
        
        # Fallback: if database is empty or not connected, return the last extracted cached data
        if not data["nodes"] and last_extraction["entities"]:
            logger.info("Neo4j database is empty or offline. Returning cached last extraction as fallback.")
            nodes = []
            for e in last_extraction["entities"]:
                nodes.append({"id": e.name, "label": e.name, "type": e.type})
            links = []
            for r in last_extraction["relationships"]:
                links.append({
                    "source": r.subject, 
                    "target": r.object, 
                    "type": r.predicate,
                    "confidence": getattr(r, "confidence", 1.0),
                    "uncertain": getattr(r, "uncertain", False)
                })
            data = {"nodes": nodes, "links": links}
            
        return data
    except Exception as e:
        logger.error(f"Error reading graph data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/statistics", response_model=GraphStatistics)
def get_statistics():
    """
    Returns graph statistics such as node counts and edge counts.
    """
    try:
        # Fetch Neo4j stats, passing the last sentence count for context
        stats = neo4j_client.get_statistics(len(last_extraction["sentences"]))
        
        # Fallback if DB not connected/empty, calculate stats using the cache
        if stats.unique_nodes == 0 and last_extraction["entities"]:
            logger.info("Using cached statistics fallback.")
            unique_nodes_count = len({e.name for e in last_extraction["entities"]})
            unique_edges_count = len(last_extraction["relationships"])
            
            return GraphStatistics(
                total_sentences=len(last_extraction["sentences"]),
                total_entities=len(last_extraction["entities"]),
                total_relationships=len(last_extraction["relationships"]),
                unique_nodes=unique_nodes_count,
                unique_edges=unique_edges_count
            )
            
        return stats
    except Exception as e:
        logger.error(f"Error fetching statistics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export/csv")
def export_csv():
    """
    Export current graph relations as CSV file.
    """
    try:
        rels = last_extraction["relationships"]
        # If empty, try reading from Neo4j client
        if not rels:
            data = neo4j_client.get_graph_data()
            rels = [
                Relationship(subject=l["source"], predicate=l["type"], object=l["target"])
                for l in data["links"]
            ]
            
        csv_data = generate_csv(rels)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=knowledge_graph.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export/cypher")
def export_cypher():
    """
    Export cypher creation queries as a text script.
    """
    try:
        ents = last_extraction["entities"]
        rels = last_extraction["relationships"]
        
        # Fallback if empty cache, fetch from db
        if not ents:
            data = neo4j_client.get_graph_data()
            # Try to reconstruct Entities from node type labels
            ents = [
                Entity(name=n["id"], type=n["type"])
                for n in data["nodes"]
            ]
            rels = [
                Relationship(subject=l["source"], predicate=l["type"], object=l["target"])
                for l in data["links"]
            ]
            
        cypher_script = generate_cypher_script(ents, rels)
        return Response(
            content=cypher_script,
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=knowledge_graph.cypher"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export/graphml")
def export_graphml():
    """
    Export graph in GraphML XML standard format.
    """
    try:
        data = neo4j_client.get_graph_data()
        if not data["nodes"] and last_extraction["entities"]:
            # Reconstruct from cache
            nodes = [{"id": e.name, "type": e.type} for e in last_extraction["entities"]]
            links = [{"source": r.subject, "target": r.object, "type": r.predicate} for r in last_extraction["relationships"]]
            data = {"nodes": nodes, "links": links}
            
        graphml_data = generate_graphml(data["nodes"], data["links"])
        return Response(
            content=graphml_data,
            media_type="application/xml",
            headers={"Content-Disposition": "attachment; filename=knowledge_graph.graphml"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
