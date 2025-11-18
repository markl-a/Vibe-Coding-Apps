import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
  };
}

/**
 * Upload file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: file.name,
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', options);

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data`,
        pinata_api_key: PINATA_API_KEY!,
        pinata_secret_api_key: PINATA_SECRET_KEY!,
      },
    });

    return `ipfs://${res.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  try {
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          pinata_api_key: PINATA_API_KEY!,
          pinata_secret_api_key: PINATA_SECRET_KEY!,
        },
      }
    );

    return `ipfs://${res.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
}

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(ipfsUri: string): string {
  if (!ipfsUri) return '';

  if (ipfsUri.startsWith('ipfs://')) {
    return `${PINATA_GATEWAY}${ipfsUri.replace('ipfs://', '')}`;
  }

  if (ipfsUri.startsWith('Qm') || ipfsUri.startsWith('baf')) {
    return `${PINATA_GATEWAY}${ipfsUri}`;
  }

  return ipfsUri;
}

/**
 * Fetch NFT metadata from IPFS
 */
export async function fetchNFTMetadata(tokenUri: string): Promise<NFTMetadata> {
  try {
    const url = ipfsToHttp(tokenUri);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
}

/**
 * Generate AI-enhanced NFT description
 */
export async function generateNFTDescription(
  name: string,
  attributes: Array<{ trait_type: string; value: string | number }>
): Promise<string> {
  try {
    const response = await axios.post('/api/ai/generate-description', {
      name,
      attributes,
    });
    return response.data.description;
  } catch (error) {
    console.error('Error generating AI description:', error);
    return '';
  }
}

/**
 * Suggest NFT price based on similar NFTs
 */
export async function suggestNFTPrice(metadata: NFTMetadata): Promise<number> {
  try {
    const response = await axios.post('/api/ai/suggest-price', {
      metadata,
    });
    return response.data.suggestedPrice;
  } catch (error) {
    console.error('Error getting price suggestion:', error);
    return 0;
  }
}
