from app.ai.sentence_segmenter import segment_transcript_into_sentences


def test_segment_english_sentences():
    raw_segments = [
        {
            "start": 0.0,
            "end": 4.5,
            "text": "What is the biggest secret to growth? It is discipline.",
            "words": [
                {"word": "What", "start": 0.0, "end": 0.5},
                {"word": "is", "start": 0.5, "end": 0.8},
                {"word": "the", "start": 0.8, "end": 1.0},
                {"word": "biggest", "start": 1.0, "end": 1.6},
                {"word": "secret", "start": 1.6, "end": 2.2},
                {"word": "to", "start": 2.2, "end": 2.5},
                {"word": "growth?", "start": 2.5, "end": 3.2},
                {"word": "It", "start": 3.3, "end": 3.6},
                {"word": "is", "start": 3.6, "end": 3.9},
                {"word": "discipline.", "start": 3.9, "end": 4.5},
            ],
        }
    ]

    sentences = segment_transcript_into_sentences(raw_segments)
    assert len(sentences) == 2
    assert "growth?" in sentences[0]["text"]
    assert "discipline." in sentences[1]["text"]
    assert sentences[0]["start"] == 0.0
    assert sentences[0]["end"] == 3.2
    assert sentences[1]["start"] == 3.3


def test_segment_hindi_devanagari_sentences():
    raw_segments = [
        {
            "start": 0.0,
            "end": 6.0,
            "text": "यह बात बहुत महत्वपूर्ण है। इसे ध्यान से समझें।",
            "words": [
                {"word": "यह", "start": 0.0, "end": 0.5},
                {"word": "बात", "start": 0.5, "end": 1.0},
                {"word": "बहुत", "start": 1.0, "end": 1.5},
                {"word": "महत्वपूर्ण", "start": 1.5, "end": 2.5},
                {"word": "है।", "start": 2.5, "end": 3.0},
                {"word": "इसे", "start": 3.2, "end": 3.7},
                {"word": "ध्यान", "start": 3.7, "end": 4.3},
                {"word": "से", "start": 4.3, "end": 4.8},
                {"word": "समझें।", "start": 4.8, "end": 5.8},
            ],
        }
    ]

    sentences = segment_transcript_into_sentences(raw_segments)
    assert len(sentences) == 2
    assert "है।" in sentences[0]["text"]
    assert "समझें।" in sentences[1]["text"]
