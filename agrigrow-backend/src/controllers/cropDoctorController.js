// Crop Doctor Controller - to be implemented
import {generateCropDiseaseUsingImage,generateDiseaseUsingContext} from '../services/cropDoctorService.js';

const cropDoctorImageToText = async(req,res) =>{
    
    try{
        if(!req.file){
            return res.status(404).json({message:"File was not found!"});
        }
        const response = await generateCropDiseaseUsingImage(req.file.buffer,req.file.mimeType);
        if(!response){
            return res.status(400).json({message:"No response from the AI"});
        }
        return res.status(200).json(response);
    }
    catch(err){
        return res.status(500).json({Error:{
            status:500,
            message:err.message
        }})
    }
}

const cropDoctorTextGeneration = async(req,res) =>{
    const {query} = req.body;
    if(!query){
        return req.status(404).json({message:"User query was not found!"});
    }
    try{
        const response = await generateDiseaseUsingContext(query);
        if(!response){
            return res.status(400).json({message:"Resonse not found from AI"});
        }
        return res.status(200).json(response);
    }
    catch(err){
        return res.status(500).jsont({
            Error:{
                status:500,
                message:err.message
            }
        })
    }
}
const cropDoctorVoiceGeneration = async(req,res) =>{
    const {query} = req.body;
    if(!query){
        return req.status(404).json({message:"User query was not found!"});
    }
    try{
        const response = await generateDiseaseUsingContext(query);
        if(!response){
            return res.status(400).json({message:"Resonse not found from AI"});
        }
        return res.status(200).json(response);
    }
    catch(err){
        return res.status(500).jsont({
            Error:{
                status:500,
                message:err.message
            }
        })
    }
}



export {cropDoctorImageToText,cropDoctorTextGeneration};