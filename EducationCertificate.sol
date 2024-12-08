// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interface section
interface IEducationCertificate {
    struct CertificateInfo {
        string certificateHash;
        address university;
        uint256 issueDate;
        string certificateType;
        bool isValid;
        string ipfsHash;
    }

    function authorizedUniversities(address university) external view returns (bool);
    function getCertificateDetails(
        address _student, 
        string calldata _certificateHash
    ) external view returns (
        string memory certificateHash,
        address university,
        uint256 issueDate,
        string memory certificateType,
        bool isValid,
        string memory ipfsHash
    );
}

// Main contract implementing the interface
contract EducationCertificate is IEducationCertificate, ERC721, Ownable {
    // Structs
    struct Certificate {
        string certificateHash;
        address university;
        uint256 issueDate;
        string certificateType;
        bool isValid;
        string ipfsHash;
        mapping(address => bool) authorizedViewers;
        mapping(address => uint256) viewerExpiration;
    }

    // Add this struct near the top of the contract, after the Certificate struct
    struct CertificateView {
        string certificateHash;
        address university;
        uint256 issueDate;
        string certificateType;
        bool isValid;
        string ipfsHash;
    }

    // Mappings
    mapping(address => bool) public authorizedUniversities;
    mapping(address => mapping(string => Certificate)) public studentCertificates;
    mapping(address => string[]) public studentCertificateList;
    mapping(address => bool) public authorizedIssuers;

    // Events
    event UniversityAuthorized(address indexed university);
    event UniversityRevoked(address indexed university);
    event CertificateIssued(
        address indexed student, 
        address indexed university, 
        string certificateHash
    );
    event CertificateRevoked(
        address indexed student, 
        address indexed university, 
        string certificateHash
    );
    event CertificateIPFSUpdated(
        address indexed student,
        string certificateHash,
        string ipfsHash
    );
    event ViewerAuthorized(
        address indexed student,
        address indexed viewer,
        string certificateHash
    );
    event ViewerRevoked(
        address indexed student,
        address indexed viewer,
        string certificateHash
    );
    event ViewerAccessExtended(
        address indexed student,
        address indexed viewer,
        string certificateHash,
        uint256 newExpiration
    );

    constructor() ERC721("EducationCertificate", "EDUCERT") Ownable(msg.sender) {}

    modifier onlyAuthorizedUniversity() {
        require(
            authorizedUniversities[msg.sender],
            "Only authorized universities can call this function"
        );
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    //Grants authorization to a specific university issue certificates
    function authorizeUniversity(address _university) external onlyOwner {
        require(_university != address(0), "Invalid university address");
        require(!authorizedUniversities[_university], "University already authorized");
        
        authorizedUniversities[_university] = true;
        emit UniversityAuthorized(_university);
    }

    function revokeUniversity(address _university) external onlyOwner {
        require(authorizedUniversities[_university], "University not authorized");
        
        authorizedUniversities[_university] = false;
        emit UniversityRevoked(_university);
    }

    //Grants authorization to a specific user to see the off-chain data of the certificate
    function authorizeViewer(
        string calldata _certificateHash,
        address _viewer,
        uint256 _duration
    ) external {
        Certificate storage cert = studentCertificates[msg.sender][_certificateHash];
        require(cert.isValid, "Certificate doesn't exist or is revoked");
        require(bytes(cert.certificateHash).length > 0, "Certificate does not exist");
        require(_viewer != address(0), "Invalid viewer address");
        require(!cert.authorizedViewers[_viewer], "Viewer already authorized");
        require(_duration > 0 && _duration <= 365 days, "Invalid duration");
        
        cert.authorizedViewers[_viewer] = true;
        cert.viewerExpiration[_viewer] = block.timestamp + _duration;
        emit ViewerAuthorized(msg.sender, _viewer, _certificateHash);
    }

    function isAuthorizedViewer(
        address _student,
        string calldata _certificateHash,
        address _viewer
    ) external view returns (bool) {
        Certificate storage cert = studentCertificates[_student][_certificateHash];
        
        if (_viewer == _student || _viewer == cert.university) {
            return true;
        }
        
        return cert.authorizedViewers[_viewer] && 
               cert.viewerExpiration[_viewer] >= block.timestamp;
    }

    function issueCertificate(
        address _student,
        string calldata _certificateHash,
        string calldata _certificateType,
        string calldata _ipfsHash
    ) external onlyAuthorizedUniversity {
        require(_student != address(0), "Invalid student address");
        require(bytes(_certificateHash).length > 0, "Invalid certificate hash");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");
        require(
            !studentCertificates[_student][_certificateHash].isValid,
            "Certificate already exists"
        );

        uint256 tokenId = uint256(keccak256(abi.encodePacked(_student, _certificateHash)));
        _safeMint(_student, tokenId);

        // Create certificate directly in storage instead of memory
        Certificate storage newCertificate = studentCertificates[_student][_certificateHash];
        newCertificate.certificateHash = _certificateHash;
        newCertificate.university = msg.sender;
        newCertificate.issueDate = block.timestamp;
        newCertificate.certificateType = _certificateType;
        newCertificate.isValid = true;
        newCertificate.ipfsHash = _ipfsHash;

        studentCertificateList[_student].push(_certificateHash);

        emit CertificateIssued(_student, msg.sender, _certificateHash);
        emit CertificateIPFSUpdated(_student, _certificateHash, _ipfsHash);
    }

    function revokeCertificate(
        address _student,
        string calldata _certificateHash
    ) external onlyAuthorizedUniversity {
        Certificate storage certificate = studentCertificates[_student][_certificateHash];
        require(certificate.isValid, "Certificate doesn't exist or is already revoked");
        require(
            certificate.university == msg.sender,
            "Only issuing university can revoke"
        );
        certificate.isValid = false;
        emit CertificateRevoked(_student, msg.sender, _certificateHash);
    }

    function getStudentCertificates(
        address _student
    ) external view returns (string[] memory) {
        return studentCertificateList[_student];
    }

    function getCertificateDetails(
        address _student,
        string calldata _certificateHash
    ) external view returns (
        string memory certificateHash,
        address university,
        uint256 issueDate,
        string memory certificateType,
        bool isValid,
        string memory ipfsHash
    ) {
        Certificate storage cert = studentCertificates[_student][_certificateHash];
        return (
            cert.certificateHash,
            cert.university,
            cert.issueDate,
            cert.certificateType,
            cert.isValid,
            cert.ipfsHash
        );
    }

    function getMyAllCertificates() external view returns (CertificateView[] memory) {
        string[] memory certificateHashes = studentCertificateList[msg.sender];
        CertificateView[] memory certificates = new CertificateView[](certificateHashes.length);
        
        for (uint i = 0; i < certificateHashes.length; i++) {
            Certificate storage cert = studentCertificates[msg.sender][certificateHashes[i]];
            certificates[i] = CertificateView({
                certificateHash: cert.certificateHash,
                university: cert.university,
                issueDate: cert.issueDate,
                certificateType: cert.certificateType,
                isValid: cert.isValid,
                ipfsHash: cert.ipfsHash
            });
        }
        
        return certificates;
    }

    function updateCertificateIPFS(
        address _student,
        string calldata _certificateHash,
        string calldata _ipfsHash
    ) external onlyAuthorizedUniversity {
        Certificate storage certificate = studentCertificates[_student][_certificateHash];
        
        require(certificate.isValid, "Certificate doesn't exist or is revoked");
        require(certificate.university == msg.sender, "Only issuing university can update");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");

        certificate.ipfsHash = _ipfsHash;
        emit CertificateIPFSUpdated(_student, _certificateHash, _ipfsHash);
    }

    // Add new function to get private certificate data
    function getPrivateCertificateData(
        address _student,
        string calldata _certificateHash
    ) external view returns (string memory) {
        Certificate storage cert = studentCertificates[_student][_certificateHash];
        
        if (msg.sender == _student || msg.sender == cert.university) {
            return cert.ipfsHash;
        }
        
        require(cert.authorizedViewers[msg.sender], "Not authorized to view private data");
        require(cert.viewerExpiration[msg.sender] >= block.timestamp, "Viewer access expired");
        
        return cert.ipfsHash;
    }

    // Add function to update private data
    function updatePrivateData(
        address _student,
        string calldata _certificateHash,
        string calldata _newIpfsHash
    ) external onlyAuthorizedUniversity {
        Certificate storage cert = studentCertificates[_student][_certificateHash];
        require(cert.isValid, "Certificate doesn't exist or is revoked");
        require(cert.university == msg.sender, "Only issuing university can update");
        
        cert.ipfsHash = _newIpfsHash;
        emit CertificateIPFSUpdated(_student, _certificateHash, _newIpfsHash);
    }

    // Add this function to revoke viewer access
    function revokeViewer(
        string calldata _certificateHash,
        address _viewer
    ) external {
        Certificate storage cert = studentCertificates[msg.sender][_certificateHash];
        require(cert.isValid, "Certificate doesn't exist or is revoked");
        require(bytes(cert.certificateHash).length > 0, "Certificate does not exist");
        require(_viewer != address(0), "Invalid viewer address");
        require(cert.authorizedViewers[_viewer], "Viewer not authorized");
        
        cert.authorizedViewers[_viewer] = false;
        emit ViewerRevoked(msg.sender, _viewer, _certificateHash);
    }

    // Add a function to extend viewer access
    function extendViewerAccess(
        string calldata _certificateHash,
        address _viewer,
        uint256 _additionalDuration
    ) external {
        Certificate storage cert = studentCertificates[msg.sender][_certificateHash];
        require(cert.isValid, "Certificate doesn't exist or is revoked");
        require(cert.authorizedViewers[_viewer], "Viewer not authorized");
        require(_additionalDuration > 0 && _additionalDuration <= 365 days, "Invalid duration");

        cert.viewerExpiration[_viewer] = block.timestamp + _additionalDuration;
        emit ViewerAccessExtended(msg.sender, _viewer, _certificateHash, cert.viewerExpiration[_viewer]);
    }
} 