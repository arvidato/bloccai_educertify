import React, { useState } from 'react';
import { uploadJSONToIPFS, uploadFileToIPFS } from '../utils/pinataUtils';

function CertificateUpload({ contracts, account }) {
    const [status, setStatus] = useState('');

    const handleCertificateUpload = async (event) => {
        try {
            setStatus('Uploading to IPFS...');
            
            // Example certificate data
            const certificateData = {
                studentName: "John Doe",
                studentId: "12345",
                courses: [
                    {
                        name: "Computer Science 101",
                        grade: "A",
                        completionDate: Date.now(),
                        credits: "3"
                    }
                ],
                gpa: "3.8",
                additionalInfo: "Graduated with honors"
            };

            // Upload to IPFS
            const ipfsHash = await uploadJSONToIPFS(certificateData);
            setStatus('Uploaded to IPFS! Hash: ' + ipfsHash);

            // Issue certificate using smart contract
            await contracts.educationCertificate.methods
                .issueCertificate(
                    account,
                    "CERT-001", // certificate hash
                    "Bachelor's Degree",
                    ipfsHash
                )
                .send({ from: account });

            setStatus('Certificate issued successfully!');
            
        } catch (error) {
            console.error(error);
            setStatus('Error: ' + error.message);
        }
    };

    return (
        <div>
            <h2>Upload Certificate</h2>
            <button onClick={handleCertificateUpload}>
                Issue New Certificate
            </button>
            <p>{status}</p>
        </div>
    );
}

export default CertificateUpload; 