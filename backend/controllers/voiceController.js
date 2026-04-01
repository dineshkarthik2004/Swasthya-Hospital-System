import Groq from "groq-sdk";
import fs from "fs";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const extractVoiceData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const ext = req.file.originalname ? req.file.originalname.split('.').pop() : "webm";
    const tempFilePath = req.file.path + "." + ext;
    fs.renameSync(req.file.path, tempFilePath);

    const audioFile = fs.createReadStream(tempFilePath);
    
    // Call Groq Translation API instead of Transcription
    // This automatically translates ANY spoken language into English
    const translation = await groq.audio.translations.create({
      file: audioFile,
      model: "whisper-large-v3",
      response_format: "json",
    });

    // delete temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    res.json({ text: translation.text });
  } catch (err) {
    console.error("Voice Extraction Error:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    // Cleanup any temp file
    const ext = req.file.originalname ? req.file.originalname.split('.').pop() : "webm";
    const tempFilePath = req.file.path + "." + ext;
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    
    res.status(500).json({ error: "Voice extraction failed" });
  }
};
