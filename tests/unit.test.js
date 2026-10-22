/* image-resizer-bd -- node unit tests for js/logic.js (pure math).
   Usage: node tests/unit.test.js */
'use strict';
const assert = require('node:assert');
const L = require('../js/logic.js');

let passed = 0;
function check(name, cond) {
  assert.ok(cond, 'FAIL: ' + name);
  passed += 1;
  console.log('ok - ' + name);
}

// aspectLocked: 800x600, width 400 -> height 300 (task spec case)
check('aspectLocked w 800x600 -> 400 = 400x300', (() => {
  const r = L.aspectLocked(800, 600, 'w', 400);
  return r && r.w === 400 && r.h === 300;
})());
check('aspectLocked h 800x600 -> 150 = 200x150', (() => {
  const r = L.aspectLocked(800, 600, 'h', 150);
  return r && r.w === 200 && r.h === 150;
})());
check('aspectLocked rounding 1000x333 w=333 -> h=111', (() => {
  const r = L.aspectLocked(1000, 333, 'w', 333);
  return r && r.h === 111;
})());
check('aspectLocked invalid dims -> null', L.aspectLocked(0, 600, 'w', 100) === null);
check('aspectLocked bad value -> null', L.aspectLocked(800, 600, 'w', 'abc') === null);

// fitInside: never upscale, larger side = maxDim
check('fitInside 1600x900 max 800 -> 800x450', (() => {
  const r = L.fitInside(1600, 900, 800);
  return r && r.w === 800 && r.h === 450;
})());
check('fitInside 400x300 max 800 -> unchanged (no upscale)', (() => {
  const r = L.fitInside(400, 300, 800);
  return r && r.w === 400 && r.h === 300;
})());
check('fitInside portrait 600x1200 max 300 -> 150x300', (() => {
  const r = L.fitInside(600, 1200, 300);
  return r && r.w === 150 && r.h === 300;
})());
check('fitInside invalid -> null', L.fitInside(800, 600, 0) === null);

// percentResize: task spec 800x600 -> 50% = 400x300
check('percentResize 800x600 @50% = 400x300', (() => {
  const r = L.percentResize(800, 600, 50);
  return r && r.w === 400 && r.h === 300;
})());
check('percentResize 800x600 @200% = 1600x1200', (() => {
  const r = L.percentResize(800, 600, 200);
  return r && r.w === 1600 && r.h === 1200;
})());
check('percentResize out of range -> null', L.percentResize(800, 600, 5) === null);
check('percentResize 10% floor allowed', (() => {
  const r = L.percentResize(800, 600, 10);
  return r && r.w === 80 && r.h === 60;
})());

// rotatedDims
check('rotatedDims 400x300 +1 quarter -> 300x400', (() => {
  const r = L.rotatedDims(400, 300, 1);
  return r.w === 300 && r.h === 400;
})());
check('rotatedDims 400x300 +2 quarters -> 400x300', (() => {
  const r = L.rotatedDims(400, 300, 2);
  return r.w === 400 && r.h === 300;
})());
check('rotatedDims negative -1 -> 300x400', (() => {
  const r = L.rotatedDims(400, 300, -1);
  return r.w === 300 && r.h === 400;
})());

// resolveMime / extensionFor
check('resolveMime keep jpeg -> jpeg', L.resolveMime('keep', 'image/jpeg') === 'image/jpeg');
check('resolveMime keep gif -> png (first frame)', L.resolveMime('keep', 'image/gif') === 'image/png');
check('resolveMime webp -> webp', L.resolveMime('webp', 'image/jpeg') === 'image/webp');
check('resolveMime bad format -> png', L.resolveMime('bogus', 'image/jpeg') === 'image/png');
check('extensionFor jpeg -> jpg', L.extensionFor('image/jpeg') === 'jpg');
check('extensionFor webp -> webp', L.extensionFor('image/webp') === 'webp');
check('extensionFor png -> png', L.extensionFor('image/png') === 'png');

// validateFile
check('validateFile valid png -> null', L.validateFile({ type: 'image/png', size: 1024 }) === null);
check('validateFile pdf rejected', typeof L.validateFile({ type: 'application/pdf', size: 1024 }) === 'string');
check('validateFile empty rejected', typeof L.validateFile({ type: 'image/png', size: 0 }) === 'string');
check('validateFile 11MB rejected', typeof L.validateFile({ type: 'image/jpeg', size: 11 * 1024 * 1024 }) === 'string');
check('validateFile exactly 10MB allowed', L.validateFile({ type: 'image/jpeg', size: 10 * 1024 * 1024 }) === null);
check('validateFile null rejected', typeof L.validateFile(null) === 'string');

// formatBytes
check('formatBytes 0 -> 0 B', L.formatBytes(0) === '0 B');
check('formatBytes 512 -> 512 B', L.formatBytes(512) === '512 B');
check('formatBytes 1536 -> 1.5 KB', L.formatBytes(1536) === '1.5 KB');
check('formatBytes 2048 -> 2 KB', L.formatBytes(2048) === '2 KB');
check('formatBytes 1.5MB -> 1.5 MB', L.formatBytes(1572864) === '1.5 MB');

// outputName
check('outputName photo.jpg + webp -> photo-resized.webp', L.outputName('photo.jpg', 'image/webp') === 'photo-resized.webp');
check('outputName no ext + png -> image-resized.png', L.outputName('image', 'image/png') === 'image-resized.png');
check('outputName multi.dot.name.jpeg + jpeg -> multi.dot.name-resized.jpg', L.outputName('multi.dot.name.jpeg', 'image/jpeg') === 'multi.dot.name-resized.jpg');

// clampInt
check('clampInt floors 99.9 -> 99', L.clampInt(99.9, 1, 10000, 0) === 99);
check('clampInt clamps above max', L.clampInt(99999, 1, 10000, 0) === 10000);
check('clampInt NaN -> fallback', L.clampInt('x', 1, 10000, 42) === 42);

console.log('UNIT PASS: ' + passed + ' checks');
