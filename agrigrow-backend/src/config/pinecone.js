import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;

export async function initPinecone() {
  try {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    // Verify connection by listing indexes
    const indexes = await pineconeClient.listIndexes();
    console.log('✅ Pinecone connected successfully');
    console.log('Available indexes:', indexes);
    
    return pineconeClient;
  } catch (error) {
    console.error('❌ Pinecone initialization failed:', error.message);
    // Don't exit here - some features may work without Pinecone
  }
}

export function getPineconeClient() {
  if (!pineconeClient) {
    throw new Error('Pinecone client not initialized');
  }
  return pineconeClient;
}

export async function getIndex(indexName) {
  const client = getPineconeClient();
  return client.Index(indexName || process.env.PINECONE_INDEX_NAME);
}
