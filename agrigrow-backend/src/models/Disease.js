import mongoose from 'mongoose';

const diseaseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  cropName: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High'] },
  symptoms: [String],
  treatment: {
    fungicide: String,
    dosage: String,
    steps: [String],
    safetyNotes: [String],
    source: String
  },
  organicAlternatives: {
    method: String,
    materials: [String],
    process: [String]
  },
  preventionMethods: [String],
  embeddingId: String,
  createdAt: { type: Date, default: Date.now }
});

export const Disease = mongoose.model('Disease', diseaseSchema);
