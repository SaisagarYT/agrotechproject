import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Scheme } from '../models/Scheme.js';
import { storeVectorsBatch } from '../services/vectorService.js';
import { initPinecone } from '../config/pinecone.js';

dotenv.config();

// Government Schemes Data
const schemesData = [
    {
        name: 'PM-KISAN',
        description: 'Pradhan Mantri Kisan Samman Nidhi - Direct income support of ₹6000 per year to farmer families',
        category: 'income',
        benefit: '₹6000 per year in 3 equal installments of ₹2000 each',
        eligibility: {
            farmerTypes: ['Small', 'Marginal', 'Medium'],
            minLand: 0,
            maxLand: 100,
            crops: [],
            regions: ['All India'],
            otherCriteria: ['Must have cultivable land', 'Aadhaar linked bank account required']
        },
        applicationDetails: {
            applyLink: 'https://pmkisan.gov.in/',
            documents: ['Aadhaar Card', 'Land Records', 'Bank Account Details'],
            processingTime: '2-3 months',
            authority: 'Ministry of Agriculture & Farmers Welfare'
        }
    },
    {
        name: 'PM Fasal Bima Yojana',
        description: 'Crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities',
        category: 'insurance',
        benefit: 'Insurance coverage at 2% premium for Kharif, 1.5% for Rabi, and 5% for commercial crops',
        eligibility: {
            farmerTypes: ['Small', 'Marginal', 'Medium', 'Large'],
            minLand: 0.1,
            maxLand: 500,
            crops: ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Pulses', 'Oilseeds'],
            regions: ['All India'],
            otherCriteria: ['Loanee farmers are automatically covered', 'Non-loanee farmers can opt-in']
        },
        applicationDetails: {
            applyLink: 'https://pmfby.gov.in/',
            documents: ['Land Records', 'Bank Account', 'Aadhaar Card', 'Crop Sowing Certificate'],
            processingTime: '2 weeks for enrollment',
            authority: 'Ministry of Agriculture & Farmers Welfare'
        }
    },
    {
        name: 'Kisan Credit Card (KCC)',
        description: 'Provides farmers with affordable credit for agricultural needs including crop production and maintenance',
        category: 'loan',
        benefit: 'Credit limit up to ₹3 lakh at 4% interest rate (with subvention)',
        eligibility: {
            farmerTypes: ['Small', 'Marginal', 'Medium', 'Large'],
            minLand: 0.1,
            maxLand: 500,
            crops: [],
            regions: ['All India'],
            otherCriteria: ['Must own or lease agricultural land', 'Good credit history preferred']
        },
        applicationDetails: {
            applyLink: 'Apply at any bank branch',
            documents: ['Land Documents', 'Identity Proof', 'Address Proof', 'Passport Photo'],
            processingTime: '15-30 days',
            authority: 'NABARD / Commercial Banks'
        }
    },
    {
        name: 'Soil Health Card Scheme',
        description: 'Free soil testing and health cards to farmers with crop-wise recommendations for nutrients and fertilizers',
        category: 'subsidy',
        benefit: 'Free soil testing every 2 years with customized recommendations',
        eligibility: {
            farmerTypes: ['Small', 'Marginal', 'Medium', 'Large'],
            minLand: 0,
            maxLand: 1000,
            crops: [],
            regions: ['All India'],
            otherCriteria: ['Any farmer with agricultural land']
        },
        applicationDetails: {
            applyLink: 'https://soilhealth.dac.gov.in/',
            documents: ['Land Details', 'Aadhaar Card'],
            processingTime: '2-4 weeks',
            authority: 'Department of Agriculture'
        }
    },
    {
        name: 'National Mission on Sustainable Agriculture (NMSA)',
        description: 'Promotes sustainable agriculture through climate change adaptation strategies and resource conservation',
        category: 'subsidy',
        benefit: 'Subsidy up to 50% for micro-irrigation, organic farming inputs, and soil conservation',
        eligibility: {
            farmerTypes: ['Small', 'Marginal'],
            minLand: 0.1,
            maxLand: 5,
            crops: [],
            regions: ['All India'],
            otherCriteria: ['Priority to SC/ST farmers', 'Must adopt sustainable practices']
        },
        applicationDetails: {
            applyLink: 'https://nmsa.dac.gov.in/',
            documents: ['Land Records', 'Caste Certificate (if applicable)', 'Bank Account'],
            processingTime: '1-2 months',
            authority: 'Ministry of Agriculture'
        }
    },
    {
        name: 'PM Krishi Sinchai Yojana',
        description: 'Micro-irrigation and water conservation scheme - "Har Khet Ko Paani"',
        category: 'subsidy',
        benefit: '55% subsidy for small/marginal farmers, 45% for others on drip/sprinkler systems',
        eligibility: {
            farmerTypes: ['Small', 'Marginal', 'Medium'],
            minLand: 0.2,
            maxLand: 10,
            crops: [],
            regions: ['All India'],
            otherCriteria: ['Must have water source', 'Land should be suitable for micro-irrigation']
        },
        applicationDetails: {
            applyLink: 'https://pmksy.gov.in/',
            documents: ['Land Records', '7/12 Extract', 'Bank Account', 'Water Source Proof'],
            processingTime: '2-3 months',
            authority: 'Ministry of Jal Shakti & Agriculture'
        }
    },
    {
        name: 'National Food Security Mission',
        description: 'Increases production and productivity of rice, wheat, pulses, and coarse cereals',
        category: 'subsidy',
        benefit: 'Subsidized seeds, demonstrations, farm machinery assistance',
        eligibility: {
            farmerTypes: ['Small', 'Marginal', 'Medium'],
            minLand: 0.5,
            maxLand: 20,
            crops: ['Rice', 'Wheat', 'Pulses', 'Coarse Cereals'],
            regions: ['All India'],
            otherCriteria: ['Must grow covered crops']
        },
        applicationDetails: {
            applyLink: 'Apply through State Agriculture Department',
            documents: ['Land Records', 'Crop Details', 'Bank Account'],
            processingTime: '1 month',
            authority: 'Ministry of Agriculture'
        }
    },
    {
        name: 'eNAM (National Agriculture Market)',
        description: 'Online trading platform for agricultural commodities ensuring better prices for farmers',
        category: 'training',
        benefit: 'Access to nationwide buyers, transparent pricing, online payment',
        eligibility: {
            farmerTypes: ['Small', 'Marginal', 'Medium', 'Large'],
            minLand: 0,
            maxLand: 1000,
            crops: [],
            regions: ['All India'],
            otherCriteria: ['Must register on eNAM portal']
        },
        applicationDetails: {
            applyLink: 'https://enam.gov.in/',
            documents: ['Aadhaar Card', 'Bank Account', 'Mobile Number'],
            processingTime: 'Instant registration',
            authority: 'Ministry of Agriculture'
        }
    },
    {
        name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
        description: 'Promotes organic farming through cluster approach and certification support',
        category: 'subsidy',
        benefit: '₹50,000 per hectare over 3 years for organic inputs and certification',
        eligibility: {
            farmerTypes: ['Small', 'Marginal'],
            minLand: 0.4,
            maxLand: 2,
            crops: [],
            regions: ['All India'],
            otherCriteria: ['Must commit to organic farming for 3 years', 'Cluster-based approach']
        },
        applicationDetails: {
            applyLink: 'Apply through Regional Council for Organic Farming',
            documents: ['Land Records', 'Commitment Letter', 'Bank Account'],
            processingTime: '2-3 months',
            authority: 'Ministry of Agriculture'
        }
    },
    {
        name: 'Agriculture Infrastructure Fund',
        description: 'Medium to long term loan financing for post-harvest management infrastructure',
        category: 'loan',
        benefit: '3% interest subvention on loans up to ₹2 crore',
        eligibility: {
            farmerTypes: ['Medium', 'Large'],
            minLand: 2,
            maxLand: 500,
            crops: [],
            regions: ['All India'],
            otherCriteria: ['For warehouses, cold storage, processing units']
        },
        applicationDetails: {
            applyLink: 'https://agriinfra.dac.gov.in/',
            documents: ['Project Report', 'Land Documents', 'Business Plan'],
            processingTime: '1-2 months',
            authority: 'Ministry of Agriculture'
        }
    }
];

