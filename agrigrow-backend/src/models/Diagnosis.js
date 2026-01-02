import mongoose from 'mongoose';

const diagnosisSchema = new mongoose.Schema({
  farmerId: mongoose.Schema.Types.ObjectId,
  cropName: { type: String, required: true },
  inputType: { type: String, enum: ['image', 'text', 'voice'], required: true },
  detectedDisease: {
    name: String,
    severity: String,
    confidence: Number
  },
  treatment: mongoose.Schema.Types.Mixed,
  imageUrl: String,
  transcript: String,
  generatedAdvice: String,
  timestamp: { type: Date, default: Date.now }
});

export const Diagnosis = mongoose.model('Diagnosis', diagnosisSchema);
