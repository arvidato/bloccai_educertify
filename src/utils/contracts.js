import Web3 from 'web3';
import EducationCertificate from '../contracts/EducationCertificate.json';
import CertificateHelper from '../contracts/CertificateHelper.json';
import CertificateVerifier from '../contracts/CertificateVerifier.json';

console.log('Loading contracts.js');

// Export the addresses so they can be imported by other files
export const EDUCATION_CERTIFICATE_ADDRESS = "0x031306e899ff12db21413e3fa64b22fc16cec3bc"; 
export const CERTIFICATE_HELPER_ADDRESS = "0x3281330e4b4c1b06c64dec7fb68411b0954d82d3";
export const CERTIFICATE_VERIFIER_ADDRESS = "0x5d726575647d00c462fbaa66ee85e1c06bead4e5";

export const getWeb3 = async () => {
  // Check if we're running in Remix IDE
  if (window.web3 && window.web3.currentProvider) {
    // Use the provider from Remix IDE
    const web3 = new Web3(window.web3.currentProvider);
    return web3;
  } 
  // Fallback to MetaMask/Web3 injection
  else if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return web3;
    } catch (error) {
      throw new Error("User denied account access");
    }
  }
  throw new Error("No Web3 provider detected. Please use Remix IDE or install MetaMask");
};

export const getContracts = async (web3) => {
  const educationCertificate = new web3.eth.Contract(
    EducationCertificate.abi,
    EDUCATION_CERTIFICATE_ADDRESS
  );

  const certificateHelper = new web3.eth.Contract(
    CertificateHelper.abi,
    CERTIFICATE_HELPER_ADDRESS
  );

  const certificateVerifier = new web3.eth.Contract(
    CertificateVerifier.abi,
    CERTIFICATE_VERIFIER_ADDRESS
  );

  return {
    educationCertificate,
    certificateHelper,
    certificateVerifier
  };
};

// Add this to check if an address is a university
export const isUniversity = async (web3, address) => {
  const contracts = await getContracts(web3);
  return await contracts.certificateHelper.methods.isUniversity(address).call();
}; 

export async function initializeContracts(web3) {
  try {
    // Get the network ID
    const networkId = await web3.eth.net.getId();
    
    // Get the deployed network from the contract JSON
    const deployedNetwork = EducationCertificate.networks[networkId];
    
    if (!deployedNetwork) {
      throw new Error('Contract not deployed to detected network');
    }

    // Create the contract instance
    const educationCertificate = new web3.eth.Contract(
      EducationCertificate.abi,
      deployedNetwork.address
    );

    return {
      educationCertificate
    };
  } catch (error) {
    console.error('Error initializing contracts:', error);
    return null;
  }
}