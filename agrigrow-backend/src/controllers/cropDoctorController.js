// Crop Doctor Controller
import { generateCropDiseaseUsingImage, generateDiseaseUsingContext } from '../services/cropDoctorService.js';
import { queryTreatments } from '../services/vectorService.js';

const cropDoctorImageToText = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "Image file is required" 
            });
        }
        
        const response = await generateCropDiseaseUsingImage(req.file.buffer, req.file.mimetype);
        
        if (!response) {
            return res.status(400).json({ 
                success: false, 
                message: "No response from the AI" 
            });
        }
        
        // Try to get additional treatments from RAG if disease identified
        let ragTreatments = [];
        if (response.name && response.cropName) {
            try {
                ragTreatments = await queryTreatments(
                    `${response.name} ${response.symptoms?.join(' ') || ''}`,
                    response.cropName
                );
            } catch (ragError) {
                console.log('RAG query failed:', ragError.message);
            }
        }
        
        return res.status(200).json({
            success: true,
            data: response,
            additionalTreatments: ragTreatments
        });
    } catch (err) {
        console.error('Image analysis error:', err);
        return res.status(500).json({
            success: false,
            error: {
                status: 500,
                message: err.message
            }
        });
    }
};

const cropDoctorTextGeneration = async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ 
            success: false, 
            message: "Query is required" 
        });
    }
    
    try {
        const response = await generateDiseaseUsingContext(query);
        
        if (!response) {
            return res.status(400).json({ 
                success: false, 
                message: "No response from AI" 
            });
        }
        
        // Check if there's an error in the response
        if (response.error) {
            return res.status(response.error.status || 400).json({
                success: false,
                error: response.error
            });
        }
        
        return res.status(200).json({
            success: true,
            data: response
        });
    } catch (err) {
        console.error('Text generation error:', err);
        return res.status(500).json({
            success: false,
            error: {
                status: 500,
                message: err.message
            }
        });
    }
};

const cropDoctorVoiceGeneration = async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ 
            success: false, 
            message: "Query is required" 
        });
    }
    
    try {
        const response = await generateDiseaseUsingContext(query);
        
        if (!response) {
            return res.status(400).json({ 
                success: false, 
                message: "No response from AI" 
            });
        }
        
        return res.status(200).json({
            success: true,
            data: response
        });
    } catch (err) {
        console.error('Voice generation error:', err);
        return res.status(500).json({
            success: false,
            error: {
                status: 500,
                message: err.message
            }
        });
    }
};

export { cropDoctorImageToText, cropDoctorTextGeneration, cropDoctorVoiceGeneration };