import re
import json
import logging
from typing import List, Dict, Any, Tuple
from app.schemas import Entity, Relationship, ExtractionResponse, StoryPayload, TextSegment
from app.config import settings

logger = logging.getLogger("nlp")
logging.basicConfig(level=logging.INFO)

def segment_sentences(text: str) -> List[TextSegment]:
    if not text:
        return []
    
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    raw_sentences = re.split(r'[.!?\n\u0964]+', text)
    
    sentences = []
    for s in raw_sentences:
        s_clean = s.strip()
        if s_clean:
            # Fallback simple segmentation
            sentences.append(TextSegment(
                text=s_clean,
                source_type="original",
                language_style="unknown"
            ))
            
    return sentences



def _get_llm_prompt(text: str) -> str:
    return f"""
You are an advanced Kannada linguistic expert analyzing Kannada texts (poems, epics, historical texts, stories, etc.).
Your goal is to parse the text, resolve references, and construct a Knowledge Graph.

The system must discover entities dynamically. DO NOT restrict yourself to a predefined list.
Entity types can be anything relevant (e.g., PERSON, PLACE, KINGDOM, DEITY, ANIMAL, OBJECT, CONCEPT, EVENT, KING, QUEEN, WARRIOR, TEACHER, STUDENT, POET, AUTHOR, ROLE, FAMILY, GROUP, CITY, VILLAGE, etc.).
Relationships must be discovered dynamically from the text. Examples: father_of, enemy_of, travels_to, speaks_to, rules, etc. 
If a text mentions "ದ್ರೋಣನು ಅಶ್ವತ್ಥಾಮನನ್ನು ಕರೆದುಕೊಂಡು ಹೋದನು", relationship could be `took_along`.
Normalize entity names (e.g., ದ್ರೋಣ, ದ್ರೋಣನು, ದ್ರೋಣಂಗೆ, ದ್ರೋಣನ, ದ್ರೋಣನನ್ನು -> ದ್ರೋಣ) and store original forms as aliases.
Resolve pronouns (ಅವನು, ಅವಳು, ಆತ, ಅವರು, ಆತನು, ಆಕೆ, ಇವನು, ಇವಳು, ತಮ್ಮ, ಅವನ, ಆತನ, ಆಕೆಯ) to the correct entity if context is clear.

Return JSON matching this exact schema:
{{
  "sentences": [
    {{
      "text": "original sentence text",
      "section": "optional section name",
      "verse_number": "optional verse number",
      "source_type": "original or commentary or translation",
      "language_style": "old_kannada or modern_kannada"
    }}
  ],
  "entities": [
    {{
      "name": "Canonical Entity Name in Kannada",
      "type": "UPPERCASE_TYPE",
      "aliases": ["alias1", "alias2"]
    }}
  ],
  "relationships": [
    {{
      "subject": "Canonical Entity Name",
      "predicate": "lowercase_english_verb_or_relation",
      "object": "Canonical Entity Name",
      "confidence": 0.0 to 1.0,
      "source_text": "the exact sentence proving this relation",
      "source_location": "verse 1 or paragraph 2",
      "uncertain": true or false
    }}
  ]
}}

Rules:
1. Entity names MUST remain in Kannada.
2. Predicates MUST be lowercase English with underscores (e.g., father_of).
3. If a relationship is ambiguous or implied, set confidence low (< 0.6) and uncertain=true.
4. Try to break the text into logical sentences or verses in the `sentences` array.
5. Handle Kannada linguistic variation including Sandhi, inflections, case suffixes, verb variations, compound words, old Kannada vocabulary, spelling variations, and different grammatical endings.
6. Support texts containing combinations such as Verse + Modern Kannada explanation + Verse + Commentary. Ensure each text segment has metadata such as `source_type` (original, commentary, modern_explanation, translation, unknown) and `language_style` (old_kannada). Do not mix commentary and original text without marking the difference.
7. Do not hardcode entities or relationships. The same pipeline must work for any Kannada literary text.

Kannada Text:
{text}
"""

def extract_via_gemini(text: str) -> ExtractionResponse:
    if not settings.GEMINI_API_KEY:
        raise ValueError("Gemini API key is not configured.")
        
    prompt = _get_llm_prompt(text)
    
    from google import genai
    from google.genai import types
    import time

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    candidate_models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"]
    last_exception = None

    for model_name in candidate_models:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                data = json.loads(response.text)
                return _parse_llm_response(text, data, "gemini")
            except Exception as e:
                last_exception = e
                err_msg = str(e)
                if "503" in err_msg or "high demand" in err_msg.lower() or "unavailable" in err_msg.lower():
                    logger.warning(f"Gemini model '{model_name}' busy (503/high demand), attempt {attempt+1}. Retrying...")
                    time.sleep(1.5)
                else:
                    logger.warning(f"Model '{model_name}' returned error: {e}. Trying next fallback model...")
                    break

    raise RuntimeError(f"Gemini API is temporarily busy. Please try again in a few seconds. (Error: {last_exception})")

def extract_via_openai(text: str) -> ExtractionResponse:
    from openai import OpenAI
    
    if not settings.OPENAI_API_KEY:
        raise ValueError("OpenAI API key is not configured.")
        
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = _get_llm_prompt(text)
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful data extraction assistant that outputs JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    data = json.loads(response.choices[0].message.content)
    return _parse_llm_response(text, data, "openai")

def _parse_llm_response(text: str, data: Dict[str, Any], provider: str) -> ExtractionResponse:
    raw_sentences = data.get("sentences", [])
    sentences = []
    if not raw_sentences:
        sentences = segment_sentences(text)
    else:
        for s in raw_sentences:
            if isinstance(s, str):
                sentences.append(TextSegment(text=s))
            else:
                sentences.append(TextSegment(
                    text=s.get("text", ""),
                    section=s.get("section"),
                    verse_number=s.get("verse_number"),
                    source_type=s.get("source_type", "unknown"),
                    language_style=s.get("language_style", "unknown")
                ))

    entities = []
    for e in data.get("entities", []):
        entities.append(Entity(
            name=e.get("name", "Unknown"),
            type=e.get("type", "ENTITY"),
            aliases=e.get("aliases", [])
        ))
    
    relationships = []
    for r in data.get("relationships", []):
        sub = r.get("subject")
        pred = r.get("predicate")
        obj = r.get("object")
        if sub and pred and obj:
            clean_pred = re.sub(r'[^a-z0-9_]', '', pred.lower().strip().replace(' ', '_'))
            if not clean_pred:
                clean_pred = "related_to"
            relationships.append(Relationship(
                subject=sub,
                predicate=clean_pred,
                object=obj,
                confidence=r.get("confidence", 0.9),
                source_type=r.get("source_type", "original"),
                source_text=r.get("source_text"),
                source_location=r.get("source_location"),
                extraction_method=provider,
                uncertain=r.get("uncertain", False)
            ))
            
    return ExtractionResponse(
        sentences=sentences,
        entities=entities,
        relationships=relationships,
        triples=relationships
    )

def process_story(payload: StoryPayload) -> ExtractionResponse:
    if payload.llm_provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise ValueError("Gemini API key is not configured in your backend/.env file.")
        logger.info("Extracting using Google Gemini API")
        return extract_via_gemini(payload.text)
        
    elif payload.llm_provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OpenAI API key is not configured in your backend/.env file.")
        logger.info("Extracting using OpenAI API")
        return extract_via_openai(payload.text)
        
    else:
        raise ValueError(f"Unsupported LLM provider: {payload.llm_provider}")
