import { GoogleGenAI } from '@google/genai';
import { getIndex } from '../config/pinecone.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate text embeddings using Gemini's embedding model
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
async function createEmbedding(text) {
    try {
        const result = await genAI.models.embedContent({
            model: 'text-embedding-004',
            contents: text
        });
        return result.embedding.values;
    } catch (error) {
        console.error('Embedding generation error:', error.message);
        throw new Error('Failed to generate embedding');
    }
}

/**
 * Store a vector in Pinecone with metadata
 * @param {string} id - Unique identifier for the vector
 * @param {string} text - Text content to embed
 * @param {Object} metadata - Additional metadata to store
 * @param {string} namespace - Optional namespace for organization
 */
async function storeVector(id, text, metadata = {}, namespace = 'default') {
    try {
        const embedding = await createEmbedding(text);
        const index = await getIndex();
        
        await index.namespace(namespace).upsert([{
            id: id,
            values: embedding,
            metadata: {
                text: text.substring(0, 1000), // Store truncated text for reference
                ...metadata,
                createdAt: new Date().toISOString()
            }
        }]);
        
        console.log(`✅ Vector stored: ${id} in namespace: ${namespace}`);
        return { id, namespace, success: true };
    } catch (error) {
        console.error('Vector storage error:', error.message);
        throw new Error('Failed to store vector');
    }
}

/**
 * Store multiple vectors in batch
 * @param {Array} items - Array of {id, text, metadata} objects
 * @param {string} namespace - Optional namespace
 */
async function storeVectorsBatch(items, namespace = 'default') {
    try {
        const vectors = await Promise.all(items.map(async (item) => {
            const embedding = await createEmbedding(item.text);
            return {
                id: item.id,
                values: embedding,
                metadata: {
                    text: item.text.substring(0, 1000),
                    ...item.metadata,
                    createdAt: new Date().toISOString()
                }
            };
        }));

        const index = await getIndex();
        
        // Batch upsert in chunks of 100
        const chunkSize = 100;
        for (let i = 0; i < vectors.length; i += chunkSize) {
            const chunk = vectors.slice(i, i + chunkSize);
            await index.namespace(namespace).upsert(chunk);
        }
        
        console.log(`✅ Batch stored: ${vectors.length} vectors in namespace: ${namespace}`);
        return { count: vectors.length, namespace, success: true };
    } catch (error) {
        console.error('Batch storage error:', error.message);
        throw new Error('Failed to store vectors in batch');
    }
}

/**
 * Query Pinecone for similar vectors
 * @param {string} queryText - Text to search for
 * @param {number} topK - Number of results to return
 * @param {string} namespace - Namespace to search in
 * @param {Object} filter - Optional metadata filter
 * @returns {Promise<Array>} - Array of matches with scores and metadata
 */
async function queryVectors(queryText, topK = 5, namespace = 'default', filter = null) {
    try {
        const embedding = await createEmbedding(queryText);
        const index = await getIndex();
        
        const queryOptions = {
            vector: embedding,
            topK: topK,
            includeMetadata: true
        };
        
        if (filter) {
            queryOptions.filter = filter;
        }
        
        const results = await index.namespace(namespace).query(queryOptions);
        
        return results.matches.map(match => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata
        }));
    } catch (error) {
        console.error('Vector query error:', error.message);
        throw new Error('Failed to query vectors');
    }
}

/**
 * Query for crop disease treatments using RAG
 * @param {string} diseaseQuery - Disease or symptom description
 * @param {string} cropName - Optional crop name filter
 * @returns {Promise<Array>} - Relevant treatment information
 */
async function queryTreatments(diseaseQuery, cropName = null) {
    const filter = cropName ? { cropName: cropName } : null;
    return queryVectors(diseaseQuery, 5, 'treatments', filter);
}

/**
 * Query for government schemes using RAG
 * @param {Object} farmerProfile - Farmer details for matching
 * @returns {Promise<Array>} - Matching schemes
 */
async function querySchemes(farmerProfile) {
    const queryText = `Farmer with ${farmerProfile.landSize} acres in ${farmerProfile.region} growing ${farmerProfile.crops?.join(', ') || 'crops'}`;
    return queryVectors(queryText, 10, 'schemes');
}

/**
 * Delete vectors by IDs
 * @param {Array<string>} ids - Array of vector IDs to delete
 * @param {string} namespace - Namespace
 */
async function deleteVectors(ids, namespace = 'default') {
    try {
        const index = await getIndex();
        await index.namespace(namespace).deleteMany(ids);
        console.log(`✅ Deleted ${ids.length} vectors from namespace: ${namespace}`);
        return { deleted: ids.length, success: true };
    } catch (error) {
        console.error('Vector deletion error:', error.message);
        throw new Error('Failed to delete vectors');
    }
}

/**
 * Delete all vectors in a namespace
 * @param {string} namespace - Namespace to clear
 */
async function deleteAllVectors(namespace = 'default') {
    try {
        const index = await getIndex();
        await index.namespace(namespace).deleteAll();
        console.log(`✅ Deleted all vectors from namespace: ${namespace}`);
        return { namespace, success: true };
    } catch (error) {
        console.error('Namespace deletion error:', error.message);
        throw new Error('Failed to delete namespace vectors');
    }
}

export {
    createEmbedding,
    storeVector,
    storeVectorsBatch,
    queryVectors,
    queryTreatments,
    querySchemes,
    deleteVectors,
    deleteAllVectors
};
