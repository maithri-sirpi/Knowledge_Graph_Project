import csv
import io
from typing import List, Dict, Any
from app.schemas import Entity, Relationship

def generate_csv(relationships: List[Relationship]) -> str:
    """
    Generates a CSV string representing the extracted triples.
    """
    output = io.StringIO()
    writer = csv.writer(output, lineterminator='\n')
    # Write header
    writer.writerow(["Subject", "Predicate", "Object"])
    for rel in relationships:
        writer.writerow([rel.subject, rel.predicate, rel.object])
    return output.getvalue()

def generate_cypher_script(entities: List[Entity], relationships: List[Relationship]) -> str:
    """
    Generates a Cypher script of MERGE queries to reconstruct the graph in Neo4j.
    """
    lines = []
    lines.append("// Kannada Story Knowledge Graph Generator Cypher Script\n")
    
    # Node queries
    lines.append("// Nodes")
    entity_labels = {}
    for entity in entities:
        label = entity.type or "Entity"
        # Capitalize and sanitize label
        label = "".join(c for c in label if c.isalnum() or c == "_")
        label = label[0].upper() + label[1:] if label else "Entity"
        entity_labels[entity.name] = label
        
        # Escape string quotes safely
        safe_name = entity.name.replace('"', '\\"')
        lines.append(f'MERGE (n:{label} {{name: "{safe_name}"}});')
        
    lines.append("\n// Relationships")
    # Edge queries
    for rel in relationships:
        subj_label = entity_labels.get(rel.subject, "Entity")
        obj_label = entity_labels.get(rel.object, "Entity")
        rel_type = rel.predicate.upper()
        
        safe_subj = rel.subject.replace('"', '\\"')
        safe_obj = rel.object.replace('"', '\\"')
        
        lines.append(
            f'MATCH (s:{subj_label} {{name: "{safe_subj}"}}) '
            f'MATCH (o:{obj_label} {{name: "{safe_obj}"}}) '
            f'MERGE (s)-[:{rel_type}]->(o);'
        )
        
    return "\n".join(lines)

def generate_graphml(nodes: List[Dict[str, Any]], links: List[Dict[str, Any]]) -> str:
    """
    Converts graph nodes and links into standard GraphML XML.
    """
    xml = []
    xml.append('<?xml version="1.0" encoding="UTF-8"?>')
    xml.append('<graphml xmlns="http://graphml.graphdrawing.org/xmlns"')
    xml.append('         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"')
    xml.append('         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns')
    xml.append('         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">')
    
    # Metadata keys
    xml.append('  <key id="d0" for="node" attr.name="type" attr.type="string"/>')
    xml.append('  <key id="d1" for="edge" attr.name="predicate" attr.type="string"/>')
    
    xml.append('  <graph id="G" edgedefault="directed">')
    
    # Nodes
    for node in nodes:
        node_id = node.get("id", "")
        node_type = node.get("type", "Entity")
        # XML escape helper
        safe_id = node_id.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        safe_type = node_type.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        
        xml.append(f'    <node id="{safe_id}">')
        xml.append(f'      <data key="d0">{safe_type}</data>')
        xml.append('    </node>')
        
    # Edges
    for i, link in enumerate(links):
        source = link.get("source", "")
        target = link.get("target", "")
        predicate = link.get("type", "")
        
        safe_source = source.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        safe_target = target.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        safe_pred = predicate.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        
        xml.append(f'    <edge id="e{i}" source="{safe_source}" target="{safe_target}">')
        xml.append(f'      <data key="d1">{safe_pred}</data>')
        xml.append('    </edge>')
        
    xml.append('  </graph>')
    xml.append('</graphml>')
    
    return "\n".join(xml)
