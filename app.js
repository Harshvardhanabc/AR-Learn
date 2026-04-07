/**
 * AR Smart Learning Platform — app.js
 * Dashboard logic: topic management, filtering, UI interactions
 */

// ═══════════════════════════════════════════════════════
// CONSTANTS & STATE
// ═══════════════════════════════════════════════════════

const STORAGE_KEY = 'arlearn_topics';
const VERSION = '1.0.0';

// Built-in model configurations (emoji-based procedural 3D)
const BUILTIN_MODELS = {
  heart:   { emoji: '❤️', label: 'Human Heart',      color: '#e53e3e', hotspots: ['Left Ventricle','Right Ventricle','Aorta','Pulmonary Artery','Mitral Valve'] },
  brain:   { emoji: '🧠', label: 'Human Brain',      color: '#b794f4', hotspots: ['Frontal Lobe','Cerebellum','Brain Stem','Temporal Lobe','Corpus Callosum'] },
  dna:     { emoji: '🧬', label: 'DNA Double Helix', color: '#68d391', hotspots: ['Adenine','Thymine','Guanine','Cytosine','Phosphate Backbone','Sugar'] },
  atom:    { emoji: '⚛️', label: 'Atom Structure',   color: '#63b3ed', hotspots: ['Nucleus','Proton','Neutron','Electron','Electron Shell'] },
  earth:   { emoji: '🌍', label: 'Planet Earth',     color: '#38a169', hotspots: ['Crust','Mantle','Outer Core','Inner Core','Atmosphere'] },
  solar:   { emoji: '☀️', label: 'Solar System',     color: '#f6ad55', hotspots: ['Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'] },
  engine:  { emoji: '⚙️', label: 'Car Engine',       color: '#a0aec0', hotspots: ['Piston','Crankshaft','Camshaft','Valve','Spark Plug','Timing Belt'] },
  crystal: { emoji: '💎', label: 'Crystal Lattice',  color: '#76e4f7', hotspots: ['Unit Cell','Lattice Point','Bond Angle','Symmetry Axis'] },
};

const CATEGORY_COLORS = {
  biology: 'cat-biology', physics: 'cat-physics', chemistry: 'cat-chemistry',
  engineering: 'cat-engineering', astronomy: 'cat-astronomy', other: 'cat-other',
};

// App state
let state = {
  topics: [],
  activeFilter: 'all',
  activeTab: 'topics',
  selectedModel: 'heart',
  selectedModelSrc: 'builtin',
  currentQRTopic: null,
  qrInstance: null,
};

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadTopics();
  seedDemoTopics();
  bindNavButtons();
  bindFilterButtons();
  bindModelOptions();
  bindModelSourceTabs();
  renderTopics();
  updateStatCount();
});

/**
 * Load topics from localStorage
 */
function loadTopics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.topics = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load topics:', e);
    state.topics = [];
  }
}

/**
 * Seed demo topics if none exist
 */
function seedDemoTopics() {
  if (state.topics.length > 0) return;

  const demos = [
    {
      id: 'demo-1', title: 'Human Heart', category: 'biology', grade: 'high',
      description: 'Explore the four chambers of the human heart, valves, and major blood vessels in augmented reality.',
      modelSrc: 'url', modelKey: 'heart', modelUrl: 'https://skfb.ly/oyBCT',
      voice: 'The human heart is a muscular organ that pumps blood through the circulatory system. It has four chambers: the left and right atria, and the left and right ventricles.',
      quiz: [{ q: 'How many chambers does the human heart have?', a: '4' }, { q: 'What is the largest chamber?', a: 'left ventricle' }],
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'demo-2', title: 'Solar System', category: 'astronomy', grade: 'middle',
      description: 'Journey through our solar system. See all 8 planets and their relative sizes in 3D AR.',
      modelSrc: 'builtin', modelKey: 'solar', modelUrl: '',
      voice: 'Our solar system consists of the Sun and everything that orbits around it, including eight planets, moons, asteroids, and comets.',
      quiz: [{ q: 'Which is the largest planet?', a: 'jupiter' }, { q: 'How many planets are in our solar system?', a: '8' }],
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'demo-3', title: 'Atom Structure', category: 'chemistry', grade: 'high',
      description: 'Visualize atomic structure with protons, neutrons, and electrons orbiting the nucleus.',
      modelSrc: 'builtin', modelKey: 'atom', modelUrl: '',
      voice: 'An atom consists of a dense nucleus containing protons and neutrons, surrounded by a cloud of electrons in different energy levels or shells.',
      quiz: [{ q: 'What is found in the nucleus?', a: 'protons and neutrons' }],
      createdAt: Date.now() - 86400000,
    },
  ];

  state.topics = demos;
  saveTopics();
}

