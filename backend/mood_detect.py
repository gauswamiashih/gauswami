import speech_recognition as sr
from transformers import pipeline

# Initialize sentiment pipeline once
sentiment_analyzer = pipeline('sentiment-analysis')

def detect_mood(audio_file):
    recognizer = sr.Recognizer()

    # Audio file might be a FileStorage from Flask, so use .stream
    with sr.AudioFile(audio_file) as source:
        audio = recognizer.record(source)

    try:
        text = recognizer.recognize_google(audio)
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError as e:
        return f"Speech Recognition service error: {e}"

    if not text.strip():
        return "No speech detected"

    result = sentiment_analyzer(text)[0]

    label = result['label'].lower()
    score = result['score']

    if label == 'positive' and score > 0.6:
        return "Happy"
    elif label == 'negative' and score > 0.6:
        return "Sad"
    else:
        return "Neutral"
