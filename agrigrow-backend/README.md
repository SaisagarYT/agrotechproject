# AgroTech AI Backend

Backend API for the AgroTech AI Smart Crop Doctor & Government Scheme Finder system.

## Project Structure

```
src/
├── config/          # Configuration files (Database, Gemini, Pinecone)
├── routes/          # API route handlers
├── controllers/     # Business logic for routes
├── services/        # AI & database services
├── models/          # MongoDB schemas
├── utils/           # Helper functions (file upload, validators)
├── middleware/      # Express middleware
└── vectors/         # Vector DB operations & embeddings
```

## API Endpoints

### Crop Doctor
- `POST /api/crop-doctor/analyze-image` - Analyze crop disease from image
- `POST /api/crop-doctor/get-treatment` - Get treatment from RAG
- `GET /api/crop-doctor/history/:farmerId` - Get diagnosis history

### Government Schemes
- `POST /api/schemes/find-eligible` - Find eligible schemes
- `GET /api/schemes/all` - Get all schemes
- `GET /api/schemes/:schemeId` - Get scheme details

### Voice Assistance
- `POST /api/voice/transcribe` - Transcribe voice to text
- `POST /api/voice/get-response` - Get AI response to voice query

### Market Trends
- `GET /api/market/trends` - Get market trends
- `GET /api/market/crop/:cropName` - Get crop market analysis

### Farmer Management
- `POST /api/farmer/register` - Register farmer
- `GET /api/farmer/:farmerId` - Get farmer profile
- `PUT /api/farmer/:farmerId` - Update farmer profile

## Setup Instructions

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in API keys
3. Start development: `npm run dev`
4. Start production: `npm start`

## Features to Build

Features will be built incrementally as specified by the user.
