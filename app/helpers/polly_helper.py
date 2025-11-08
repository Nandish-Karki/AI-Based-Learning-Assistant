import uuid
import boto3
from google.cloud import storage
from google.oauth2 import service_account
import os
import html

polly_client = boto3.client("polly", region_name="us-east-1")

def synthesize_speech(text, emotion):
    # GCP creds (service account that can write to the bucket)
    credentials = service_account.Credentials.from_service_account_file(
        os.path.join(os.path.dirname(__file__), "../../firebase_token.json")
    )

    storage_client = storage.Client(credentials=credentials)
    bucket = storage_client.bucket("tutor-85bb3.firebasestorage.app")  # ✅ correct bucket

    voice = "Joanna"
    prosody = {
        "happy": "<prosody rate=\"fast\" pitch=\"+5%\">",
        "sad": "<prosody rate=\"slow\" pitch=\"-3%\">",
        "angry": "<prosody volume=\"loud\">",
        "confused": "<prosody rate=\"slow\" pitch=\"-2%\">",
        "neutral": "<prosody rate=\"medium\">",
    }.get(emotion, "<prosody rate=\"medium\">")

    # escape user text so it’s valid SSML
    escaped_text = html.escape(text, quote=True)
    ssml = f"<speak>{prosody}{escaped_text}</prosody></speak>"

    # Polly
    resp = polly_client.synthesize_speech(
        Engine="neural",             # or "standard"
        OutputFormat="mp3",
        TextType="ssml",
        Text=ssml,
        VoiceId=voice,
    )

    audio = resp["AudioStream"].read()

    # Upload to Firebase Storage (GCS)
    file_id = uuid.uuid4().hex
    file_name = f"QA/audio_{file_id}.mp3"
    blob = bucket.blob(file_name)
    blob.upload_from_string(audio, content_type="audio/mpeg")

    # Generate Firebase download URL with token
    token = uuid.uuid4().hex
    blob.metadata = {"firebaseStorageDownloadTokens": token}
    blob.patch()

    public_url = (
        "https://firebasestorage.googleapis.com/v0/b/"
        f"{bucket.name}/o/{file_name.replace('/', '%2F')}?alt=media&token={token}"
    )
    return public_url