/**
 * Save topics to localStorage
 */
function saveTopics() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.topics));
  } catch (e) {
    console.error('Failed to save topics:', e);
  }
}

// ═══════════════════════════════════════════════════════
// UI BINDINGS
// ═══════════════════════════════════════════════════════

function bindNavButtons() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function bindFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeFilter = btn.dataset.cat;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTopics();
    });
  });
}

function bindModelOptions() {
  document.querySelectorAll('.model-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.model-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selectedModel = opt.dataset.model;

      // Auto-fill title if empty
      const titleInput = document.getElementById('topic-title');
      if (!titleInput.value) {
        titleInput.value = BUILTIN_MODELS[state.selectedModel]?.label || '';
      }
    });
  });
}

function bindModelSourceTabs() {
  document.querySelectorAll('.src-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.src-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.selectedModelSrc = tab.dataset.src;

      document.getElementById('src-builtin').style.display = state.selectedModelSrc === 'builtin' ? '' : 'none';
      document.getElementById('src-url').style.display     = state.selectedModelSrc === 'url'     ? '' : 'none';
      document.getElementById('src-upload').style.display  = state.selectedModelSrc === 'upload'  ? '' : 'none';
    });
  });
  bindGLBUpload();
}

// ═══════════════════════════════════════════════════════
// GLB UPLOAD HANDLING
// ═══════════════════════════════════════════════════════

// Uploaded file references stored in state
state.uploadedGLB      = null; // { file, name, slugName }
state.uploadedTextures = [];   // [{ file, name }]

function bindGLBUpload() {
  const glbInput     = document.getElementById('glb-file-input');
  const texInput     = document.getElementById('texture-file-input');
  const dropZone     = document.getElementById('glb-drop-zone');

  if (!glbInput) return;

  // File input change
  glbInput.addEventListener('change', e => {
    if (e.target.files[0]) handleGLBFile(e.target.files[0]);
  });

  // Texture input change
  texInput?.addEventListener('change', e => {
    Array.from(e.target.files).forEach(f => addTexture(f));
  });

  // Drag & drop on zone
  dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone?.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    const glb   = files.find(f => f.name.match(/\.(glb|gltf)$/i));
    const texs  = files.filter(f => f.name.match(/\.(png|jpe?g|webp)$/i));
    if (glb)  handleGLBFile(glb);
    texs.forEach(f => addTexture(f));
  });

  // Auto-update path preview when title changes
  document.getElementById('topic-title')?.addEventListener('input', updateUploadPathPreview);
}

function handleGLBFile(file) {
  const slugName = slugify(
    document.getElementById('topic-title')?.value.trim() || file.name.replace(/\.[^.]+$/, '')
  );
  state.uploadedGLB = { file, name: file.name, slugName };

  document.getElementById('glb-preview').style.display = '';
  document.getElementById('glb-file-name').textContent = file.name;
  document.getElementById('glb-file-size').textContent = formatBytes(file.size);
  document.getElementById('texture-zone').style.display = '';
  updateUploadPathPreview();
}

function addTexture(file) {
  if (state.uploadedTextures.find(t => t.name === file.name)) return; // skip dup
  state.uploadedTextures.push({ file, name: file.name });

  const list = document.getElementById('texture-list');
  const item = document.createElement('div');
  item.className = 'texture-item';
  item.dataset.name = file.name;
  item.innerHTML = `<span class="tex-icon">🖼️</span><span class="tex-name">${escHtml(file.name)}</span>
    <button class="tex-remove" onclick="removeTexture('${escHtml(file.name)}')">✕</button>`;
  list?.appendChild(item);
}

