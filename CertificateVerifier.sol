// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EducationCertificate.sol";

contract CertificateVerifier {
    IEducationCertificate public certificateContract;
    
    struct VerificationRequest {
        address student;
        address employer;
        string certificateHash;
        bool isVerified;
        uint256 timestamp;
        bool exists;
        address issuingUniversity;
        uint256 issueDate;
    }
    
    mapping(address => mapping(uint256 => VerificationRequest)) public verificationRequests;
    mapping(address => uint256) public employerRequestCount;
    
    event VerificationRequested(
        address indexed employer,
        address indexed student,
        string certificateHash,
        uint256 requestId
    );
    
    event VerificationCompleted(
        address indexed employer,
        address indexed student,
        string certificateHash,
        bool isValid,
        address issuingUniversity,
        uint256 issueDate,
        string reason,
        uint256 requestId
    );
    
    event VerificationFailed(
        address indexed employer,
        address indexed student,
        string certificateHash,
        string reason,
        uint256 requestId
    );
    
    constructor(address _certificateContract) {
        require(_certificateContract != address(0), "Invalid certificate contract address");
        certificateContract = IEducationCertificate(_certificateContract);
    }
    
    function requestVerification(
        address _student,
        string calldata _certificateHash
    ) external returns (uint256 requestId) {
        require(_student != address(0), "Invalid student address");
        require(bytes(_certificateHash).length > 0, "Invalid certificate hash");
        
        requestId = employerRequestCount[msg.sender]++;
        
        VerificationRequest memory newRequest = VerificationRequest({
            student: _student,
            employer: msg.sender,
            certificateHash: _certificateHash,
            isVerified: false,
            timestamp: block.timestamp,
            exists: false,
            issuingUniversity: address(0),
            issueDate: 0
        });
        
        verificationRequests[msg.sender][requestId] = newRequest;
        
        emit VerificationRequested(
            msg.sender,
            _student,
            _certificateHash,
            requestId
        );
        
        _verifyCertificate(requestId);
        
        return requestId;
    }
    
    function _verifyCertificate(uint256 _requestId) internal {
        VerificationRequest storage request = verificationRequests[msg.sender][_requestId];
        
        try certificateContract.getCertificateDetails(
            request.student,
            request.certificateHash
        ) returns (
            string memory,
            address university,
            uint256 issueDate,
            string memory,
            bool isValid,
            string memory
        ) {
            bool isUniversityAuthorized = certificateContract.authorizedUniversities(university);
            
            if (!isValid) {
                emit VerificationFailed(
                    request.employer,
                    request.student,
                    request.certificateHash,
                    "Certificate is not valid or has been revoked",
                    _requestId
                );
                return;
            }
            
            request.isVerified = true;
            request.exists = true;
            request.issuingUniversity = university;
            request.issueDate = issueDate;
            
            emit VerificationCompleted(
                request.employer,
                request.student,
                request.certificateHash,
                isUniversityAuthorized,
                university,
                issueDate,
                "Certificate is valid",
                _requestId
            );
            
        } catch {
            emit VerificationFailed(
                request.employer,
                request.student,
                request.certificateHash,
                "Certificate does not exist",
                _requestId
            );
        }
    }
    
    function getVerificationDetails(
        uint256 _requestId
    ) external view returns (
        address student,
        string memory certificateHash,
        bool isVerified,
        bool exists,
        address issuingUniversity,
        uint256 issueDate,
        bool isUniversityAuthorized
    ) {
        VerificationRequest memory request = verificationRequests[msg.sender][_requestId];
        require(request.timestamp != 0, "Verification request does not exist");
        
        bool universityAuthorized = false;
        if (request.issuingUniversity != address(0)) {
            universityAuthorized = certificateContract.authorizedUniversities(request.issuingUniversity);
        }
        
        return (
            request.student,
            request.certificateHash,
            request.isVerified,
            request.exists,
            request.issuingUniversity,
            request.issueDate,
            universityAuthorized
        );
    }
    
    function getEmployerVerificationCount() external view returns (uint256) {
        return employerRequestCount[msg.sender];
    }
} 