// Treatment data for RAG
const treatmentsData = [
    {
        id: 'tomato-blight-1',
        text: 'Late Blight in Tomato: Caused by Phytophthora infestans. Symptoms include dark brown lesions on leaves and stems. Treatment: Apply Mancozeb 75% WP at 2.5g/L or Metalaxyl + Mancozeb at 2g/L. Spray at 7-10 day intervals. Organic alternative: Bordeaux mixture (1%) or copper oxychloride. Prevention: Avoid overhead irrigation, ensure good air circulation, remove infected plants.',
        metadata: { cropName: 'tomato', diseaseType: 'fungal', severity: 'High' }
    },
    {
        id: 'tomato-wilt-1',
        text: 'Fusarium Wilt in Tomato: Caused by Fusarium oxysporum. Symptoms include yellowing of lower leaves, wilting during day, recovery at night. Treatment: Soil drenching with Carbendazim 50% WP at 1g/L. Use resistant varieties. Organic alternative: Trichoderma viride soil application at 2.5kg/ha. Prevention: Crop rotation, avoid waterlogging, use disease-free seedlings.',
        metadata: { cropName: 'tomato', diseaseType: 'fungal', severity: 'High' }
    },
    {
        id: 'rice-blast-1',
        text: 'Rice Blast: Caused by Magnaporthe oryzae. Symptoms include diamond-shaped lesions on leaves, neck rot. Treatment: Tricyclazole 75% WP at 0.6g/L or Isoprothiolane at 1.5ml/L. Apply at tillering and boot stages. Organic alternative: Pseudomonas fluorescens spray. Prevention: Balanced nitrogen fertilization, resistant varieties, proper spacing.',
        metadata: { cropName: 'rice', diseaseType: 'fungal', severity: 'High' }
    },
    {
        id: 'cotton-bollworm-1',
        text: 'Cotton Bollworm (Helicoverpa armigera): Major pest causing boll damage. Symptoms include holes in bolls, frass on plants. Treatment: Emamectin benzoate 5% SG at 0.4g/L or Spinosad 45% SC at 0.3ml/L. Organic alternative: Neem oil 5%, Bt formulations, pheromone traps. Prevention: Early sowing, trap crops, regular monitoring.',
        metadata: { cropName: 'cotton', diseaseType: 'pest', severity: 'High' }
    },
    {
        id: 'wheat-rust-1',
        text: 'Wheat Rust (Yellow/Brown/Black): Caused by Puccinia species. Symptoms include orange-brown pustules on leaves and stems. Treatment: Propiconazole 25% EC at 1ml/L or Tebuconazole at 1ml/L. Two sprays at 15 days interval. Prevention: Resistant varieties, early sowing, avoid late nitrogen application.',
        metadata: { cropName: 'wheat', diseaseType: 'fungal', severity: 'Medium' }
    },
    {
        id: 'potato-blight-1',
        text: 'Potato Late Blight: Caused by Phytophthora infestans. Symptoms include water-soaked lesions on leaves, white fungal growth. Treatment: Cymoxanil + Mancozeb at 3g/L or Dimethomorph at 1g/L. Spray every 5-7 days during humid conditions. Organic alternative: Copper hydroxide. Prevention: Certified seed, proper drainage, destroy crop debris.',
        metadata: { cropName: 'potato', diseaseType: 'fungal', severity: 'High' }
    },
    {
        id: 'onion-thrips-1',
        text: 'Onion Thrips: Tiny insects causing silvery patches on leaves. Treatment: Fipronil 5% SC at 1ml/L or Spinosad at 0.3ml/L. Organic alternative: Neem oil spray, blue sticky traps. Prevention: Overhead irrigation, clean cultivation, remove weed hosts.',
        metadata: { cropName: 'onion', diseaseType: 'pest', severity: 'Medium' }
    },
    {
        id: 'sugarcane-borer-1',
        text: 'Sugarcane Stem Borer: Larvae bore into stems causing deadhearts. Treatment: Chlorantraniliprole at 0.4ml/L or Cartap hydrochloride. Release Trichogramma parasitoids. Organic alternative: Light traps, removing affected tillers. Prevention: Detrash crop, hot water treatment of setts.',
        metadata: { cropName: 'sugarcane', diseaseType: 'pest', severity: 'High' }
    },
    {
        id: 'chilli-leaf-curl-1',
        text: 'Chilli Leaf Curl Virus: Transmitted by whiteflies. Symptoms include upward curling and puckering of leaves. Treatment: Control whiteflies with Imidacloprid at 0.3ml/L. Remove infected plants. Organic alternative: Neem oil, yellow sticky traps. Prevention: Resistant varieties, avoid whitefly host plants nearby.',
        metadata: { cropName: 'chilli', diseaseType: 'viral', severity: 'Medium' }
    },
    {
        id: 'mango-anthracnose-1',
        text: 'Mango Anthracnose: Caused by Colletotrichum gloeosporioides. Symptoms include black spots on fruits, blossom blight. Treatment: Carbendazim 50% WP at 1g/L or Thiophanate methyl. Spray before flowering and at fruit development. Organic alternative: Bordeaux mixture. Prevention: Prune dead wood, avoid wetting foliage.',
        metadata: { cropName: 'mango', diseaseType: 'fungal', severity: 'Medium' }
    }
];

