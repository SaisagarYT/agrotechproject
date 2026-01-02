import mongoose from 'mongoose';

const schemeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  category: { type: String, enum: ['income', 'insurance', 'subsidy', 'loan', 'training'] },
  benefit: String,
  eligibility: {
    farmerTypes: [String],
    minLand: Number,
    maxLand: Number,
    crops: [String],
    regions: [String],
    otherCriteria: [String]
  },
  applicationDetails: {
    applyLink: String,
    documents: [String],
    processingTime: String,
    authority: String
  },
  embeddingId: String,
  createdAt: { type: Date, default: Date.now }
});

export const Scheme = mongoose.model('Scheme', schemeSchema);
