# CertiChain Vault 🔐📜

**Blockchain-Based Certificate Issuing & Verification System**

CertiChain Vault is a decentralized platform for issuing, storing, and verifying digital certificates using **Ethereum blockchain and IPFS**.
It ensures certificates are **tamper-proof, verifiable, and permanently stored**.

The system combines **Blockchain, IPFS, OCR, and AI-assisted verification** to create a secure certificate infrastructure for universities, training institutes, and organizations.

---

# 🚀 Key Features

### 🔗 Blockchain Certificate Issuing

* Certificates are issued using **Ethereum smart contracts**
* Each certificate is permanently recorded on-chain
* Prevents forgery or duplication

### ☁️ IPFS File Storage

* Certificate PDF files are uploaded to **IPFS via Pinata**
* Only the **CID and SHA-256 hash** are stored on blockchain
* Guarantees file integrity

### 🔍 Certificate Verification

* Anyone can verify certificate authenticity
* Verification checks:

  * Blockchain record
  * IPFS file hash
  * Issuer identity

### 🧠 AI Verification Assistant

Provides a simplified explanation of verification results including:

* Certificate authenticity
* Integrity check
* Risk level
* Verification summary

### 📄 OCR-Based Autofill

* Extracts certificate data from uploaded PDF
* Automatically fills fields such as:

  * Student Name
  * Roll / ID
  * Course
  * Certificate Number

### 🏫 Issuer Registry

* Displays issuer information such as:

  * Organization name
  * Location
  * Website
  * Verified issuer badge

### 📊 Certificates Dashboard

Browse certificates issued on-chain with:

* Transaction hash
* Issuer identity
* File hash
* Quick verification link

---

# 🏗️ System Architecture

User uploads certificate PDF
⬇
OCR extracts certificate details
⬇
PDF uploaded to **IPFS (Pinata)**
⬇
SHA-256 hash generated
⬇
Smart contract stores:

* Student information
* IPFS CID
* File hash
  ⬇
  Anyone can verify certificate authenticity

---

# 🛠️ Tech Stack

### Frontend

* React.js
* Web3.js
* TailwindCSS

### Backend

* Node.js
* Express.js
* Multer (file upload)
* Axios
* Pinata API

### Blockchain

* Ethereum Smart Contract
* Ganache (local blockchain)
* MetaMask wallet

### Storage

* IPFS (via Pinata)

### AI / Processing

* OCR PDF extraction
* AI-based verification explanation

---

# 📂 Project Structure

```
student-certificate-blockchain-main
│
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Issue.jsx
│   │   │   ├── Verify.jsx
│   │   │   └── Certificates.jsx
│   │   ├── web3/
│   │   ├── ai/
│   │   └── components/
│
├── server/              # Node.js backend
│   ├── index.js
│   ├── issuerRegistry.js
│
├── contracts/           # Smart contract
│
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/certichain-vault.git
cd certichain-vault
```

---

## 2️⃣ Install Dependencies

### Backend

```
cd server
npm install
```

### Frontend

```
cd client
npm install
```

---

## 3️⃣ Configure Environment Variables

Create `.env` inside **server folder**

```
PINATA_JWT=your_pinata_jwt_token
```

---

## 4️⃣ Start Backend Server

```
cd server
npm start
```

Server will run on:

```
http://localhost:5050
```

---

## 5️⃣ Start Frontend

```
cd client
npm start
```

Frontend will run on:

```
http://localhost:3000
```

---

# 📸 Screenshots

### Issue Certificate Page

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/08527095-5a0c-427c-b0f5-0cd5d9295181" />


### Certificate Verification

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/17306e25-e054-4faa-b3ee-5469c04adaf5" />


### Certificates Dashboard
<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/177b3375-c3fd-41d1-b072-f286f951cb37" />


---

# 🔒 Security Model

CertiChain Vault ensures certificate authenticity using:

* SHA-256 file hashing
* Blockchain immutability
* IPFS distributed storage
* Wallet-based issuer verification

If the certificate file changes, the hash mismatch will expose tampering.

---

# 🌍 Future Improvements

* Polygon / Ethereum testnet deployment
* Certificate revocation system
* Email verification links
* Public issuer registry
* NFT-based certificates

---

# 👩‍💻 Author

**Anshika Jain**
AI / Full-Stack Developer

---

# ⭐ Support

If you found this project useful, consider giving it a **star ⭐ on GitHub**.
