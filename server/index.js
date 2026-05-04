import express from "express";
import cors from "cors";
import multer from "multer";
import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

app.get("/", (req, res) => {
  res.json({ ok: true, service: "certichainvault-server" });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    if (!process.env.PINATA_JWT) {
      return res.status(500).json({ error: "PINATA_JWT not set in backend" });
    }

    const buffer = req.file.buffer;

    // SHA-256 of uploaded PDF
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    // Build multipart form for Pinata
    const form = new FormData();
    form.append("file", buffer, {
      filename: req.file.originalname || "certificate.pdf",
      contentType: req.file.mimetype || "application/pdf",
      knownLength: buffer.length,
    });

    // Optional metadata
    form.append(
      "pinataMetadata",
      JSON.stringify({
        name: req.file.originalname || "certificate.pdf",
      })
    );

    const pinRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      form,
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...form.getHeaders(),
        },
      }
    );

    const pinData = pinRes.data;
    const cid = pinData?.IpfsHash;

    if (!cid) {
      return res.status(500).json({
        error: "Pinata response missing IpfsHash",
        pinata: pinData,
      });
    }

    return res.json({
      cid,
      sha256,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err?.response?.data || err.message);

    return res.status(500).json({
      error:
        err?.response?.data?.error?.reason ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed",
    });
  }
});

app.listen(5050, () => {
  console.log("Server running on http://localhost:5050");
});