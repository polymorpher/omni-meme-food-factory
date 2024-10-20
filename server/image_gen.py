import os
import base64
import uuid
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from google.cloud import storage
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_image(prompt, size, quality, n, response_format):
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            quality=quality,
            n=n,
            response_format=response_format,
        )
        if (response_format == 'b64_json'):
            return response.data[0].b64_json
        else:
            return response.data[0].url
    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return None

def save_image(b64_json, filename):
    with open(filename, "wb") as file:
        file.write(base64.b64decode(b64_json))

def upload_blob(bucket_name, source_file_name, destination_blob_name):
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)

        generation_match_precondition = 0

        blob.upload_from_filename(source_file_name, if_generation_match=generation_match_precondition)

        print(f"File {source_file_name} uploaded to {destination_blob_name}.")
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
    finally:
        os.remove(source_file_name)  # Clean up the temporary file

def generate_unique_filename(file_extension=".png"):
    return f"{uuid.uuid4()}{file_extension}"

def download_image(url, filename):
    response = requests.get(url)
    if response.status_code == 200:
        with open(filename, 'wb') as f:
            f.write(response.content)
        return True
    return False

def process_image(response_format, res, bucket_name, destination_blob_name, temp_filename):
    if (response_format == 'b64_json'):
        save_image(res, temp_filename)
    else:
        download_image(res, temp_filename)
    upload_blob(bucket_name, temp_filename, destination_blob_name)

@app.route('/generate-and-upload', methods=['POST'])
def generate_and_upload():
    data = request.json
    prompt = data.get('prompt', 'a white siamese cat')
    size = data.get('size', '1024x1024')
    quality = data.get('quality', 'standard')
    n = data.get('n', 1)
    response_format = data.get('response_format', 'url')
    bucket_name = "omni-meme-food-factory"
    destination_blob_name = generate_unique_filename()

    res = generate_image(prompt, size, quality, n, response_format)
    if not res:
        return jsonify({"error": "Failed to generate image"}), 500
    print(f"response_format {response_format}")

    temp_filename = f"temp_image_{destination_blob_name}"

    process_image(response_format, res, bucket_name, temp_filename, destination_blob_name)
    return jsonify({
        "message": "Image generated successfully. Upload started.",
        "url_path": f"https://storage.cloud.google.com/{bucket_name}/temp_image_{destination_blob_name}"
    })

if __name__ == '__main__':
    app.run(debug=True)