# Environment Variables Setup

## FAL API Key Configuration

The Wisdom Pixels app uses FAL.ai for image generation. You need to configure your FAL API key in the `.env` file.

### Backend (Required for Card Generation Workflow)

The backend tools and workflows need access to the FAL API key. Add one of these to your `.env` file:

```bash
# Option 1 (recommended)
FAL_KEY=your_fal_api_key_here

# Option 2 (also supported)
FALAI_API_KEY=your_fal_api_key_here
```

The backend `image-generation-tool` will automatically check for both `FAL_KEY` and `FALAI_API_KEY`.

### Frontend (Optional - for Image Generator Tab)

If you want to use the standalone Image Generator tab in the Brand Dashboard UI, you need to expose the FAL key to the frontend using Vite's environment variable system:

```bash
# Frontend FAL API Key (must be prefixed with VITE_)
VITE_FALAI_API_KEY=your_fal_api_key_here
```

**Important:** Only variables prefixed with `VITE_` are exposed to the frontend. Never expose sensitive keys this way in production - use backend API endpoints instead.

### Complete .env Example

```bash
# AI Model Keys
OPENAI_API_KEY=your_openai_key
# OR
ANTHROPIC_API_KEY=your_anthropic_key

# FAL.ai Image Generation (Backend)
FAL_KEY=your_fal_key
# OR
FALAI_API_KEY=your_fal_key

# FAL.ai Image Generation (Frontend - Optional)
VITE_FALAI_API_KEY=your_fal_key

# API Configuration
VITE_MASTRA_API_URL=http://localhost:4111
```

## Getting Your FAL API Key

1. Visit [fal.ai](https://fal.ai)
2. Sign up for a free account
3. Navigate to your API keys section
4. Copy your API key
5. Add it to your `.env` file

## Verification

After setting up your `.env` file:

1. **Backend workflows**: The CardGenerationWorkflow will automatically use the FAL key from env
2. **Frontend Image Generator**: If you added `VITE_FALAI_API_KEY`, the Image Generator tab will work without asking for a key
3. **No VITE_ key**: The Image Generator tab will show an error message asking you to add the key to `.env`

## Security Notes

- ✅ **Backend keys** (`FAL_KEY`, `FALAI_API_KEY`): Safe - never exposed to browser
- ⚠️ **Frontend keys** (`VITE_FALAI_API_KEY`): Exposed in browser - only use for development/demos
- 🔒 **Production**: Always use backend API endpoints, never expose API keys to frontend

