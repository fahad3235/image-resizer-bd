/* image-resizer-bd -- pure dimension/format logic (no DOM).
   Works in browser (window.IR_LOGIC) and Node (module.exports). */
(function (global) {
  'use strict';

  var MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
  var ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  var FORMATS = {
    keep: { id: 'keep', label: 'Keep original' },
    png: { id: 'png', label: 'PNG', mime: 'image/png' },
    jpeg: { id: 'jpeg', label: 'JPEG', mime: 'image/jpeg' },
    webp: { id: 'webp', label: 'WebP', mime: 'image/webp' }
  };

  function clampInt(v, min, max, fallback) {
    var n = Math.floor(Number(v));
    if (!isFinite(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  // Aspect-lock: given one new side, compute the other, rounded.
  function aspectLocked(origW, origH, changed, value) {
    if (!(origW > 0) || !(origH > 0)) return null;
    if (changed === 'w') {
      var w = clampInt(value, 1, 10000, 0);
      if (!w) return null;
      return { w: w, h: Math.max(1, Math.round(w * origH / origW)) };
    }
    if (changed === 'h') {
      var h = clampInt(value, 1, 10000, 0);
      if (!h) return null;
      return { w: Math.max(1, Math.round(h * origW / origH)), h: h };
    }
    return null;
  }

  // Fit-inside: scale so the larger side equals maxDim, never upscale.
  function fitInside(origW, origH, maxDim) {
    if (!(origW > 0) || !(origH > 0)) return null;
    var m = Number(maxDim);
    if (!isFinite(m) || m < 1) return null;
    m = Math.min(10000, Math.floor(m));
    var scale = Math.min(1, m / Math.max(origW, origH));
    return {
      w: Math.max(1, Math.round(origW * scale)),
      h: Math.max(1, Math.round(origH * scale))
    };
  }

  // Percent resize: 10-200%.
  function percentResize(origW, origH, pct) {
    if (!(origW > 0) || !(origH > 0)) return null;
    var p = Number(pct);
    if (!isFinite(p) || p < 10 || p > 200) return null;
    return {
      w: Math.max(1, Math.round(origW * p / 100)),
      h: Math.max(1, Math.round(origH * p / 100))
    };
  }

  // Rotate 90/180/270 swaps width/height for odd quarter-turns.
  function rotatedDims(w, h, quarterTurns) {
    var q = ((quarterTurns % 4) + 4) % 4;
    if (q === 1 || q === 3) return { w: h, h: w };
    return { w: w, h: h };
  }

  // Resolve output mime: 'keep' maps from the original file type.
  function resolveMime(formatId, originalType) {
    if (formatId === 'keep') {
      if (originalType === 'image/gif') return 'image/png'; // GIF re-encodes as PNG (first frame)
      return ACCEPTED_TYPES.indexOf(originalType) !== -1 ? originalType : 'image/png';
    }
    var f = FORMATS[formatId];
    return f && f.mime ? f.mime : 'image/png';
  }

  function extensionFor(mime) {
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/gif') return 'gif';
    return 'png';
  }

  // Validate a file-like {type, size} before any processing.
  function validateFile(file) {
    if (!file || typeof file !== 'object') return 'No file was provided.';
    if (ACCEPTED_TYPES.indexOf(file.type) === -1) {
      return 'Unsupported file type. Please choose a JPG, PNG, WebP or GIF image.';
    }
    if (!(file.size > 0)) return 'That file appears to be empty.';
    if (file.size > MAX_FILE_BYTES) return 'File is over the 10 MB limit.';
    return null;
  }

  // Human size: B / KB / MB, 2 decimals max, trailing zeros trimmed.
  function formatBytes(bytes) {
    if (!(bytes >= 0) || !isFinite(bytes)) return '0 B';
    if (bytes < 1024) return Math.round(bytes) + ' B';
    if (bytes < 1024 * 1024) return trimNum(bytes / 1024) + ' KB';
    return trimNum(bytes / (1024 * 1024)) + ' MB';
  }
  function trimNum(n) {
    var s = n.toFixed(2);
    return s.replace(/\.?0+$/, '');
  }

  // Output filename: original base + "-resized" + new extension.
  function outputName(originalName, mime) {
    var base = String(originalName || 'image').replace(/\.[^.]*$/, '') || 'image';
    return base + '-resized.' + extensionFor(mime);
  }

  var api = {
    MAX_FILE_BYTES: MAX_FILE_BYTES,
    ACCEPTED_TYPES: ACCEPTED_TYPES,
    FORMATS: FORMATS,
    clampInt: clampInt,
    aspectLocked: aspectLocked,
    fitInside: fitInside,
    percentResize: percentResize,
    rotatedDims: rotatedDims,
    resolveMime: resolveMime,
    extensionFor: extensionFor,
    validateFile: validateFile,
    formatBytes: formatBytes,
    outputName: outputName
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.IR_LOGIC = api;
})(typeof window !== 'undefined' ? window : globalThis);
