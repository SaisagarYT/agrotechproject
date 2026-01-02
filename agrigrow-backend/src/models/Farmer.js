import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  location: {
    state: String,
    district: String,
    village: String
  },
  farmDetails: {
    totalArea: Number,
    areaUnit: { type: String, enum: ['acres', 'hectares'], default: 'acres' },
    cropTypes: [String],
    farmerType: { type: String, enum: ['marginal', 'small', 'medium', 'large'] }
  },
  diagnosisHistory: [{
    cropName: String,
    diseaseName: String,
    severity: String,
    treatment: mongoose.Schema.Types.Mixed,
    imageUrl: String,
    timestamp: { type: Date, default: Date.now }
  }],
  savedSchemes: [mongoose.Schema.Types.ObjectId],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Farmer = mongoose.model('Farmer', farmerSchema);
