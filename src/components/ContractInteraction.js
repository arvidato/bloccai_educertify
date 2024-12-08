import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

function ContractInteraction({ contracts, account }) {
  // State variables for form inputs
  const [status, setStatus] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [universityAddress, setUniversityAddress] = useState('');
  const [certificateHash, setCertificateHash] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [viewerAddress, setViewerAddress] = useState('');
  const [viewerDuration, setViewerDuration] = useState('');
  const [contractsReady, setContractsReady] = useState(false);

  // Additional state for Certificate Helper
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gpa, setGpa] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [courses, setCourses] = useState([]);

  // Additional state for Certificate Verifier
  const [requestId, setRequestId] = useState('');

  const [numberToConvert, setNumberToConvert] = useState('');

  useEffect(() => {
    if (contracts?.certificateHelper && 
        contracts?.certificateVerifier && 
        contracts?.educationCertificate) {
      setContractsReady(true);
    }
  }, [contracts]);

  // Helper function to handle transactions
  const handleTransaction = async (operation) => {
    if (!contractsReady) {
      setStatus('Contracts not properly initialized');
      return null;
    }
    try {
      setStatus(`Processing transaction...`);
      const result = await operation();
      setStatus(`Success: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      if (error.message.includes('User denied transaction signature')) {
        setStatus('Transaction cancelled by user');
        return null;
      }
      setStatus(`Error: ${error.message}`);
      return null;
    }
  };

  // EducationCertificate Contract Functions
  const authorizeUniversity = async () => {
    try {
      if (!universityAddress) {
        setStatus('Error: Please provide a university address');
        return;
      }
      if (!Web3.utils.isAddress(universityAddress)) {
        setStatus('Error: Invalid university address format');
        return;
      }
      const result = await handleTransaction(() =>
        contracts.educationCertificate.methods
          .authorizeUniversity(universityAddress)
          .send({ from: account })
      );
      if (result === null) {
        // Transaction was cancelled or failed
        return;
      }
    } catch (error) {
      if (error.message.includes('User denied transaction signature')) {
        setStatus('Transaction cancelled by user');
      } else {
        setStatus(`Error: ${error.message}`);
      }
    }
  };

  const revokeUniversity = async () => {
    try {
      if (!universityAddress) {
        setStatus('Error: Please provide a university address');
        return;
      }
      if (!Web3.utils.isAddress(universityAddress)) {
        setStatus('Error: Invalid university address format');
        return;
      }
      await handleTransaction(() =>
        contracts.educationCertificate.methods
          .revokeUniversity(universityAddress)
          .send({ from: account })
      );
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const issueCertificate = async () => {
    try {
      if (!studentAddress || !Web3.utils.isAddress(studentAddress)) {
        setStatus('Error: Invalid student address');
        return;
      }
      if (!certificateHash || !certificateType || !ipfsHash) {
        setStatus('Error: Please provide all certificate details');
        return;
      }
      const result = await handleTransaction(() =>
        contracts.educationCertificate.methods
          .issueCertificate(studentAddress, certificateHash, certificateType, ipfsHash)
          .send({ from: account })
      );
      if (result === null) {
        // Transaction was cancelled or failed
        return;
      }
    } catch (error) {
      if (error.message.includes('User denied transaction signature')) {
        setStatus('Transaction cancelled by user');
      } else {
        setStatus(`Error: ${error.message}`);
      }
    }
  };

  const revokeCertificate = async () => {
    await handleTransaction(() =>
      contracts.educationCertificate.methods
        .revokeCertificate(studentAddress, certificateHash)
        .send({ from: account })
    );
  };

  const authorizeViewer = async () => {
    try {
      if (!viewerAddress) {
        setStatus('Error: Please provide a viewer address');
        return;
      }
      if (!Web3.utils.isAddress(viewerAddress)) {
        setStatus('Error: Invalid viewer address format');
        return;
      }
      if (!certificateHash || !viewerDuration) {
        setStatus('Error: Please provide certificate hash and duration');
        return;
      }
      await handleTransaction(() =>
        contracts.educationCertificate.methods
          .authorizeViewer(certificateHash, viewerAddress, viewerDuration)
          .send({ from: account })
      );
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const getStudentCertificates = async () => {
    try {
      if (!studentAddress) {
        setStatus('Error: Please provide a student address');
        return;
      }
      if (!Web3.utils.isAddress(studentAddress)) {
        setStatus('Error: Invalid student address format');
        return;
      }
      const result = await contracts.educationCertificate.methods
        .getStudentCertificates(studentAddress)
        .call();
      setStatus(`Student Certificates: ${JSON.stringify(result)}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  // CertificateVerifier Contract Functions
  const requestVerification = async () => {
    try {
      if (!studentAddress) {
        setStatus('Error: Please provide a student address');
        return;
      }
      if (!Web3.utils.isAddress(studentAddress)) {
        setStatus('Error: Invalid student address format');
        return;
      }
      if (!certificateHash) {
        setStatus('Error: Please provide a certificate hash');
        return;
      }
      await handleTransaction(() =>
        contracts.certificateVerifier.methods
          .requestVerification(studentAddress, certificateHash)
          .send({ from: account })
      );
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const getVerificationDetails = async () => {
    const result = await contracts.certificateVerifier.methods
      .getVerificationDetails(requestId)
      .call({ from: account });
    setStatus(`Verification Details: ${JSON.stringify(result)}`);
  };

  const getEmployerVerificationCount = async () => {
    const result = await contracts.certificateVerifier.methods
      .getEmployerVerificationCount()
      .call({ from: account });
    setStatus(`Verification Count: ${result}`);
  };

  const getVerificationRequestDetails = async () => {
    try {
      const result = await contracts.certificateVerifier.methods
        .verificationRequests(account, requestId)
        .call();
      setStatus(`Verification Request Details: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  // CertificateHelper Contract Functions
  const generateCertificateHash = async () => {
    const result = await contracts.certificateHelper.methods
      .generateCertificateHash(studentId, certificateType, Math.floor(Date.now() / 1000))
      .call();
    setStatus(`Generated Hash: ${result}`);
    setCertificateHash(result);
  };

  const createStudentDataJSON = async () => {
    const studentData = {
      studentName,
      studentId,
      courses,
      gpa,
      additionalInfo
    };
    
    const result = await contracts.certificateHelper.methods
      .createStudentDataJSON(studentData)
      .call();
    setStatus(`Generated JSON: ${result}`);
    setIpfsHash(result);
  };

  // Add/remove course to/from courses array
  const addCourse = () => {
    setCourses([...courses, {
      name: '',
      grade: '',
      completionDate: Math.floor(Date.now() / 1000),
      credits: ''
    }]);
  };

  // Additional EducationCertificate View Functions
  const isAuthorizedViewer = async () => {
    try {
      if (!studentAddress || !certificateHash || !viewerAddress) {
        setStatus('Error: Please provide student address, certificate hash, and viewer address');
        return;
      }
      
      const result = await contracts.educationCertificate.methods
        .isAuthorizedViewer(studentAddress, certificateHash, viewerAddress)
        .call();
      setStatus(`Is Authorized Viewer: ${result}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const getMyAllCertificates = async () => {
    try {
      const result = await contracts.educationCertificate.methods
        .getMyAllCertificates()
        .call({ from: account });
      
      // Convert all possible BigInt values to strings
      const processedResult = result.map(cert => ({
        certificateHash: cert.certificateHash,
        university: cert.university,
        issueDate: cert.issueDate.toString(),
        certificateType: cert.certificateType,
        isValid: cert.isValid,
        ipfsHash: cert.ipfsHash
      }));
      
      setStatus(`My Certificates: ${JSON.stringify(processedResult, null, 2)}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const getCertificateDetails = async () => {
    try {
      if (!studentAddress || !certificateHash) {
        setStatus('Error: Please provide both student address and certificate hash');
        return;
      }

      // Validate Ethereum address format
      if (!Web3.utils.isAddress(studentAddress)) {
        setStatus('Error: Invalid Ethereum address format');
        return;
      }

      const result = await contracts.educationCertificate.methods
        .getCertificateDetails(studentAddress, certificateHash)
        .call();
      
      // Convert any BigInt values in the result
      const processedResult = {
        certificateHash: result.certificateHash,
        university: result.university,
        issueDate: result.issueDate.toString(),
        certificateType: result.certificateType,
        isValid: result.isValid,
        ipfsHash: result.ipfsHash
      };
      
      setStatus(`Certificate Details: ${JSON.stringify(processedResult, null, 2)}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const getPrivateCertificateData = async () => {
    try {
      if (!studentAddress || !certificateHash) {
        setStatus('Error: Please provide both student address and certificate hash');
        return;
      }

      const result = await contracts.educationCertificate.methods
        .getPrivateCertificateData(studentAddress, certificateHash)
        .call({ from: account });
      setStatus(`Private Certificate Data: ${result}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  // CertificateHelper View Functions
  const toString = async (value) => {
    try {
      const result = await contracts.certificateHelper.methods
        .toString(value)
        .call();
      setStatus(`String Result: ${result}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const checkIsUniversity = async () => {
    try {
      const result = await contracts.educationCertificate.methods
        .authorizedUniversities(account)
        .call();
      setStatus(`Current account ${account} ${result ? 'is' : 'is not'} an authorized university`);
    } catch (error) {
      setStatus(`Error checking university status: ${error.message}`);
    }
  };

  return (
    <div className="contract-interaction">
      {!contractsReady ? (
        <div className="error-message">
          Contracts not properly initialized. Please check your connection.
        </div>
      ) : (
        <>
          <h2>Contract Interactions</h2>

          {/* University Management Section */}
          <div className="interaction-section">
            <h3>University Management</h3>
            <input
              type="text"
              placeholder="University Address"
              value={universityAddress}
              onChange={(e) => setUniversityAddress(e.target.value)}
            />
            <button onClick={authorizeUniversity}>Authorize University</button>
            <button onClick={revokeUniversity}>Revoke University</button>
            <button onClick={checkIsUniversity}>Check My University Status</button>
          </div>

          {/* Certificate Management Section */}
          <div className="interaction-section">
            <h3>Certificate Management</h3>
            <input
              type="text"
              placeholder="Student Address"
              value={studentAddress}
              onChange={(e) => setStudentAddress(e.target.value)}
            />
            <input
              type="text"
              placeholder="Certificate Hash"
              value={certificateHash}
              onChange={(e) => setCertificateHash(e.target.value)}
            />
            <input
              type="text"
              placeholder="Certificate Type"
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
            />
            <input
              type="text"
              placeholder="IPFS Hash"
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
            />
            <button onClick={issueCertificate}>Issue Certificate</button>
            <button onClick={revokeCertificate}>Revoke Certificate</button>
            <button onClick={getStudentCertificates}>Get Student Certificates</button>
          </div>

          {/* View Functions Section */}
          <div className="interaction-section">
            <h3>View Functions</h3>
            <input
              type="text"
              placeholder="Student Address"
              value={studentAddress}
              onChange={(e) => setStudentAddress(e.target.value)}
            />
            <input
              type="text"
              placeholder="Certificate Hash"
              value={certificateHash}
              onChange={(e) => setCertificateHash(e.target.value)}
            />
            <input
              type="text"
              placeholder="Viewer Address"
              value={viewerAddress}
              onChange={(e) => setViewerAddress(e.target.value)}
            />
            <button onClick={isAuthorizedViewer}>Check Authorized Viewer</button>
            <button onClick={getMyAllCertificates}>Get My Certificates</button>
            <button onClick={getCertificateDetails}>Get Certificate Details</button>
            <button onClick={getPrivateCertificateData}>Get Private Certificate Data</button>
          </div>

          {/* Verification Section */}
          <div className="interaction-section">
            <h3>Certificate Verification</h3>
            <input
              type="text"
              placeholder="Request ID"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            />
            <button onClick={requestVerification}>Request Verification</button>
            <button onClick={getVerificationDetails}>Get Verification Details</button>
            <button onClick={getEmployerVerificationCount}>Get Verification Count</button>
            <button onClick={getVerificationRequestDetails}>Get Request Details</button>
          </div>

          {/* Certificate Helper Section */}
          <div className="interaction-section">
            <h3>Certificate Helper</h3>
            <input
              type="text"
              placeholder="Student Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
            <input
              type="text"
              placeholder="GPA"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
            />
            <input
              type="text"
              placeholder="Additional Info"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
            <button onClick={addCourse}>Add Course</button>
            <button onClick={generateCertificateHash}>Generate Certificate Hash</button>
            <button onClick={createStudentDataJSON}>Create Student Data JSON</button>
            <input
              type="number"
              placeholder="Number to convert to string"
              value={numberToConvert}
              onChange={(e) => setNumberToConvert(e.target.value)}
            />
            <button onClick={() => toString(numberToConvert)}>Convert to String</button>
          </div>

          {/* Status Display */}
          <div className={`status ${
            status.includes('cancelled') || status.includes('denied') 
              ? 'cancelled-message' 
              : status.includes('Error') 
                ? 'error-message' 
                : ''
          }`}>
            <h4>Status:</h4>
            <pre>{status}</pre>
          </div>
        </>
      )}
    </div>
  );
}

export default ContractInteraction; 