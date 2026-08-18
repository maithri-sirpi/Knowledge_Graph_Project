import logging
from neo4j import GraphDatabase
from typing import List, Dict, Any
from app.config import settings
from app.schemas import Entity, Relationship, GraphStatistics

logger = logging.getLogger("neo4j")

class Neo4jClient:
    def __init__(self):
        self.uri = settings.NEO4J_URI
        self.user = settings.NEO4J_USER
        self.password = settings.NEO4J_PASSWORD
        self._driver = None

    def connect(self):
        try:
            self._driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            # Test connection
            self._driver.verify_connectivity()
            logger.info("Successfully connected to Neo4j database.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j at {self.uri}: {e}")
            self._driver = None

    def close(self):
        if self._driver:
            self._driver.close()
            logger.info("Neo4j connection closed.")

    def is_connected(self) -> bool:
        if not self._driver:
            return False
        try:
            self._driver.verify_connectivity()
            return True
        except Exception:
            return False

    def clear_graph(self):
        """Clears all nodes and relationships from the database."""
        if not self.is_connected():
            logger.warning("Neo4j not connected. Cannot clear graph.")
            return
        
        query = "MATCH (n) DETACH DELETE n"
        with self._driver.session() as session:
            session.run(query)
            logger.info("Cleared all nodes and edges from Neo4j.")

    def create_graph(self, entities: List[Entity], relationships: List[Relationship]) -> List[str]:
        """
        Populate Neo4j with nodes and edges.
        Returns a list of Cypher queries that were generated and executed.
        """
        if not self.is_connected():
            logger.warning("Neo4j not connected. Operations will be skipped.")
            return []

        generated_queries = []
        entity_type_map = {}

        # 1. Create Nodes
        for entity in entities:
            # Map entity type to valid label, sanitizing any special characters
            label = re_sanitize_label(entity.type)
            aliases = entity.aliases if hasattr(entity, 'aliases') and entity.aliases else []
            query = f"MERGE (n:{label} {{name: $name}}) SET n.aliases = $aliases"
            entity_type_map[entity.name] = label
            
            with self._driver.session() as session:
                session.run(query, name=entity.name, aliases=aliases)
            
            # Format query for logging / user export
            formatted_aliases = str(aliases).replace("'", '"')
            formatted_query = f"MERGE (n:{label} {{name: \"{entity.name}\"}}) SET n.aliases = {formatted_aliases};"
            generated_queries.append(formatted_query)

        # 2. Create Relationships
        for rel in relationships:
            # Determine labels for subject and object
            subj_label = entity_type_map.get(rel.subject, "Entity")
            obj_label = entity_type_map.get(rel.object, "Entity")
            
            # Neo4j relationship types are uppercase
            rel_type = rel.predicate.upper()
            
            confidence = getattr(rel, "confidence", 1.0)
            uncertain = getattr(rel, "uncertain", False)
            
            query = (
                f"MATCH (s:{subj_label} {{name: $subj_name}}) "
                f"MATCH (o:{obj_label} {{name: $obj_name}}) "
                f"MERGE (s)-[r:{rel_type}]->(o) "
                f"SET r.confidence = $confidence, r.uncertain = $uncertain"
            )
            
            with self._driver.session() as session:
                session.run(query, subj_name=rel.subject, obj_name=rel.object, confidence=confidence, uncertain=uncertain)
                
            formatted_query = (
                f"MATCH (s:{subj_label} {{name: \"{rel.subject}\"}}) "
                f"MATCH (o:{obj_label} {{name: \"{rel.object}\"}}) "
                f"MERGE (s)-[:{rel_type} {{confidence: {confidence}, uncertain: {str(uncertain).lower()}}}]->(o);"
            )
            generated_queries.append(formatted_query)

        return generated_queries

    def get_graph_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Fetch all nodes and relationships to serialize as JSON.
        """
        if not self.is_connected():
            # Mock / empty database response
            return {"nodes": [], "links": []}

        nodes = []
        links = []
        seen_nodes = set()

        nodes_query = "MATCH (n) RETURN n, labels(n)[0] as label"
        edges_query = "MATCH (s)-[r]->(o) RETURN s.name as source, type(r) as predicate, o.name as target, coalesce(r.confidence, 1.0) as confidence, coalesce(r.uncertain, false) as uncertain"

        with self._driver.session() as session:
            # Read nodes
            nodes_result = session.run(nodes_query)
            for record in nodes_result:
                node = record["n"]
                label = record["label"] or "Entity"
                name = node["name"]
                if name not in seen_nodes:
                    seen_nodes.add(name)
                    nodes.append({
                        "id": name,
                        "label": name,
                        "type": label
                    })

            # Read links
            edges_result = session.run(edges_query)
            for record in edges_result:
                links.append({
                    "source": record["source"],
                    "target": record["target"],
                    "type": record["predicate"].lower(),
                    "confidence": record["confidence"],
                    "uncertain": record["uncertain"]
                })

        return {"nodes": nodes, "links": links}

    def get_statistics(self, last_sentence_count: int = 0) -> GraphStatistics:
        """
        Retrieve database count statistics.
        """
        if not self.is_connected():
            return GraphStatistics(
                total_sentences=last_sentence_count,
                total_entities=0,
                total_relationships=0,
                unique_nodes=0,
                unique_edges=0
            )

        unique_nodes = 0
        unique_edges = 0

        with self._driver.session() as session:
            nodes_res = session.run("MATCH (n) RETURN count(n) as c")
            unique_nodes = nodes_res.single()["c"]

            edges_res = session.run("MATCH ()-[r]->() RETURN count(r) as c")
            unique_edges = edges_res.single()["c"]

        return GraphStatistics(
            total_sentences=last_sentence_count,
            total_entities=unique_nodes,
            total_relationships=unique_edges,
            unique_nodes=unique_nodes,
            unique_edges=unique_edges
        )

def re_sanitize_label(label: str) -> str:
    """Helper to clean labels for Neo4j syntax."""
    if not label:
        return "Entity"
    # Ensure label matches expected standard patterns and remove bad chars
    clean = "".join(c for c in label if c.isalnum() or c == "_" or c == " ")
    clean = clean.strip().replace(" ", "_")
    # Capitalize first letter
    if clean:
        return clean[0].upper() + clean[1:]
    return "Entity"

neo4j_client = Neo4jClient()