async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Initialize Pinecone
        try {
            await initPinecone();
            console.log('✅ Connected to Pinecone\n');
        } catch (pineconeError) {
            console.log('⚠️ Pinecone initialization failed, continuing with DB seeding only\n');
        }

        // Seed Government Schemes
        console.log('📝 Seeding Government Schemes...');
        for (const schemeData of schemesData) {
            try {
                const existingScheme = await Scheme.findOne({ name: schemeData.name });
                if (existingScheme) {
                    console.log(`   ⏭️  Scheme "${schemeData.name}" already exists, skipping`);
                } else {
                    const scheme = new Scheme(schemeData);
                    await scheme.save();
                    console.log(`   ✅ Added: ${schemeData.name}`);
                }
            } catch (err) {
                console.log(`   ❌ Error adding ${schemeData.name}: ${err.message}`);
            }
        }
        console.log('');

        // Seed Schemes to Pinecone for RAG
        console.log('🔍 Storing schemes in vector database...');
        try {
            const schemeVectors = schemesData.map((scheme, idx) => ({
                id: `scheme-${idx + 1}`,
                text: `${scheme.name}: ${scheme.description}. Category: ${scheme.category}. Benefit: ${scheme.benefit}. Eligible crops: ${scheme.eligibility.crops.join(', ') || 'All crops'}. Regions: ${scheme.eligibility.regions.join(', ')}. Land range: ${scheme.eligibility.minLand}-${scheme.eligibility.maxLand} acres.`,
                metadata: {
                    name: scheme.name,
                    category: scheme.category,
                    type: 'scheme'
                }
            }));
            await storeVectorsBatch(schemeVectors, 'schemes');
            console.log('   ✅ Schemes stored in vector DB\n');
        } catch (vectorError) {
            console.log(`   ⚠️ Vector storage failed: ${vectorError.message}\n`);
        }

        // Seed Treatments to Pinecone for RAG
        console.log('🔍 Storing treatments in vector database...');
        try {
            await storeVectorsBatch(treatmentsData, 'treatments');
            console.log('   ✅ Treatments stored in vector DB\n');
        } catch (vectorError) {
            console.log(`   ⚠️ Vector storage failed: ${vectorError.message}\n`);
        }

        console.log('✅ Database seeding completed!\n');
        console.log('Summary:');
        console.log(`   - ${schemesData.length} government schemes`);
        console.log(`   - ${treatmentsData.length} crop treatments for RAG`);
        console.log('');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('📤 Database connection closed');
        process.exit(0);
    }
}

// Run seeding
seedDatabase();