function removeTexture(name) {
  state.uploadedTextures = state.uploadedTextures.filter(t => t.name !== name);
  document.querySelector(`.texture-item[data-name="${name}"]`)?.remove();
}

function clearGLBUpload() {
  state.uploadedGLB = null;
  state.uploadedTextures = [];
  document.getElementById('glb-preview').style.display   = 'none';
  document.getElementById('texture-zone').style.display  = 'none';
  document.getElementById('texture-list').innerHTML      = '';
  document.getElementById('glb-file-input').value        = '';
  document.getElementById('texture-file-input').value    = '';
  updateUploadPathPreview();
}

function updateUploadPathPreview() {
  const title = document.getElementById('topic-title')?.value.trim();
  const slug  = title ? slugify(title) : '[model-naam]';
  if (state.uploadedGLB) state.uploadedGLB.slugName = slug;
  const el = document.getElementById('upload-path-preview');
  if (el) el.textContent = `assets/${slug}/model.glb`;
}

// ── Cloudinary upload — GLB seedha cloud mein save hoti hai ──
async function uploadModelToCloudinary(topic) {
  if (!state.uploadedGLB) return;

  const slug     = topic.modelSlug;
  const formData = new FormData();

  formData.append('slug',       slug);
  formData.append('topicTitle', topic.title);
  formData.append('glb',        state.uploadedGLB.file, 'model.glb');

  for (const tex of state.uploadedTextures) {
    formData.append('textures', tex.file, tex.name);
  }

  const res = await fetch('/api/upload-model', {
    method : 'POST',
    body   : formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Upload failed');

  return data; // { slug, glbUrl (Cloudinary HTTPS URL), textures }
}

// ── Utilities ──
function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'model';
}

function formatBytes(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(2) + ' MB';
}

// ═══════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════

function switchTab(tab) {
  state.activeTab = tab;

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tab}`);
  });

  if (tab === 'topics') renderTopics();
}

// ═══════════════════════════════════════════════════════
// TOPIC RENDERING
// ═══════════════════════════════════════════════════════

function renderTopics() {
  const grid = document.getElementById('topics-grid');
  const empty = document.getElementById('empty-state');

  // Apply filter
  const filtered = state.activeFilter === 'all'
    ? state.topics
    : state.topics.filter(t => t.category === state.activeFilter);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';

  grid.innerHTML = filtered.map(topic => buildTopicCard(topic)).join('');

  // Animate cards in
  grid.querySelectorAll('.topic-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
      setTimeout(() => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '1';
        card.style.transform = '';
      }, i * 60);
    });
  });
}

function buildTopicCard(topic) {
  const model = BUILTIN_MODELS[topic.modelKey] || {};
  const emoji = topic.modelSrc === 'upload' ? '📁' : (model.emoji || '📦');
  const catClass = CATEGORY_COLORS[topic.category] || 'cat-other';
  const catLabel = topic.category ? topic.category.charAt(0).toUpperCase() + topic.category.slice(1) : 'Other';
  const arUrl = buildARUrl(topic);

  return `
    <div class="topic-card" data-id="${topic.id}">
      <div class="card-visual" style="background: radial-gradient(circle, ${model.color || '#63e8b6'}22, transparent 70%);">
        ${emoji}
      </div>
      <button class="card-delete-btn" onclick="deleteTopic('${topic.id}')" title="Delete">✕</button>
      <div class="card-body">
        <span class="card-cat-badge ${catClass}">${catLabel}</span>
        <h3 class="card-title">${escHtml(topic.title)}</h3>
        <p class="card-desc">${escHtml(topic.description)}</p>
        <div class="card-footer">
          <button class="card-btn primary" onclick="showQR('${topic.id}')">🔲 QR Code</button>
          <a class="card-btn" href="${arUrl}" target="_blank" style="text-align:center; text-decoration:none; display:flex; align-items:center; justify-content:center;">🚀 AR View</a>
        </div>
      </div>
    </div>
  `;
}

function updateStatCount() {
  document.getElementById('stat-topics').textContent = state.topics.length;
}

// ═══════════════════════════════════════════════════════
// TOPIC SAVE
// ═══════════════════════════════════════════════════════

function saveTopic() {
  const title    = document.getElementById('topic-title').value.trim();
  const category = document.getElementById('topic-category').value;
  const grade    = document.getElementById('topic-grade').value;
  const desc     = document.getElementById('topic-desc').value.trim();
  const voice    = document.getElementById('topic-voice').value.trim();
  const modelUrl = document.getElementById('model-url')?.value?.trim() || '';

  // Validation
  if (!title) { showToast('⚠️ Please enter a topic title'); return; }
  if (!category) { showToast('⚠️ Please select a category'); return; }
  if (!desc) { showToast('⚠️ Please add a description'); return; }

  // Collect quiz questions
  const quiz = [];
  document.querySelectorAll('.quiz-q-row').forEach(row => {
    const q = row.querySelector('.quiz-q-input')?.value?.trim();
    const a = row.querySelector('.quiz-a-input')?.value?.trim();
    if (q && a) quiz.push({ q, a });
  });

  // Validate upload source
  if (state.selectedModelSrc === 'upload' && !state.uploadedGLB) {
    showToast('⚠️ Please upload a GLB/GLTF file first'); return;
  }

  const slug = slugify(title);

  // Build topic object
  const topic = {
    id: 'topic-' + Date.now(),
    title, category, grade, description: desc, voice,
    modelSrc  : state.selectedModelSrc,
    modelKey  : state.selectedModelSrc === 'builtin' ? state.selectedModel : '',
    // URL field: external URL ya Cloudinary URL (upload ke baad yahan save hogi)
    modelUrl  : state.selectedModelSrc === 'url' ? modelUrl : '',
    modelSlug : state.selectedModelSrc === 'upload' ? slug : '',
    localPath : '',  // Cloudinary use hoti hai — local path nahi
    quiz,
    createdAt: Date.now(),
  };

  state.topics.unshift(topic);
  saveTopics();
  updateStatCount();

  // If upload source → Cloudinary par upload karo, phir topic mein glbUrl save karo
  if (state.selectedModelSrc === 'upload') {
    showToast('⬆️ Cloudinary par upload ho raha hai…');
    uploadModelToCloudinary(topic).then(data => {
      // Cloudinary se mili permanent HTTPS URL topic mein save karo
      topic.modelUrl  = data.glbUrl;
      topic.localPath = '';  // Cloudinary URL use hogi, local path nahi
      saveTopics();          // localStorage update karo naye URL ke saath
      showToast('✅ Cloud par save! QR ready hai.');
    }).catch(err => {
      console.error('Cloudinary upload error:', err);
      if (err.message.includes('fetch') || err.message.includes('Failed')) {
        showToast('⚠️ Server nahi mila — node server.js chal raha hai?');
      } else {
        showToast('⚠️ Upload failed: ' + err.message);
      }
    });
  } else {
    showToast('✅ Topic created! Generating QR…');
  }

  // Switch to topics, then show QR
  resetForm();
  switchTab('topics');
  setTimeout(() => showQR(topic.id), 600);
}

function deleteTopic(id) {
  if (!confirm('Delete this topic?')) return;
  state.topics = state.topics.filter(t => t.id !== id);
  saveTopics();
  updateStatCount();
  renderTopics();
  showToast('🗑️ Topic deleted');
}

function resetForm() {
  document.getElementById('topic-title').value = '';
  document.getElementById('topic-category').value = '';
  document.getElementById('topic-grade').value = 'high';
  document.getElementById('topic-desc').value = '';
  document.getElementById('topic-voice').value = '';
  if (document.getElementById('model-url')) document.getElementById('model-url').value = '';
  document.getElementById('quiz-questions').innerHTML = `
    <div class="quiz-q-row">
      <input type="text" placeholder="Question 1…" class="quiz-q-input" />
      <input type="text" placeholder="Correct answer…" class="quiz-a-input" />
    </div>`;

  // Reset model selection
  document.querySelectorAll('.model-option').forEach(o => o.classList.remove('selected'));
  const first = document.querySelector('.model-option[data-model="heart"]');
  if (first) first.classList.add('selected');
  state.selectedModel = 'heart';

  // Reset upload state
  clearGLBUpload();
}

function addQuizQuestion() {
  const container = document.getElementById('quiz-questions');
  const count = container.querySelectorAll('.quiz-q-row').length + 1;
  const div = document.createElement('div');
  div.className = 'quiz-q-row';
  div.innerHTML = `
    <input type="text" placeholder="Question ${count}…" class="quiz-q-input" />
    <input type="text" placeholder="Correct answer…" class="quiz-a-input" />
  `;
  container.appendChild(div);
}

// ═══════════════════════════════════════════════════════
// QR CODE MODAL
// ═══════════════════════════════════════════════════════

function buildARUrl(topic) {
  // Build absolute URL to viewer.html with topic params
  const base = window.location.href.replace(/\/[^\/]*$/, '/');
  const params = new URLSearchParams({
    id:    topic.id,
    model: topic.modelSrc === 'builtin' ? topic.modelKey
           : topic.modelSrc === 'upload' ? 'local'
           : 'external',
    src:   topic.modelSrc === 'upload' ? (topic.localPath || '') : (topic.modelUrl || ''),
    title: topic.title,
    cat:   topic.category,
    desc:  topic.description,
    voice: topic.voice || '',
    quiz:  JSON.stringify(topic.quiz || []),
  });
  return `${base}viewer.html?${params.toString()}`;
}

function showQR(topicId) {
  const topic = state.topics.find(t => t.id === topicId);
  if (!topic) return;

  state.currentQRTopic = topic;

  // Update modal
  document.getElementById('modal-title').textContent = topic.title;
  document.getElementById('modal-cat').textContent =
    topic.category.charAt(0).toUpperCase() + topic.category.slice(1) +
    ' · ' + topic.grade.charAt(0).toUpperCase() + topic.grade.slice(1) + ' Level';

  const arUrl = buildARUrl(topic);
  const linkEl = document.getElementById('ar-link-text');
  linkEl.textContent = arUrl.length > 60 ? arUrl.substring(0, 57) + '…' : arUrl;
  linkEl.href = arUrl;
  document.getElementById('open-ar-btn').href = arUrl;

  // Generate QR
  const qrDiv = document.getElementById('qr-display');
  qrDiv.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    state.qrInstance = new QRCode(qrDiv, {
      text: arUrl,
      width: 220,
      height: 220,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  } else {
    qrDiv.innerHTML = `<div style="padding:20px;font-size:12px;color:#666;text-align:center;">
      QR library loading…<br><br>
      <a href="${arUrl}" style="word-break:break-all;font-size:10px;">${arUrl}</a>
    </div>`;
  }

  // Show modal
  document.getElementById('qr-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('qr-modal').style.display = 'none';
  state.currentQRTopic = null;
}

function copyLink() {
  if (!state.currentQRTopic) return;
  const url = buildARUrl(state.currentQRTopic);
  navigator.clipboard?.writeText(url).then(() => showToast('📋 Link copied!')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Link copied!');
  });
}

function downloadQR() {
  const canvas = document.querySelector('#qr-display canvas');
  if (!canvas) { showToast('⚠️ QR not ready yet'); return; }
  const a = document.createElement('a');
  a.download = `arlearn-qr-${state.currentQRTopic?.id || 'topic'}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  showToast('⬇ QR downloaded!');
}

function shareWhatsApp() {
  if (!state.currentQRTopic) return;
  const url = buildARUrl(state.currentQRTopic);
  const msg = encodeURIComponent(`📚 AR Learning: *${state.currentQRTopic.title}*\n\nScan or open this link to view in Augmented Reality:\n${url}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// Close modal on backdrop click
document.getElementById('qr-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});