// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EducationCertificate.sol";

contract CertificateHelper {
    IEducationCertificate public certificateContract;
    
    constructor(address _certificateContract) {
        certificateContract = IEducationCertificate(_certificateContract);
    }
    
    struct StudentData {
        string studentName;
        string studentId;
        Course[] courses;
        string gpa;
        string additionalInfo;
    }
    
    struct Course {
        string name;
        string grade;
        uint256 completionDate;
        string credits;
    }
    
    // Helper function to generate certificate hash
    function generateCertificateHash(
        string memory studentId,
        string memory course,
        uint256 timestamp
    ) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                studentId,
                "-",
                course,
                "-",
                toString(timestamp)
            )
        );
    }
    
    // Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // Helper function to create JSON structure for IPFS
    function createStudentDataJSON(
        StudentData memory _data
    ) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                '{"studentDetails":{"name":"', _data.studentName,
                '","studentId":"', _data.studentId,
                '"},"academicRecords":{"courses":', _createCoursesJSON(_data.courses),
                ',"gpa":"', _data.gpa,
                '","additionalInfo":"', _data.additionalInfo,
                '"}}'
            )
        );
    }
    
    function _createCoursesJSON(
        Course[] memory _courses
    ) internal pure returns (string memory) {
        string memory coursesJSON = "[";
        for(uint i = 0; i < _courses.length; i++) {
            if(i > 0) coursesJSON = string(abi.encodePacked(coursesJSON, ","));
            coursesJSON = string(
                abi.encodePacked(
                    coursesJSON,
                    '{"name":"', _courses[i].name,
                    '","grade":"', _courses[i].grade,
                    '","completionDate":"', toString(_courses[i].completionDate),
                    '","credits":"', _courses[i].credits,
                    '"}'
                )
            );
        }
        return string(abi.encodePacked(coursesJSON, "]"));
    }
} 