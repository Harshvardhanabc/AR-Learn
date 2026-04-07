/**
 * AR Smart Learning Platform — qr.js
 * QR code generation helper utilities
 * Uses QRCode.js (loaded via CDN in index.html)
 */

/**
 * Generate a QR code in a given container element
 * @param {HTMLElement} container - Target DOM element
 * @param {string} url - URL to encode
 * @param {object} opts - Optional overrides (width, height, colors)
 * @returns {QRCode|null} QRCode instance or null
 */
function generateQRCode(container, url, opts = {}) {
  if (typeof QRCode === 'undefined') {
    console.warn('QRCode library not loaded');
    return null;
  }

  container.innerHTML = ''; // clear previous

  const options = {
    text: url,
    width: opts.width || 220,
    height: opts.height || 220,
    colorDark: opts.colorDark || '#000000',
    colorLight: opts.colorLight || '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
    ...opts,
  };

  try {
    return new QRCode(container, options);
  } catch (e) {
    console.error('QR generation failed:', e);
    container.innerHTML = `<p style="color:red;font-size:12px;">QR error: ${e.message}</p>`;
    return null;
  }
}

/**
 * Download QR code as PNG from a container
 * @param {HTMLElement} container - Container with the QR canvas
 * @param {string} filename - Output filename
 */
function downloadQRFromContainer(container, filename = 'qr-code.png') {
  const canvas = container.querySelector('canvas');
  if (!canvas) {
    alert('QR code not ready. Please wait a moment and try again.');
    return;
  }

  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Get QR canvas data URL from container
 * @param {HTMLElement} container
 * @returns {string|null} Base64 PNG data URL
 */
function getQRDataURL(container) {
  const canvas = container.querySelector('canvas');
  return canvas ? canvas.toDataURL('image/png') : null;
}

/**
 * Print QR code in a new window
 * @param {string} url - URL to encode
 * @param {string} title - Topic title for print header
 */
function printQRCode(url, title = 'AR Learning Topic') {
  const win = window.open('', '_blank', 'width=500,height=600');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print QR — ${title}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: white; color: black; }
        h2 { margin-bottom: 8px; font-size: 22px; }
        p { color: #666; margin-bottom: 24px; font-size: 13px; }
        #qr { display: inline-block; padding: 16px; border: 2px solid #000; border-radius: 8px; }
        .footer { margin-top: 24px; font-size: 11px; color: #999; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h2>📚 ${title}</h2>
      <p>Scan with your phone camera to launch the AR experience</p>
      <div id="qr"></div>
      <div class="footer">Powered by ARLearn Platform · No app download required</div>
      <script>
        window.onload = function() {
          new QRCode(document.getElementById('qr'), {
            text: '${url.replace(/'/g, "\\'")}',
            width: 256, height: 256,
            colorDark: '#000000', colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
          setTimeout(() => window.print(), 800);
        };
      <\/script>
    </body>
    </html>
  `);
  win.document.close();
}

// Expose globally
window.generateQRCode = generateQRCode;
window.downloadQRFromContainer = downloadQRFromContainer;
window.getQRDataURL = getQRDataURL;
window.printQRCode = printQRCode;