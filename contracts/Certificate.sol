// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Certificate {
    uint public certCount = 0;

    struct Cert {
        uint id;
        string studentName;
        string studentId;
        string course;

        // Extracted from PDF (optional, but good)
        string certNo;

        // IPFS CID of the uploaded PDF
        string ipfsCid;

        // SHA256 hash of the original uploaded PDF bytes
        bytes32 fileHash;

        // Issuer wallet address (the wallet that issued on-chain)
        address issuer;

        // Issue timestamp
        uint timestamp;

        // Revocation status
        bool revoked;
    }

    mapping(uint => Cert) private certificates;

    event CertificateIssued(
        uint indexed id,
        address indexed issuer,
        bytes32 fileHash,
        string ipfsCid
    );

    event CertificateRevoked(uint indexed id, address indexed issuer);

    function issueCertificate(
        string memory _name,
        string memory _studentId,
        string memory _course,
        string memory _certNo,
        string memory _ipfsCid,
        bytes32 _fileHash
    ) public returns (uint) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_studentId).length > 0, "Student ID required");
        require(bytes(_course).length > 0, "Course required");
        require(bytes(_ipfsCid).length > 0, "IPFS CID required");
        require(_fileHash != bytes32(0), "File hash required");

        certCount++;

        certificates[certCount] = Cert(
            certCount,
            _name,
            _studentId,
            _course,
            _certNo,
            _ipfsCid,
            _fileHash,
            msg.sender,
            block.timestamp,
            false
        );

        emit CertificateIssued(certCount, msg.sender, _fileHash, _ipfsCid);
        return certCount;
    }

    function getCertificate(uint _id) public view returns (Cert memory) {
        require(_id > 0 && _id <= certCount, "Certificate does not exist");
        return certificates[_id];
    }

    function revokeCertificate(uint _id) public {
        require(_id > 0 && _id <= certCount, "Certificate does not exist");

        Cert storage c = certificates[_id];
        require(msg.sender == c.issuer, "Only issuer can revoke");
        require(!c.revoked, "Already revoked");

        c.revoked = true;
        emit CertificateRevoked(_id, msg.sender);
    }

    function verifyFileHash(uint _id, bytes32 _hash) public view returns (bool) {
        require(_id > 0 && _id <= certCount, "Certificate does not exist");
        return certificates[_id].fileHash == _hash;
    }
}