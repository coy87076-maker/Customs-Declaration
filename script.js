// ── Apps script ───────────────────────
const SCRIPT_URL = '';

// ── Generate reference number ─────────────────────────────────────────────
function generateRef() {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(2);
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const dd  = String(now.getDate()).padStart(2, '0');
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `REF-${yy}${mm}${dd}-${rnd}`;
}

// ── Set today's date in header ────────────────────────────────────────────
const ref = generateRef();
document.getElementById('refNumber').textContent = ref;
document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric'
});

// ── Shipment type toggle ──────────────────────────────────────────────────
function setType(type) {
  document.getElementById('shipmentType').value = type;
  document.getElementById('btnImport').classList.toggle('active', type === 'Import');
  document.getElementById('btnExport').classList.toggle('active', type === 'Export');
}

// ── Volumetric weight calculator ──────────────────────────────────────────
// Formula: (L × W × H) / 5000
['length', 'width', 'height'].forEach(function(id) {
  document.getElementById(id).addEventListener('input', calcVolWeight);
});

function calcVolWeight() {
  const l = parseFloat(document.getElementById('length').value);
  const w = parseFloat(document.getElementById('width').value);
  const h = parseFloat(document.getElementById('height').value);

  if (!isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0) {
    const vol = ((l * w * h) / 5000).toFixed(2);
    document.getElementById('volWeight').textContent = vol + ' kg';
  } else {
    document.getElementById('volWeight').textContent = '—';
  }
}

// ── Form submit ───────────────────────────────────────────────────────────
document.getElementById('customsForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const data = {
    refNumber:       ref,
    shipmentType:    document.getElementById('shipmentType').value,
    senderName:      document.getElementById('senderName').value.trim(),
    senderAddress:   document.getElementById('senderAddress').value.trim(),
    senderCountry:   document.getElementById('senderCountry').value.trim(),
    senderContact:   document.getElementById('senderContact').value.trim(),
    receiverName:    document.getElementById('receiverName').value.trim(),
    receiverAddress: document.getElementById('receiverAddress').value.trim(),
    receiverCountry: document.getElementById('receiverCountry').value.trim(),
    receiverContact: document.getElementById('receiverContact').value.trim(),
    description:     document.getElementById('description').value.trim(),
    weight:          parseFloat(document.getElementById('weight').value),
    length:          parseFloat(document.getElementById('length').value),
    width:           parseFloat(document.getElementById('width').value),
    height:          parseFloat(document.getElementById('height').value),
    volWeight:       document.getElementById('volWeight').textContent,
    declaredValue:   parseFloat(document.getElementById('declaredValue').value)
  };

  // Validation
  if (!data.senderName || !data.senderAddress || !data.senderCountry ||
      !data.receiverName || !data.receiverAddress || !data.receiverCountry ||
      !data.description || isNaN(data.weight) || isNaN(data.length) ||
      isNaN(data.width) || isNaN(data.height) || isNaN(data.declaredValue)) {
    showStatus('Please fill out all fields before submitting.', 'error');
    return;
  }

  showResult(data);
  syncToSheet(data);
});

// ── Show result card ──────────────────────────────────────────────────────
function showResult(data) {
  document.getElementById('resultRef').textContent      = data.refNumber;
  document.getElementById('resultTitle').textContent    = data.description;
  document.getElementById('resultSub').textContent      = data.shipmentType + ' · Declared value: $' + data.declaredValue.toFixed(2);
  document.getElementById('rType').textContent          = data.shipmentType;
  document.getElementById('rWeight').textContent        = data.weight + ' kg';
  document.getElementById('rDims').textContent          = data.length + '×' + data.width + '×' + data.height + ' cm';
  document.getElementById('rVol').textContent           = data.volWeight;
  document.getElementById('rValue').textContent         = '$' + data.declaredValue.toFixed(2);
  document.getElementById('rSenderName').textContent    = data.senderName;
  document.getElementById('rSenderAddr').textContent    = data.senderAddress;
  document.getElementById('rSenderCountry').textContent = data.senderCountry;
  document.getElementById('rReceiverName').textContent  = data.receiverName;
  document.getElementById('rReceiverAddr').textContent  = data.receiverAddress;
  document.getElementById('rReceiverCountry').textContent = data.receiverCountry;

  const card = document.getElementById('resultCard');
  card.classList.add('visible');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Sync to Google Sheet via FormData POST ────────────────────────────────
function syncToSheet(data) {
  const form = document.getElementById('sheetForm');
  Object.keys(data).forEach(function(key) {
    if (form[key]) form[key].value = data[key];
  });

  showStatus('Saving to Google Sheet…', 'info');

  fetch(SCRIPT_URL, { method: 'POST', body: new FormData(form) })
    .then(function(r) { return r.text(); })
    .then(function()  { showStatus('Declaration saved to Google Sheet.', 'success'); })
    .catch(function() { showStatus('Saved locally but sheet sync failed. Check your network.', 'error'); });
}

// ── Status bar ────────────────────────────────────────────────────────────
function showStatus(msg, type) {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = 'status-msg ' + type;
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.className = 'status-msg'; }, 5000);
}

// ── Reset form ────────────────────────────────────────────────────────────
function resetForm() {
  document.getElementById('customsForm').reset();
  document.getElementById('volWeight').textContent = '—';
  document.getElementById('resultCard').classList.remove('visible');
  document.getElementById('statusMsg').className = 'status-msg';

  // Generate a new reference number
  const newRef = generateRef();
  document.getElementById('refNumber').textContent = newRef;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
