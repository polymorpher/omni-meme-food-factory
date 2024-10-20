import os
import base64
import uuid
import asyncio
import aiohttp
import aiofiles
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import AsyncOpenAI
from google.cloud import storage
from dotenv import load_dotenv
from eth_utils import keccak
import binascii

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

class ReviewData:
    def __init__(self, user_address, text):
        self.user_address = user_address
        self.text = text

reviews = {}

# Initialize AsyncOpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_recipe(prompt):
    try:
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "user",
                    "content": f"Write a recipe for {prompt}."
                }
            ]
        )
        return response.choices[0].message.content
    except Exception as error:
        print('Error generating recipe:', str(error))
        return None

async def generate_image(prompt, size, quality, n, response_format):
    try:
        response = await client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            quality=quality,
            n=n,
            response_format=response_format,
        )
        if response_format == 'b64_json':
            return response.data[0].b64_json
        else:
            return response.data[0].url
    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return None

async def save_image(b64_json, filename):
    async with aiofiles.open(filename, "wb") as file:
        await file.write(base64.b64decode(b64_json))

async def upload_blob(bucket_name, source_file_name, destination_blob_name):
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)

        generation_match_precondition = 0

        await asyncio.to_thread(
            blob.upload_from_filename,
            source_file_name,
            if_generation_match=generation_match_precondition
        )

        print(f"File {source_file_name} uploaded to {destination_blob_name}.")
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
    finally:
        os.remove(source_file_name)  # Clean up the temporary file

def generate_unique_filename(file_extension=".png"):
    return f"{uuid.uuid4()}{file_extension}"

async def download_image(url, filename):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                async with aiofiles.open(filename, 'wb') as f:
                    await f.write(await response.read())
                return True
    return False

async def process_image(response_format, res, bucket_name, destination_blob_name):
    temp_filename = f"temp_image_{destination_blob_name}"
    if response_format == 'b64_json':
        await save_image(res, temp_filename)
    else:
        await download_image(res, temp_filename)
    await upload_blob(bucket_name, temp_filename, destination_blob_name)
    return f"https://storage.cloud.google.com/{bucket_name}/{temp_filename}"

def verify_keccak_hash(input_data, expected_hash):
    if isinstance(input_data, str):
        input_bytes = input_data.encode('utf-8')
    elif isinstance(input_data, bytes):
        input_bytes = input_data
    else:
        raise ValueError("Input must be string or bytes")
    
    calculated_hash = keccak(input_bytes)
    calculated_hex = '0x' + binascii.hexlify(calculated_hash).decode('ascii')

    if not expected_hash.startswith('0x'):
        expected_hash = '0x' + expected_hash
    return calculated_hex.lower() == expected_hash.lower()

@app.route('/generate-and-upload', methods=['POST'])
async def generate_and_upload():
    data = request.json
    prompt = data.get('prompt', 'Sichuan hotpot')
    size = data.get('size', '1024x1024')
    quality = data.get('quality', 'standard')
    n = data.get('n', 1)
    response_format = data.get('response_format', 'url')
    bucket_name = "omni-meme-food-factory"
    destination_blob_name = generate_unique_filename()
    isFake = data.get('isFake', 'true')

    if (isFake == 'true'):
        return jsonify({
            "message": "Image generated and uploaded successfully.",
            "url_path": "https://storage.cloud.google.com/omni-meme-food-factory/c08af7a7-421b-4b36-b081-e22573eb7b57.png",
        })
    else:
        image_task = asyncio.create_task(generate_image(prompt, size, quality, n, response_format))

        res = await image_task
        if not res:
            return jsonify({"error": "Failed to generate image"}), 500

        url_path = await process_image(response_format, res, bucket_name, destination_blob_name)

        return jsonify({
            "message": "Image generated and uploaded successfully.",
            "url_path": url_path,
        })

@app.route('/generate-recipe', methods=['POST'])
async def generate_recipe():
    data = request.json
    prompt = data.get('prompt', 'Sichuan hotpot')
    isFake = data.get('isFake', 'true')

    if (isFake == 'true'):
         return jsonify({
            "message": "Receipe generated.",
            "recipe": "Recipe for Creating a White Cat Watermark Meme\n\nIngredients:\n\n1. Basic knowledge of Photoshop or any other image editing software\n2. High-resolution image of a white cat\n3. A funny or interesting caption or quote\n4. Watermark (Your name, brand, or logo)\n\nInstructions\n\n1. First, find or take a high-resolution picture of a white cat. The image should be clear. The cat can be in any pose that you find entertaining or relevant to the caption you have in mind.\n\n2. Next, use your knowledge of Photoshop or any image editing software to prepare the image. Open the image in the application, adjust the brightness, contrast, and clarity to enhance the image quality.\n\n3. After editing the primary image, the next step is to add the meme text. This should be something funny or engaging related to the expression or the posture of the cat in the image. Click on the text tool, place the cursor where you want the text to appear, and type your funny caption.\n\n4. Choose a font that is bold and easily readable. Opt for white text with black stroke, as it will ensure that the text is legible across a variety of backgrounds. Make sure the text is the right size, it should be big enough to read but not so big that it takes away from the image.\n\nHappy memeing!",
        })
    else:
        recipe_task = asyncio.create_task(generate_recipe(prompt))

        recipe = await recipe_task

        return jsonify({
            "message": "Receipe generated.",
            "recipe": recipe,
        })

@app.route('/reviews/<string:foodaddr>', methods=['GET'])
def get_review(foodaddr):
    if foodaddr in reviews:
        review_list = [{"user_address": r.user_address, "text": r.text} for r in reviews[foodaddr]]
        return jsonify({
            'reviews': review_list
        }), 200
    return jsonify({'error': 'Review not found'}), 404

@app.route('/review', methods=['POST'])
def create_review():
    data = request.json
    if not data or 'food_address' not in data or 'user_address' not in data:
        return jsonify({'error': 'Invalid request. Must include food address or user address'}), 400

    foodaddr = data.get('food_address')
    useraddr = data.get('user_address')
    text = data.get('text')

    # # need to call the ether to get the expected_hash
    # is_valid = verify_keccak_hash(text, expected_hash)
    # if not is_valid:
    #     return jsonify({'error': 'Invalid text'}), 400

    reviews.setdefault(foodaddr, []).append(ReviewData(user_address=useraddr, text=text))

    return jsonify({
        'message': 'Success'
    }), 201

if __name__ == '__main__':
    app.run(debug=True)