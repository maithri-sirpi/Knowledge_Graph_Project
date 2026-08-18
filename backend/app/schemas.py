from pydantic import BaseModel
from typing import List, Optional

class StoryPayload(BaseModel):
    text: str
    use_llm: bool = True
    llm_provider: str = "gemini"  # "gemini" or "openai"

class TextSegment(BaseModel):
    text: str
    section: Optional[str] = None
    verse_number: Optional[str] = None
    source_type: Optional[str] = "unknown"
    language_style: Optional[str] = "unknown"

class Entity(BaseModel):
    name: str
    type: str  
    aliases: Optional[List[str]] = []

class Relationship(BaseModel):
    subject: str
    predicate: str  
    object: str
    confidence: Optional[float] = 1.0
    source_type: Optional[str] = "original"
    source_text: Optional[str] = None
    source_location: Optional[str] = None
    extraction_method: Optional[str] = "heuristic"
    uncertain: Optional[bool] = False

class ExtractionResponse(BaseModel):
    sentences: List[TextSegment]
    entities: List[Entity]
    relationships: List[Relationship]
    triples: List[Relationship]

class GraphStatistics(BaseModel):
    total_sentences: int
    total_entities: int
    total_relationships: int
    unique_nodes: int
    unique_edges: int
