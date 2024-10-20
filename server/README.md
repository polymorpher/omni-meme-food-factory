# Image Processing API

This project provides an API for processing images, including generating images using OpenAI's DALL-E and uploading images from URLs to Google Cloud Storage.

## Setup Instructions

Follow these steps to set up and run the project:

1. **Set up environment variables**

   Create a `.env` file in the root directory of the project and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Replace `your_openai_api_key_here` with your actual OpenAI API key.

2. **Install dependencies**

   Run the following command to install the required Python packages:

   ```
   // optional for creating a vertual env
   python3 -m venv myenv
   source myenv/bin/activate

   pip install "Flask[async]" Flask-CORS openai google-cloud-storage python-dotenv aiohttp aiofiles hypercorn eth-utils
   ```

3. **Authenticate with Google Cloud**

   If you haven't already, authenticate with Google Cloud using the following command:

   ```
   gcloud auth login
   ```

   Follow the prompts to log in to your Google Cloud account.

4. **Set up Google Cloud project**

   Make sure you have a Google Cloud project set up with the necessary APIs enabled (like Cloud Storage). Set your project ID in your environment or in the code.

## Running the Application

After completing the setup, you can run the application using:

```
hypercorn image_gen:app
```

## API Endpoints

### Generate and Upload Image

Generates an image using DALL-E and initiates an upload to Google Cloud Storage.

#### Endpoint: `/generate-and-upload`

#### Method: POST

#### Request Body:

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| prompt | string | The description of the image to generate | "a white siamese cat" |
| size | string | The size of the image to generate | "1024x1024" |
| quality | string | The quality of the image | "standard" |
| n | integer | The number of images to generate | 1 |
| response_format | string | The format of the response from DALL-E API | "url" |

#### Example Requests:

1. URL response format:

```json
{
  "prompt": "A futuristic cityscape with flying cars and neon lights",
  "size": "1024x1024",
  "quality": "standard",
  "n": 1,
  "response_format": "url"
}
```

2. b64_json response format:

```json
{
  "prompt": "A serene landscape with mountains and a lake at sunset",
  "size": "1024x1024",
  "quality": "standard",
  "n": 1,
  "response_format": "b64_json"
}
```

#### Response:

Both request types will receive the same response structure:

```json
{
  "message": "Image generated successfully. Upload started.",
  "url_path": "https://storage.cloud.google.com/omni-meme-food-factory/unique-filename.png"
}
```

- `message`: A status message indicating that the image generation was successful and the upload process has begun.
- `url_path`: The Google Cloud Storage path where the image will be stored once the upload is complete.
