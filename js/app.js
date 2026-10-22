/* image-resizer-bd -- UI logic. All processing is local (canvas + FileReader).
   No network requests. No uploads. */
(function () {
  'use strict';
  var L = window.IR_LOGIC;

  var I18N = {
    en: {
      appTitle: 'Image Resizer BD',
      tagline: 'Resize, convert and compress your images \u2014 fully offline.',
      privacy: 'Your file never leaves this device. Everything is processed in your browser \u2014 nothing is uploaded.',
      dropHere: 'Drop an image here or choose a file',
      dropHint: 'JPG, PNG, WebP or GIF \u2014 up to 10 MB',
      chooseFile: 'Choose image',
      original: 'Original',
      name: 'Name',
      dimensions: 'Dimensions',
      fileSize: 'File size',
      format: 'Format',
      gifNote: 'GIF note: only the first frame is processed.',
      settings: 'Resize settings',
      fitMode: 'Size mode',
      modeExact: 'Exact width & height',
      modeFit: 'Fit inside max side',
      width: 'Width (px)',
      height: 'Height (px)',
      lockAspect: 'Lock aspect ratio',
      maxSide: 'Max side (fit-inside mode, px)',
      percent: 'Scale',
      outFormat: 'Output format',
      fmtKeep: 'Keep original',
      fmtPng: 'PNG',
      fmtJpeg: 'JPEG',
      fmtWebp: 'WebP',
      quality: 'Quality (JPEG / WebP)',
      rotateLeft: 'Rotate 90 left',
      rotateRight: 'Rotate 90 right',
      flipH: 'Flip horizontal',
      flipV: 'Flip vertical',
      process: 'Resize image',
      reset: 'Reset',
      output: 'Result',
      saved: 'Saved vs original',
      download: 'Download resized image',
      emptyState: 'No image yet. Choose an image above to start resizing.',
      footer: '100% offline \u2014 no uploads, no accounts, no tracking.',
      rotLabel: 'Rotation',
      flipLabel: 'Flip',
      noneLabel: 'none',
      horiz: 'horizontal',
      vert: 'vertical',
      both: 'horizontal + vertical',
      smaller: 'smaller',
      larger: 'larger',
      errLoad: 'Could not read that image. Please try another file.',
      errCanvas: 'Could not process this image in this browser.',
      errNoImage: 'Choose an image first.',
      errDims: 'Width and height must be between 1 and 10000.'
    },
    bn: {
      appTitle: '\u099b\u09ac\u09bf \u09b0\u09bf\u09b8\u09be\u0987\u099c\u09be\u09b0 \u09ac\u09bf\u09a1\u09bf',
      tagline: '\u099b\u09ac\u09bf \u09b0\u09bf\u09b8\u09be\u0987\u099c, \u0995\u09a8\u09ad\u09be\u09b0\u09cd\u099f \u0993 \u0995\u09ae\u09aa\u09cd\u09b0\u09c7\u09b8 \u0995\u09b0\u09c1\u09a8 \u2014 \u09b8\u09ae\u09cd\u09aa\u09c2\u09b0\u09cd\u09a3 \u0985\u09ab\u09b2\u09be\u0987\u09a8\u0964',
      privacy: '\u0986\u09aa\u09a8\u09be\u09b0 \u09ab\u09be\u0987\u09b2 \u098f\u0987 \u09a1\u09bf\u09ad\u09be\u0987\u09b8 \u099b\u09be\u09a1\u09bc\u09c7 \u09a8\u09be\u0964 \u09b8\u09ac\u0995\u09bf\u099b\u09c1 \u0986\u09aa\u09a8\u09be\u09b0 \u09ac\u09cd\u09b0\u09be\u0989\u099c\u09be\u09b0\u09c7\u0987 \u09aa\u09cd\u09b0\u09b8\u09c7\u09b8 \u09b9\u09af\u09bc \u2014 \u0995\u09bf\u099b\u09c1\u0987 \u0986\u09aa\u09b2\u09cb\u09a1 \u09b9\u09af\u09bc \u09a8\u09be\u0964',
      dropHere: '\u098f\u0996\u09be\u09a8\u09c7 \u099b\u09ac\u09bf \u09ab\u09c7\u09b2\u09c1\u09a8 \u0985\u09a5\u09ac\u09be \u09ab\u09be\u0987\u09b2 \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8',
      dropHint: 'JPG, PNG, WebP \u0985\u09a5\u09ac\u09be GIF \u2014 \u09b8\u09b0\u09cd\u09ac\u09cb\u099a\u09cd\u099a \u09e7\u09e6 MB',
      chooseFile: '\u099b\u09ac\u09bf \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8',
      original: '\u09ae\u09c2\u09b2 \u099b\u09ac\u09bf',
      name: '\u09a8\u09be\u09ae',
      dimensions: '\u09ae\u09be\u09a4\u09cd\u09b0\u09be',
      fileSize: '\u09ab\u09be\u0987\u09b2\u09c7\u09b0 \u0986\u0995\u09be\u09b0',
      format: '\u09ab\u09b0\u09ae\u09cd\u09af\u09be\u099f',
      gifNote: 'GIF \u09a8\u09cb\u099f: \u09b6\u09c1\u09a7\u09c1 \u09aa\u09cd\u09b0\u09a5\u09ae \u09ab\u09cd\u09b0\u09c7\u09ae \u09aa\u09cd\u09b0\u09b8\u09c7\u09b8 \u0995\u09b0\u09be \u09b9\u09af\u09bc\u0964',
      settings: '\u09b0\u09bf\u09b8\u09be\u0987\u099c \u09b8\u09c7\u099f\u09bf\u0982\u09b8',
      fitMode: '\u09b8\u09be\u0987\u099c \u09ae\u09cb\u09a1',
      modeExact: '\u09b8\u09a0\u09bf\u0995 \u09aa\u09cd\u09b0\u09b8\u09cd\u09a5 \u0993 \u0989\u099a\u09cd\u099a\u09a4\u09be',
      modeFit: '\u09b8\u09b0\u09cd\u09ac\u09cb\u099a\u09cd\u099a \u09ac\u09be\u09b9\u09c1\u09b0 \u09ae\u09a7\u09cd\u09af\u09c7 \u09ab\u09bf\u099f',
      width: '\u09aa\u09cd\u09b0\u09b8\u09cd\u09a5 (px)',
      height: '\u0989\u099a\u09cd\u099a\u09a4\u09be (px)',
      lockAspect: '\u0986\u09b8\u09aa\u09c7\u0995\u09cd\u099f \u09b0\u09c7\u09b6\u09bf\u0993 \u09b2\u0995',
      maxSide: '\u09b8\u09b0\u09cd\u09ac\u09cb\u099a\u09cd\u099a \u09ac\u09be\u09b9\u09c1 (\u09ab\u09bf\u099f-\u0987\u09a8\u09b8\u09be\u0987\u09a1 \u09ae\u09cb\u09a1, px)',
      percent: '\u09b8\u09cd\u0995\u09c7\u09b2',
      outFormat: '\u0986\u0989\u099f\u09aa\u09c1\u099f \u09ab\u09b0\u09ae\u09cd\u09af\u09be\u099f',
      fmtKeep: '\u09ae\u09c2\u09b2 \u09ab\u09b0\u09ae\u09cd\u09af\u09be\u099f \u09b0\u09be\u0996\u09c1\u09a8',
      fmtPng: 'PNG',
      fmtJpeg: 'JPEG',
      fmtWebp: 'WebP',
      quality: '\u0995\u09cb\u09af\u09bc\u09be\u09b2\u09bf\u099f\u09bf (JPEG / WebP)',
      rotateLeft: '\u09ac\u09be\u09ae\u09c7 \u09ef\u09e6\u00b0 \u0998\u09cb\u09b0\u09be\u09a8',
      rotateRight: '\u09a1\u09be\u09a8\u09c7 \u09ef\u09e6\u00b0 \u0998\u09cb\u09b0\u09be\u09a8',
      flipH: '\u0985\u09a8\u09c1\u09ad\u09c2\u09ae\u09bf\u0995 \u0989\u09b2\u09cd\u099f\u09be\u09a8',
      flipV: '\u0989\u09b2\u09cd\u09b2\u09ae\u09cd\u09ac \u0989\u09b2\u09cd\u099f\u09be\u09a8',
      process: '\u099b\u09ac\u09bf \u09b0\u09bf\u09b8\u09be\u0987\u099c \u0995\u09b0\u09c1\u09a8',
      reset: '\u09b0\u09bf\u09b8\u09c7\u099f',
      output: '\u09ab\u09b2\u09be\u09ab\u09b2',
      saved: '\u09ae\u09c2\u09b2 \u099b\u09ac\u09bf\u09b0 \u09a4\u09c1\u09b2\u09a8\u09be\u09af\u09bc \u09b8\u09be\u09b6\u09cd\u09b0\u09af\u09bc',
      download: '\u09b0\u09bf\u09b8\u09be\u0987\u099c \u0995\u09b0\u09be \u099b\u09ac\u09bf \u09a1\u09be\u0989\u09a8\u09b2\u09cb\u09a1 \u0995\u09b0\u09c1\u09a8',
      emptyState: '\u098f\u0996\u09a8\u09cb \u0995\u09cb\u09a8\u09cb \u099b\u09ac\u09bf \u09a8\u09c7\u0987\u0964 \u09b0\u09bf\u09b8\u09be\u0987\u099c \u09b6\u09c1\u09b0\u09c1 \u0995\u09b0\u09a4\u09c7 \u0989\u09aa\u09b0\u09c7 \u099b\u09ac\u09bf \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8\u0964',
      footer: '\u09e7\u09e6\u09e6% \u0985\u09ab\u09b2\u09be\u0987\u09a8 \u2014 \u0995\u09cb\u09a8\u09cb \u0986\u09aa\u09b2\u09cb\u09a1, \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09ac\u09be \u099f\u09cd\u09b0\u09cd\u09af\u09be\u0995\u09bf\u0982 \u09a8\u09c7\u0987\u0964',
      rotLabel: '\u0998\u09c2\u09b0\u09cd\u09a3\u09a8',
      flipLabel: '\u0989\u09b2\u09cd\u099f\u09be\u09a8\u09cb',
      noneLabel: '\u09a8\u09c7\u0987',
      horiz: '\u0985\u09a8\u09c1\u09ad\u09c2\u09ae\u09bf\u0995',
      vert: '\u0989\u09b2\u09cd\u09b2\u09ae\u09cd\u09ac',
      both: '\u0985\u09a8\u09c1\u09ad\u09c2\u09ae\u09bf\u0995 + \u0989\u09b2\u09cd\u09b2\u09ae\u09cd\u09ac',
      smaller: '\u099b\u09cb\u099f',
      larger: '\u09ac\u09a1\u09bc',
      errLoad: '\u099b\u09ac\u09bf\u099f\u09bf \u09aa\u09a1\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964 \u0985\u09a8\u09cd\u09af \u098f\u0995\u099f\u09bf \u09ab\u09be\u0987\u09b2 \u099a\u09c7\u09b7\u09cd\u099f\u09be \u0995\u09b0\u09c1\u09a8\u0964',
      errCanvas: '\u098f\u0987 \u09ac\u09cd\u09b0\u09be\u0989\u099c\u09be\u09b0\u09c7 \u099b\u09ac\u09bf\u099f\u09bf \u09aa\u09cd\u09b0\u09b8\u09c7\u09b8 \u0995\u09b0\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964',
      errNoImage: '\u0986\u0997\u09c7 \u098f\u0995\u099f\u09bf \u099b\u09ac\u09bf \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8\u0964',
      errDims: '\u09aa\u09cd\u09b0\u09b8\u09cd\u09a5 \u0993 \u0989\u099a\u09cd\u099a\u09a4\u09be \u09e7 \u09a5\u09c7\u0995\u09c7 \u09e7\u09e6\u09e6\u09e6\u09e6-\u098f\u09b0 \u09ae\u09a7\u09cd\u09af\u09c7 \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964'
    }
  };

  var BN_DIGITS = ['\u09e6', '\u09e7', '\u09e8', '\u09e9', '\u09ea', '\u09eb', '\u09ec', '\u09ed', '\u09ee', '\u09ef'];
  var lang = 'en';
  try { lang = localStorage.getItem('ir-lang') === 'bn' ? 'bn' : 'en'; } catch (e) { lang = 'en'; }

  function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key; }
  function num(n) {
    var s = String(n);
    if (lang !== 'bn') return s;
    return s.replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }
  function dimsStr(w, h) { return num(w) + ' \u00d7 ' + num(h) + ' px'; }

  function $(id) { return document.getElementById(id); }
  function show(el, on) { el.hidden = !on; }
  function showError(el, msg) {
    if (!msg) { el.hidden = true; el.textContent = ''; return; }
    el.textContent = msg; el.hidden = false;
  }

  var state = {
    file: null, img: null, origW: 0, origH: 0,
    rotation: 0, flipH: false, flipV: false,
    origUrl: null, outUrl: null
  };

  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.documentElement.lang = lang;
    $('langBtn').textContent = lang === 'en' ? 'BN' : 'EN';
    try { localStorage.setItem('ir-lang', lang); } catch (e) { /* ignore */ }
    refreshDynamicText();
  }

  function refreshDynamicText() {
    $('percentVal').textContent = num($('percentInput').value) + '%';
    $('qualityVal').textContent = num($('qualityInput').value);
    if (state.img) {
      $('origDims').textContent = dimsStr(state.origW, state.origH);
      $('origSize').textContent = num(L.formatBytes(state.file.size));
    }
    updateTransformState();
  }

  function updateTransformState() {
    var deg = state.rotation * 90;
    var flip = state.flipH && state.flipV ? t('both')
      : state.flipH ? t('horiz')
      : state.flipV ? t('vert') : t('noneLabel');
    $('transformState').textContent =
      t('rotLabel') + ': ' + num(deg) + '\u00b0, ' + t('flipLabel') + ': ' + flip + '.';
  }

  function effectiveMime() {
    return L.resolveMime($('formatSelect').value, state.file ? state.file.type : 'image/png');
  }
  function updateQualityState() {
    var mime = effectiveMime();
    $('qualityInput').disabled = !(mime === 'image/jpeg' || mime === 'image/webp');
  }

  function handleFile(file) {
    showError($('fileError'), null);
    var err = L.validateFile(file);
    if (err) { showError($('fileError'), lang === 'en' ? err : t('errLoad')); return; }
    if (state.origUrl) URL.revokeObjectURL(state.origUrl);
    state.origUrl = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      state.file = file;
      state.img = img;
      state.origW = img.naturalWidth;
      state.origH = img.naturalHeight;
      state.rotation = 0; state.flipH = false; state.flipV = false;
      $('origImg').src = state.origUrl;
      $('origImg').alt = file.name;
      $('origName').textContent = file.name;
      $('origDims').textContent = dimsStr(state.origW, state.origH);
      $('origSize').textContent = num(L.formatBytes(file.size));
      $('origFormat').textContent = file.type || '-';
      show($('gifNote'), file.type === 'image/gif');
      $('widthInput').value = state.origW;
      $('heightInput').value = state.origH;
      $('percentInput').value = 100;
      show($('originalSection'), true);
      show($('controlsSection'), true);
      show($('emptyState'), false);
      show($('outputSection'), false);
      updateQualityState();
      updateTransformState();
      refreshDynamicText();
    };
    img.onerror = function () {
      URL.revokeObjectURL(state.origUrl);
      state.origUrl = null;
      showError($('fileError'), t('errLoad'));
    };
    img.src = state.origUrl;
  }

  function targetDims() {
    var mode = document.querySelector('input[name="fitMode"]:checked').value;
    if (mode === 'fit') {
      var fit = L.fitInside(state.origW, state.origH, $('maxSideInput').value);
      if (fit) { $('widthInput').value = fit.w; $('heightInput').value = fit.h; }
      return fit;
    }
    var w = L.clampInt($('widthInput').value, 1, 10000, 0);
    var h = L.clampInt($('heightInput').value, 1, 10000, 0);
    if (!w || !h) return null;
    return { w: w, h: h };
  }

  function process() {
    showError($('processError'), null);
    if (!state.img) { showError($('processError'), t('errNoImage')); return; }
    var dims = targetDims();
    if (!dims) { showError($('processError'), t('errDims')); return; }
    var final = L.rotatedDims(dims.w, dims.h, state.rotation);
    var mime = effectiveMime();
    var canvas = document.createElement('canvas');
    canvas.width = final.w;
    canvas.height = final.h;
    var ctx = canvas.getContext('2d');
    if (!ctx) { showError($('processError'), t('errCanvas')); return; }
    ctx.save();
    ctx.translate(final.w / 2, final.h / 2);
    ctx.rotate(state.rotation * Math.PI / 2);
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
    ctx.drawImage(state.img, -dims.w / 2, -dims.h / 2, dims.w, dims.h);
    ctx.restore();
    var quality = L.clampInt($('qualityInput').value, 10, 100, 85) / 100;
    var done = function (blob) {
      if (!blob) { showError($('processError'), t('errCanvas')); return; }
      if (state.outUrl) URL.revokeObjectURL(state.outUrl);
      state.outUrl = URL.createObjectURL(blob);
      $('outImg').src = state.outUrl;
      $('outImg').alt = L.outputName(state.file.name, mime);
      $('outDims').textContent = dimsStr(final.w, final.h);
      $('outSize').textContent = num(L.formatBytes(blob.size));
      $('outFormat').textContent = mime;
      var diff = Math.round((1 - blob.size / state.file.size) * 100);
      var word = diff >= 0 ? t('smaller') : t('larger');
      $('savedPct').textContent = num(Math.abs(diff)) + '% ' + word;
      var link = $('downloadLink');
      link.href = state.outUrl;
      link.setAttribute('download', L.outputName(state.file.name, mime));
      show($('outputSection'), true);
    };
    if (mime === 'image/jpeg' || mime === 'image/webp') {
      canvas.toBlob(done, mime, quality);
    } else {
      canvas.toBlob(done, mime);
    }
  }

  function resetAll() {
    if (state.origUrl) URL.revokeObjectURL(state.origUrl);
    if (state.outUrl) URL.revokeObjectURL(state.outUrl);
    state.file = null; state.img = null; state.origW = 0; state.origH = 0;
    state.rotation = 0; state.flipH = false; state.flipV = false;
    state.origUrl = null; state.outUrl = null;
    $('fileInput').value = '';
    show($('originalSection'), false);
    show($('controlsSection'), false);
    show($('outputSection'), false);
    show($('emptyState'), true);
    showError($('fileError'), null);
    showError($('processError'), null);
    $('percentInput').value = 100;
    $('qualityInput').value = 85;
    $('formatSelect').value = 'keep';
    document.querySelector('input[name="fitMode"][value="exact"]').checked = true;
    refreshDynamicText();
  }

  // ---- wiring ----
  $('langBtn').addEventListener('click', function () {
    lang = lang === 'en' ? 'bn' : 'en';
    applyLang();
  });
  $('fileInput').addEventListener('change', function () {
    if (this.files && this.files[0]) handleFile(this.files[0]);
    this.value = '';
  });
  var dz = $('dropzone');
  dz.addEventListener('click', function (e) {
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'SPAN') $('fileInput').click();
  });
  dz.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('fileInput').click(); }
  });
  dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', function () { dz.classList.remove('drag'); });
  dz.addEventListener('drop', function (e) {
    e.preventDefault();
    dz.classList.remove('drag');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  $('widthInput').addEventListener('input', function () {
    if (!state.img) return;
    if ($('lockAspect').checked && document.querySelector('input[name="fitMode"]:checked').value === 'exact') {
      var r = L.aspectLocked(state.origW, state.origH, 'w', this.value);
      if (r) $('heightInput').value = r.h;
    }
  });
  $('heightInput').addEventListener('input', function () {
    if (!state.img) return;
    if ($('lockAspect').checked && document.querySelector('input[name="fitMode"]:checked').value === 'exact') {
      var r = L.aspectLocked(state.origW, state.origH, 'h', this.value);
      if (r) $('widthInput').value = r.w;
    }
  });
  $('percentInput').addEventListener('input', function () {
    $('percentVal').textContent = num(this.value) + '%';
    if (!state.img) return;
    var r = L.percentResize(state.origW, state.origH, this.value);
    if (r) { $('widthInput').value = r.w; $('heightInput').value = r.h; }
  });
  $('maxSideInput').addEventListener('input', function () {
    if (!state.img) return;
    if (document.querySelector('input[name="fitMode"]:checked').value === 'fit') {
      var r = L.fitInside(state.origW, state.origH, this.value);
      if (r) { $('widthInput').value = r.w; $('heightInput').value = r.h; }
    }
  });
  $('formatSelect').addEventListener('change', updateQualityState);
  $('qualityInput').addEventListener('input', function () {
    $('qualityVal').textContent = num(this.value);
  });
  $('rotateLeftBtn').addEventListener('click', function () {
    state.rotation = (state.rotation + 3) % 4; updateTransformState();
  });
  $('rotateRightBtn').addEventListener('click', function () {
    state.rotation = (state.rotation + 1) % 4; updateTransformState();
  });
  $('flipHBtn').addEventListener('click', function () {
    state.flipH = !state.flipH; updateTransformState();
  });
  $('flipVBtn').addEventListener('click', function () {
    state.flipV = !state.flipV; updateTransformState();
  });
  $('processBtn').addEventListener('click', process);
  $('resetBtn').addEventListener('click', resetAll);

  applyLang();
})();
