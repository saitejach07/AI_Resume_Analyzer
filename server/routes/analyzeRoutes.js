const express = require("express");
const multer = require("multer");
const {
  analyzeResume,
  generateBullets,
  findUnwantedBullets
} = require("../controllers/analyzeController");

const router = express.Router();

const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== "resume") {
      return cb(new Error("Unexpected file field"));
    }

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only PDF, DOC, DOCX allowed"));
  }
});


router.post("/", upload.single("resume"), analyzeResume);
router.post("/generate-bullets", upload.single("resume"), generateBullets);
router.post("/unwanted-bullets", upload.single("resume"), findUnwantedBullets);

module.exports = router;
