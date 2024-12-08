import { useState, useEffect } from 'react';
import { IPFSService } from '../services/ipfsService';

export function IssueCertificate({ contracts, account }) {
  const [pinataKeys, setPinataKeys] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [studentData, setStudentData] = useState({
    studentName: '',
    studentId: '',
    studentAddress: '',
    courses: [],
    gpa: '',
    additionalInfo: ''
  });
  const [isAuthorizedIssuer, setIsAuthorizedIssuer] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (contracts && account) {
        const isAuthorized = await contracts.educationCertificate.methods
          .authorizedIssuers(account)
          .call();
        setIsAuthorizedIssuer(isAuthorized);
      }
    };
    
    checkAuthorization();
  }, [contracts, account]);

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    
    try {
      const ipfsService = new IPFSService(pinataKeys.apiKey, pinataKeys.secretKey);

      // Generate certificate hash using helper contract
      const certificateHash = await contracts.certificateHelper.methods.generateCertificateHash(
        studentData.studentId,
        studentData.courses[0]?.name || "DEFAULT_COURSE",
        Date.now()
      ).call();

      // Upload to IPFS
      const ipfsHash = await ipfsService.uploadMetadata(studentData);

      // Issue certificate
      const tx = await contracts.educationCertificate.methods.issueCertificate(
        studentData.studentAddress,
        certificateHash,
        "Degree Certificate",
        ipfsHash
      ).send({ from: account });

      alert("Certificate issued successfully!");

      // Clear sensitive data
      setPinataKeys({ apiKey: '', secretKey: '' });
      
    } catch (error) {
      console.error('Error issuing certificate:', error);
      alert(`Failed to issue certificate: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Issue New Certificate</h2>
      
      {!isAuthorizedIssuer ? (
        <div className="error-message">
          You are not authorized to issue certificates
        </div>
      ) : (
        // Pinata Keys Form
        <div>
          <h3>Pinata Credentials</h3>
          <input
            type="password"
            placeholder="Pinata API Key"
            value={pinataKeys.apiKey}
            onChange={(e) => setPinataKeys(prev => ({...prev, apiKey: e.target.value}))}
          />
          <input
            type="password"
            placeholder="Pinata Secret Key"
            value={pinataKeys.secretKey}
            onChange={(e) => setPinataKeys(prev => ({...prev, secretKey: e.target.value}))}
          />
        </div>
      )}

      {/* Student Data Form */}
      <div>
        <h3>Student Information</h3>
        <input
          type="text"
          placeholder="Student Name"
          value={studentData.studentName}
          onChange={(e) => setStudentData(prev => ({...prev, studentName: e.target.value}))}
        />
        <input
          type="text"
          placeholder="Student ID"
          value={studentData.studentId}
          onChange={(e) => setStudentData(prev => ({...prev, studentId: e.target.value}))}
        />
        <input
          type="text"
          placeholder="Student Ethereum Address"
          value={studentData.studentAddress}
          onChange={(e) => setStudentData(prev => ({...prev, studentAddress: e.target.value}))}
        />
        {/* Add more fields for courses, GPA, etc. */}
      </div>

      <button onClick={handleIssueCertificate}>
        Issue Certificate
      </button>
    </div>
  );
} 