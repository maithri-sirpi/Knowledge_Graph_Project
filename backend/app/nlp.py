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

def extract_local_fallback(text: str) -> ExtractionResponse:
    sentences = segment_sentences(text)
    
    def clean_kannada_word(word: str) -> Tuple[str, str]:
        suffixes = [
            ("ಗಳನ್ನು", "OBJECT"), ("ವನ್ನು", "OBJECT"), ("ನಲ್ಲಿ", "PLACE"),
            ("ದಲ್ಲಿ", "PLACE"), ("ಅಲ್ಲಿ", "PLACE"), ("ಊರು", "PLACE"),
            ("ಪಟ್ಟಣ", "PLACE"), ("ಅನ್ನು", "OBJECT"), ("ನಿಗೆ", "PERSON"),
            ("ಳಿಗೆ", "PERSON"), ("ಗಾಗಿ", "EVENT"), ("ದಿಂದ", "EVENT"),
            ("ಇಂದ", "EVENT"), ("ಕ್ಕೆ", "OBJECT"), ("ಗಳು", "OBJECT"),
            ("ನು", "PERSON"), ("ಅವರು", "PERSON"), ("ವರು", "PERSON"),
            ("ವು", "ANIMAL"), ("ಗೆ", "OBJECT"), ("ರ", "PERSON"),
            ("ದ", "OBJECT"), ("ಯ", "OBJECT"), ("ನ", "PERSON"), 
            ("ನನ್ನು", "PERSON"), ("ಂಗೆ", "PERSON"), ("ಪುರ", "PLACE"),
            ("ನಗರ", "PLACE")
        ]
        
        w_clean = re.sub(r'[^\u0c80-\u0cff]', '', word).strip()
        if len(w_clean) <= 2:
            return w_clean, "OBJECT"
            
        detected_type = "OBJECT"
        for suf, etype in suffixes:
            if w_clean.endswith(suf) and len(w_clean) > len(suf) + 1:
                w_clean = w_clean[:-len(suf)]
                detected_type = etype
                break
                
        return w_clean, detected_type

    stop_words = {"ಒಂದು", "ಮತ್ತು", "ತುಂಬಾ", "ತನ್ನ", "ಅವನು", "ಅವಳು", "ಅವರು", "ಇದು", "ಅದು", "ಆದರೆ", "ಹಾಗೂ", "ಆಗ", "ಈಗ", "ಆತ", "ಆಕೆ", "ಇವನು", "ಇವಳು", "ತಮ್ಮ", "ಅವನ", "ಆತನ", "ಆಕೆಯ"}
    verb_suffixes = ("ಿದ್ದ", "ತ್ತಿದ್ದ", "ತ್ತಾನೆ", "ಿದನು", "ದ್ದಾನೆ", "ತ್ತಾರೆ", "ಬಹದು", "ಆಗಿದೆ", "ದನು", "ಳು", "ತು", "ದರು", "ಯಿತು", "ದವು", "ಯಿತು")

    word_freqs = {}
    word_types = {}
    
    raw_words = text.split()
    
    for w in raw_words:
        base, etype = clean_kannada_word(w)
        is_verb = any(base.endswith(s) or w.endswith(s) for s in verb_suffixes)
        if len(base) > 2 and base not in stop_words and not is_verb:
            word_freqs[base] = word_freqs.get(base, 0) + 1
            if base not in word_types or etype != "OBJECT":
                word_types[base] = etype
                
    candidate_entities = []
    for base, freq in word_freqs.items():
        etype = word_types.get(base, "OBJECT")
        if freq >= 2 or (etype != "OBJECT" and len(base) >= 3):
            candidate_entities.append(Entity(name=base, type=etype, aliases=[]))
            
    if not candidate_entities:
        sorted_words = sorted(word_freqs.items(), key=lambda x: x[1], reverse=True)[:10]
        for base, freq in sorted_words:
            etype = word_types.get(base, "OBJECT")
            candidate_entities.append(Entity(name=base, type=etype, aliases=[]))
            
    valid_entity_names = {e.name for e in candidate_entities}
    relationships = []
    
    # Generic verb list for fallback
    verbs = [
        ("ವಾಸಿಸು", "lives_in"), ("ಸಹಾಯ", "helped"), ("ಸ್ನೇಹ", "friend_of"),
        ("ಹೋಗು", "travels_to"), ("ಬರು", "visits"), ("ಮಾಡು", "did"),
        ("ಹೇಳು", "speaks_to"), ("ಕೇಳು", "asks"), ("ನೋಡು", "sees"),
        ("ಮದುವೆ", "married"), ("ಹುಟ್ಟು", "born_to"), ("ಕೊಡು", "gave"),
        ("ತಗೋ", "took"), ("ಆಳು", "rules"), ("ಕಲಿ", "learns")
    ]
    
    for seg in sentences:
        words_in_sentence = seg.text.split()
        found_entities = []
        for i, word in enumerate(words_in_sentence):
            base, _ = clean_kannada_word(word)
            if base in valid_entity_names:
                found_entities.append((base, i))
                
        for idx in range(len(found_entities) - 1):
            e1_name, pos1 = found_entities[idx]
            e2_name, pos2 = found_entities[idx+1]
            
            if e1_name == e2_name:
                continue
                
            distance = abs(pos2 - pos1)
            if distance <= 10:
                window_words = words_in_sentence[max(0, pos1-3):min(len(words_in_sentence), pos2+4)]
                window_text = " ".join(window_words)
                
                pred = "related_to" 
                for v, rel in verbs:
                    if v in window_text:
                        pred = rel
                        break
                        
                t2 = word_types.get(e2_name, "OBJECT")
                if t2 == "PLACE" and pred == "related_to":
                    pred = "located_in"
                
                relationships.append(Relationship(
                    subject=e1_name, 
                    predicate=pred, 
                    object=e2_name,
                    confidence=0.5,
                    source_text=seg.text,
                    extraction_method="heuristic",
                    uncertain=True
                ))

    # De-duplicate relationships
    unique_rels = []
    seen = set()
    for r in relationships:
        key = (r.subject, r.predicate, r.object)
        if key not in seen:
            seen.add(key)
            unique_rels.append(r)
            
    if not unique_rels and len(candidate_entities) >= 2:
        for i in range(len(candidate_entities) - 1):
            e1 = candidate_entities[i].name
            e2 = candidate_entities[i+1].name
            unique_rels.append(Relationship(
                subject=e1, predicate="related_to", object=e2,
                confidence=0.3, extraction_method="heuristic", uncertain=True
            ))
            
    return ExtractionResponse(
        sentences=sentences,
        entities=candidate_entities,
        relationships=unique_rels,
        triples=unique_rels
    )

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
    import google.generativeai as genai
    
    if not settings.GEMINI_API_KEY:
        raise ValueError("Gemini API key is not configured.")
        
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    prompt = _get_llm_prompt(text)
    
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config={"response_mime_type": "application/json"}
    )
    
    response = model.generate_content(prompt)
    data = json.loads(response.text)
    
    return _parse_llm_response(text, data, "gemini")

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
    if not payload.use_llm:
        logger.info("Using local fallback extractor (heuristic)")
        return extract_local_fallback(payload.text)
        
    if payload.llm_provider == "gemini" and settings.GEMINI_API_KEY:
        try:
            logger.info("Extracting using Google Gemini API")
            return extract_via_gemini(payload.text)
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}. Falling back to local extractor.")
            return extract_local_fallback(payload.text)
            
    elif payload.llm_provider == "openai" and settings.OPENAI_API_KEY:
        try:
            logger.info("Extracting using OpenAI API")
            return extract_via_openai(payload.text)
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}. Falling back to local extractor.")
            return extract_local_fallback(payload.text)
            
    else:
        logger.warning("No valid API Key provided. Defaulting to local fallback extractor.")
        return extract_local_fallback(payload.text)
