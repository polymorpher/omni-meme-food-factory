import os
import base64
import uuid
import requests
import json
import plyvel
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from google.cloud import storage
from dotenv import load_dotenv
from eth_utils import keccak
import binascii

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Initialize LevelDB
db = plyvel.DB('./mydb', create_if_missing=True)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_name_from_prompt(prompt):
    # Extract up to three capital letters from the prompt
    capitals = re.findall(r'[A-Z]', prompt)[:3]
    # If we don't have 3 capitals, add 'X's to make it 3 characters
    while len(capitals) < 3:
        capitals.append('X')
    return f"{prompt} {''.join(capitals)}"

def generate_recipe_with_prompt(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "user",
                    "content": f"Write a recipe for {prompt}."
                }
            ]
        )
        print('generate recipe response: ', response.choices[0].message.content)
        return response.choices[0].message.content
    except Exception as error:
        print('Error generating recipe:', str(error))
        return None

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
        if response_format == 'b64_json':
            return response.data[0].b64_json
        else:
            print(response.data[0].url)
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

        blob.upload_from_filename(
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

def download_image(url, filename):
    response = requests.get(url)
    if response.status_code == 200:
        with open(filename, 'wb') as f:
            f.write(response.content)
        return True
    return False

def process_image(response_format, res, bucket_name, destination_blob_name):
    temp_filename = f"temp_image_{destination_blob_name}"
    if response_format == 'b64_json':
        save_image(res, temp_filename)
    else:
        download_image(res, temp_filename)
    upload_blob(bucket_name, temp_filename, destination_blob_name)
    return f"https://storage.cloud.google.com/{bucket_name}/{destination_blob_name}"

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
def generate_and_upload():
    data = request.json
    prompt = data.get('prompt', 'Sichuan hotpot')
    size = data.get('size', '1024x1024')
    quality = data.get('quality', 'standard')
    n = data.get('n', 1)
    response_format = data.get('response_format', 'url')
    bucket_name = "omni-meme-food-factory"
    new_uuid = str(uuid.uuid4())
    destination_blob_name = f"{new_uuid}.png"
    isFake = data.get('isFake', 'true')

    # Generate name from prompt
    name = generate_name_from_prompt(prompt)

    if (isFake == 'true'):
        url_path = "https://storage.googleapis.com/omni-meme-food-factory/63e2424e-c0eb-4605-856c-ecfabdf54e69.png"
    else:
        res = generate_image(prompt, size, quality, n, response_format)
        if not res:
            return jsonify({"error": "Failed to generate image"}), 500
        url_path = process_image(response_format, res, bucket_name, destination_blob_name)

    # Save the latest UUID, URL path, and name to the database
    db.put(b'latest_uuid', new_uuid.encode())
    db.put(b'latest_url_path', url_path.encode())
    db.put(b'latest_name', name.encode())

    return jsonify({
        "message": "Image generated and uploaded successfully.",
        "url_path": url_path,
        "uuid": new_uuid,
        "name": name
    })

@app.route('/generate-recipe', methods=['POST'])
def generate_recipe():
    data = request.json
    prompt = data.get('prompt', 'Sichuan hotpot')
    isFake = data.get('isFake', 'true')

    if (isFake == 'true'):
        recipe = "Ingredients:\n\nFor Chicken:\n-1 whole chicken (about 3 to 4 lbs)\n-2 teaspoon salt\n-2 teaspoon sesame oil\n-Freshly ground black pepper\n-A bunch of green onions\n-2 inch piece of fresh ginger, peeled\n\nFor Rice:\n-2 cups of jasmine rice\n-2 teaspoons of salt\n-4 cloves of garlic, minced\n-1 thumb size ginger, minced\n-4 cups of chicken broth (from boiling the chicken)\n-2 tablespoon of vegetable oil\n\nFor Sauce (optional):\n-2 tablespoons of oyster sauce\n-1 tablespoon of soy sauce\n-1 tablespoon of cornstarch dissolved in 3 tablespoons of water\n-1/2 cup of chicken broth\n-1 tablespoon of sugar\n\nInstructions:\n\n1. Start by cleaning the chicken. Remove any excess fat and clean it thoroughly.\n\n2. Submerge the chicken in a big pot of water. Add in the bunch of green onions and fresh ginger.\n\n3. Bring the water to a boil and then reduce to a simmer.\n\n4. Let the chicken cook for about 45 minutes or until it is fully cooked.\n\n5. Once the chicken is cooked, remove it from the pot and put it into a bowl of ice water. This helps to keep the chicken skin firm.\n\n6. Rub the chicken with salt, sesame oil, and black pepper.\n\n7. To prepare the rice, wash the jasmine rice under running water until the water runs clear.\n\n8. Heat up 2 tablespoons of vegetable oil in a pot, then add the minced garlic and minced ginger. Stir-fry until fragrant.\n\n9. Add in the jasmine rice and stir for a few minutes, then pour in 4 cups of the chicken broth used to cook the chicken.\n\n10. Add salt, then bring it to a boil. Once boiling, reduce to a simmer and cover the pot. Cook until the rice is done, usually takes around 15-20 minutes.\n\n11. To make the optional sauce, combine the oyster sauce, soy sauce, cornstarch water, chicken broth, and sugar in a saucepan. Stir well and heat over medium heat until it thickens.\n\n12. Now, carve your chicken and serve it over the flavorful jasmine rice. Pour some of the optional sauce over the chicken if desired.\n\n13. Hainanese chicken rice can be served with some cucumber slices and fresh cilantro. Enjoy this comforting and delicious dish!\n\nNote: The timing may vary depending on the size of the chicken."
    else:
        recipe = generate_recipe_with_prompt(prompt)

    # Save the latest recipe to the database
    latest_uuid = db.get(b'latest_uuid')
    if latest_uuid:
        db.put(f"recipe:{latest_uuid.decode()}".encode(), recipe.encode())

    return jsonify({
        "message": "Recipe generated.",
        "recipe": recipe,
    })

@app.route('/<string:foodaddr>', methods=['GET'])
def get_info(foodaddr):
    food_info = db.get(foodaddr.encode())
    if food_info:
        return jsonify(json.loads(food_info.decode()))
    
    # If not found, return the latest generated content
    latest_uuid = db.get(b'latest_uuid')
    latest_url_path = db.get(b'latest_url_path')
    latest_recipe = db.get(f"recipe:{latest_uuid.decode()}".encode()) if latest_uuid else None
    latest_name = db.get(b'latest_name')

    if latest_uuid and latest_url_path and latest_recipe and latest_name:
        return jsonify({
            "name": latest_name.decode(),
            "url_path": latest_url_path.decode(),
            "recipe": latest_recipe.decode(),
        })

    # If no latest content, return the default
    return jsonify({
        "name": "Hainanese Chicken Rice HCR",
        "url_path": "https://storage.googleapis.com/omni-meme-food-factory/63e2424e-c0eb-4605-856c-ecfabdf54e69.png",
        "recipe": "Ingredients:\n\nFor Chicken:\n-1 whole chicken (about 3 to 4 lbs)\n-2 teaspoon salt\n-2 teaspoon sesame oil\n-Freshly ground black pepper\n-A bunch of green onions\n-2 inch piece of fresh ginger, peeled\n\nFor Rice:\n-2 cups of jasmine rice\n-2 teaspoons of salt\n-4 cloves of garlic, minced\n-1 thumb size ginger, minced\n-4 cups of chicken broth (from boiling the chicken)\n-2 tablespoon of vegetable oil\n\nFor Sauce (optional):\n-2 tablespoons of oyster sauce\n-1 tablespoon of soy sauce\n-1 tablespoon of cornstarch dissolved in 3 tablespoons of water\n-1/2 cup of chicken broth\n-1 tablespoon of sugar\n\nInstructions:\n\n1. Start by cleaning the chicken. Remove any excess fat and clean it thoroughly.\n\n2. Submerge the chicken in a big pot of water. Add in the bunch of green onions and fresh ginger.\n\n3. Bring the water to a boil and then reduce to a simmer.\n\n4. Let the chicken cook for about 45 minutes or until it is fully cooked.\n\n5. Once the chicken is cooked, remove it from the pot and put it into a bowl of ice water. This helps to keep the chicken skin firm.\n\n6. Rub the chicken with salt, sesame oil, and black pepper.\n\n7. To prepare the rice, wash the jasmine rice under running water until the water runs clear.\n\n8. Heat up 2 tablespoons of vegetable oil in a pot, then add the minced garlic and minced ginger. Stir-fry until fragrant.\n\n9. Add in the jasmine rice and stir for a few minutes, then pour in 4 cups of the chicken broth used to cook the chicken.\n\n10. Add salt, then bring it to a boil. Once boiling, reduce to a simmer and cover the pot. Cook until the rice is done, usually takes around 15-20 minutes.\n\n11. To make the optional sauce, combine the oyster sauce, soy sauce, cornstarch water, chicken broth, and sugar in a saucepan. Stir well and heat over medium heat until it thickens.\n\n12. Now, carve your chicken and serve it over the flavorful jasmine rice. Pour some of the optional sauce over the chicken if desired.\n\n13. Hainanese chicken rice can be served with some cucumber slices and fresh cilantro. Enjoy this comforting and delicious dish!\n\nNote: The timing may vary depending on the size of the chicken.",
    })

@app.route('/reviews/<string:foodaddr>', methods=['GET'])
def get_review(foodaddr):
    reviews = db.get(f"reviews:{foodaddr}".encode())
    if reviews:
        return jsonify({
            'reviews': json.loads(reviews.decode())
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

    reviews_key = f"reviews:{foodaddr}".encode()
    existing_reviews = db.get(reviews_key)
    if existing_reviews:
        reviews = json.loads(existing_reviews.decode())
    else:
        reviews = []

    reviews.append({"user_address": useraddr, "text": text})
    db.put(reviews_key, json.dumps(reviews).encode())

    return jsonify({
        'message': 'Success'
    }), 201

if __name__ == '__main__':
    app.run(debug=True)