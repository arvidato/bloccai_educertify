import axios from 'axios';

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY;

// Function to upload JSON metadata to IPFS via Pinata
export const uploadJSONToIPFS = async (jsonData) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    
    try {
        const response = await axios.post(
            url,
            jsonData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );
        
        return response.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading to IPFS via Pinata:", error);
        throw error;
    }
};

// Function to upload file to IPFS via Pinata
export const uploadFileToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    
    try {
        const response = await axios.post(
            url,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );
        
        return response.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw error;
    }
};

// Function to get content from IPFS
export const getFromIPFS = async (ipfsHash) => {
    try {
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching from IPFS:", error);
        throw error;
    }
}; 