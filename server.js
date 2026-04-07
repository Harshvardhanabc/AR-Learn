/**
 * AR Smart Learning Platform — server.js
 * Cloudinary + Express server
 *
 * GLB/GLTF + texture files → Cloudinary (free 25GB cloud storage)
 * App itself runs on Render free tier
 *
 * Setup:
 *   1. npm install
 *   2. .env file mein CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET set karein
 *   3. node server.js
 */

require('dotenv').config();

const express    = require('express');
const multer     = require('multer');
const cors       = require('cors');
const path       = require('path');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

const app  = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════
// CLOUDINARY CONFIG
// ═══════════════════════════════════════════════════════
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

// ═══════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ═══════════════════════════════════════════════════════
// MULTER — memory storage (file disk par nahi jayegi,
// seedha Cloudinary stream hogi)
// ═══════════════════════════════════════════════════════
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(glb|gltf|png|jpe?g|webp)$/i;
    if (allowed.test(file.originalname)) return cb(null, true);
    cb(new Error(`File type allowed nahi hai: ${file.originalname}`));
  },
});

// ═══════════════════════════════════════════════════════
// HELPER: Buffer ko Cloudinary mein upload karo (stream)
// ═══════════════════════════════════════════════════════
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

// ═══════════════════════════════════════════════════════
// POST /api/upload-model
// Multipart form:
//   slug        — topic slug  (e.g. "human-lungs")
//   topicTitle  — fallback title
//   glb         — .glb / .gltf file
//   textures    — optional texture files (multiple)
// ═══════════════════════════════════════════════════════
app.post('/api/upload-model',
  upload.fields([
    { name: 'glb',      maxCount: 1  },
    { name: 'textures', maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const slug     = req.body.slug || slugify(req.body.topicTitle || 'model');
      const glbFiles = req.files?.glb      || [];
      const texFiles = req.files?.textures || [];

      if (glbFiles.length === 0) {
        return res.status(400).json({ ok: false, error: 'GLB file nahi mili' });
      }

      // ── GLB upload to Cloudinary ──
      // resource_type: 'raw' GLB binary files ke liye
      const glbResult = await uploadToCloudinary(glbFiles[0].buffer, {
        resource_type : 'raw',
        folder        : `arlearn/${slug}`,
        public_id     : 'model.glb',
      });

      console.log(`✅ GLB uploaded: ${glbResult.secure_url}`);

      // ── Textures upload (agar hain toh) ──
      const textureResults = [];
      for (const tex of texFiles) {
        const ext      = path.extname(tex.originalname).toLowerCase();
        const isImage  = /\.(png|jpe?g|webp)$/i.test(tex.originalname);
        const texResult = await uploadToCloudinary(tex.buffer, {
          resource_type : isImage ? 'image' : 'raw',
          folder        : `arlearn/${slug}`,
          public_id     : path.basename(tex.originalname, ext),
        });
        textureResults.push(texResult.secure_url);
        console.log(`   Texture: ${texResult.secure_url}`);
      }

      res.json({
        ok       : true,
        slug,
        glbUrl   : glbResult.secure_url,  // ← yeh URL viewer mein directly use hogi
        textures : textureResults,
        message  : `Model Cloudinary par save ho gaya!`,
      });

    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════
// GET /api/assets — Cloudinary se saved models list karo
// ═══════════════════════════════════════════════════════
app.get('/api/assets', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type          : 'upload',
      resource_type : 'raw',
      prefix        : 'arlearn/',
      max_results   : 100,
    });

    // Slug ke hisaab se group karo
    const folders = {};
    for (const r of result.resources) {
      // public_id format: arlearn/<slug>/model.glb
      const parts = r.public_id.split('/');
      if (parts.length >= 2) {
        const slug = parts[1];
        if (!folders[slug]) folders[slug] = { slug, glbUrl: null, files: [] };
        folders[slug].files.push(r.secure_url);
        if (parts[2] && parts[2].startsWith('model')) {
          folders[slug].glbUrl = r.secure_url;
        }
      }
    }

    res.json({ folders: Object.values(folders) });
  } catch (err) {
    console.error('Assets list error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/assets/:slug
// ═══════════════════════════════════════════════════════
app.delete('/api/assets/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const result = await cloudinary.api.resources({
      type          : 'upload',
      resource_type : 'raw',
      prefix        : `arlearn/${slug}/`,
      max_results   : 50,
    });

    if (result.resources.length > 0) {
      const publicIds = result.resources.map(r => r.public_id);
      await cloudinary.api.delete_resources(publicIds, { resource_type: 'raw' });
    }

    console.log(`🗑️ Deleted: arlearn/${slug}/`);
    res.json({ ok: true, message: `arlearn/${slug}/ deleted from Cloudinary` });

  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// Health check — Render ke liye
// ═══════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════
function slugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'model';
}

// ═══════════════════════════════════════════════════════
// Start
// ═══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('');
  console.log('  ⬡  AR Smart Learning Platform');
  console.log(`  🚀 Server: http://localhost:${PORT}`);
  console.log(`  ☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '⚠ NOT SET'}`);
  console.log('');
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('  ⚠️  Cloudinary env variables missing!');
    console.warn('  .env file mein ye 3 variables set karein:');
    console.warn('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.warn('  CLOUDINARY_API_KEY=your_api_key');
    console.warn('  CLOUDINARY_API_SECRET=your_api_secret');
  }
});