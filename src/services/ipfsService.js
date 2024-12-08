import axios from 'axios';

export class IPFSService {
  constructor(pinataApiKey, pinataSecretKey) {
    this.pinataApi = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey
      }
    });
  }

  async uploadMetadata(studentData) {
    try {
      const metadata = {
        name: `Certificate for ${studentData.studentName}`,
        description: `Academic certificate issued to ${studentData.studentId}`,
        attributes: {
          studentName: studentData.studentName,
          studentId: studentData.studentId,
          courses: studentData.courses,
          gpa: studentData.gpa,
          additionalInfo: studentData.additionalInfo
        }
      };

      const response = await this.pinataApi.post('/pinning/pinJSONToIPFS', metadata);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }
} 