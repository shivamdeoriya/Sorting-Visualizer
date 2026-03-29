// ─── COMPLEXITY DATA ───────────────────────────────────────
const ALGO_INFO = {
  bubble:    { name:"Bubble Sort",    timeW:"O(n²)", timeA:"O(n²)", timeB:"O(n)", space:"O(1)",    stable:"Yes", inplace:"Yes" },
  selection: { name:"Selection Sort", timeW:"O(n²)", timeA:"O(n²)", timeB:"O(n²)",space:"O(1)",   stable:"No",  inplace:"Yes" },
  insertion: { name:"Insertion Sort", timeW:"O(n²)", timeA:"O(n²)", timeB:"O(n)", space:"O(1)",    stable:"Yes", inplace:"Yes" },
  merge:     { name:"Merge Sort",     timeW:"O(n log n)", timeA:"O(n log n)", timeB:"O(n log n)", space:"O(n)", stable:"Yes", inplace:"No" },
  quick:     { name:"Quick Sort",     timeW:"O(n²)", timeA:"O(n log n)", timeB:"O(n log n)", space:"O(log n)", stable:"No", inplace:"Yes" },
};

// ─── STATE ──────────────────────────────────────────────────
let array = [];
let bars = [];
let isSorting = false;
let stopRequested = false;
let selectedAlgo = "bubble";
let comparisons = 0;

const SPEED_MAP = { 1:400, 2:180, 3:70, 4:20, 5:2 };

// ─── DOM REFS ───────────────────────────────────────────────
const container   = document.getElementById("array-container");
const sortBtn     = document.getElementById("sort-btn");
const stopBtn     = document.getElementById("stop-btn");
const resetBtn    = document.getElementById("reset-btn");
const generateBtn = document.getElementById("generate-btn");
const setArrayBtn = document.getElementById("set-array-btn");
const customInput = document.getElementById("custom-input");
const sizeSlider  = document.getElementById("size");
const speedSlider = document.getElementById("speed");
const statusText  = document.getElementById("status-text");
const comparisonsEl = document.getElementById("comparisons-count");

// ─── UTILITIES ───────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDelay() {
  return SPEED_MAP[speedSlider.value] || 50;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setStatus(msg) {
  statusText.innerHTML = msg;
}

function updateComparisons() {
  comparisonsEl.textContent = `Comparisons: ${comparisons}`;
}

// ─── ARRAY & BARS ─────────────────────────────────────────────
function generateArray() {
  const n = parseInt(sizeSlider.value);
  array = Array.from({ length: n }, () => randomInt(5, 100));
  renderBars();
  resetState();
}

function setCustomArray() {
  const raw = customInput.value.trim();
  if (!raw) return;
  const parsed = raw.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x) && x > 0);
  if (parsed.length < 2) { setStatus('<span style="color:var(--bar-move)">Invalid array. Use comma-separated positive numbers.</span>'); return; }
  const clamped = parsed.map(v => Math.min(100, Math.max(1, v)));
  array = clamped;
  renderBars();
  resetState();
}

function renderBars() {
  container.innerHTML = "";
  bars = [];
  const maxVal = Math.max(...array);
  array.forEach(val => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${(val / maxVal) * 100}%`;
    container.appendChild(bar);
    bars.push(bar);
  });
}

function resetState() {
  comparisons = 0;
  updateComparisons();
  setStatus('Select an algorithm and press <span>Sort</span>');
  bars.forEach(b => { b.className = "bar"; });
}

function updateBar(i, val) {
  const maxVal = Math.max(...array);
  bars[i].style.height = `${(val / Math.max(...array, 1)) * 100}%`;
}

function markClass(indices, cls) {
  indices.forEach(i => {
    if (i >= 0 && i < bars.length) {
      bars[i].classList.remove("comparing","moving","sorted","pivot");
      if (cls) bars[i].classList.add(cls);
    }
  });
}

function markSorted(...indices) { markClass(indices, "sorted"); }
function markComparing(...indices) { markClass(indices, "comparing"); }
function markMoving(...indices) { markClass(indices, "moving"); }
function markDefault(...indices) { markClass(indices, null); }
function markPivot(i) { if(i>=0&&i<bars.length){bars[i].classList.remove("comparing","moving","sorted"); bars[i].classList.add("pivot");} }

async function swapBars(i, j) {
  [array[i], array[j]] = [array[j], array[i]];
  const maxVal = Math.max(...array);
  bars[i].style.height = `${(array[i] / maxVal) * 100}%`;
  bars[j].style.height = `${(array[j] / maxVal) * 100}%`;
}

function setBarHeight(i, val) {
  const maxVal = Math.max(...array);
  array[i] = val;
  bars[i].style.height = `${(val / maxVal) * 100}%`;
}

// ─── LOCK/UNLOCK ─────────────────────────────────────────────
function lockUI() {
  isSorting = true;
  stopRequested = false;
  sortBtn.disabled = true;
  stopBtn.disabled = false;
  resetBtn.disabled = true;
  generateBtn.disabled = true;
  setArrayBtn.disabled = true;
  document.querySelectorAll(".algo-btn").forEach(b => b.disabled = true);
}

function unlockUI() {
  isSorting = false;
  sortBtn.disabled = false;
  stopBtn.disabled = true;
  resetBtn.disabled = false;
  generateBtn.disabled = false;
  setArrayBtn.disabled = false;
  document.querySelectorAll(".algo-btn").forEach(b => b.disabled = false);
}

// ─── BUBBLE SORT ─────────────────────────────────────────────
async function bubbleSort() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (stopRequested) return;
      markComparing(j, j+1);
      comparisons++; updateComparisons();
      await sleep(getDelay());
      if (array[j] > array[j+1]) {
        markMoving(j, j+1);
        await swapBars(j, j+1);
        await sleep(getDelay());
      }
      markDefault(j, j+1);
    }
    markSorted(n - 1 - i);
  }
  markSorted(0);
}

// ─── SELECTION SORT ──────────────────────────────────────────
async function selectionSort() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    markMoving(i);
    for (let j = i + 1; j < n; j++) {
      if (stopRequested) return;
      markComparing(j, minIdx);
      comparisons++; updateComparisons();
      await sleep(getDelay());
      if (array[j] < array[minIdx]) {
        markDefault(minIdx);
        minIdx = j;
        markMoving(minIdx);
      } else {
        markDefault(j);
      }
    }
    if (minIdx !== i) {
      markMoving(i, minIdx);
      await swapBars(i, minIdx);
      await sleep(getDelay());
    }
    markSorted(i);
    markDefault(minIdx);
  }
  markSorted(n - 1);
}

// ─── INSERTION SORT ──────────────────────────────────────────
async function insertionSort() {
  const n = array.length;
  markSorted(0);
  for (let i = 1; i < n; i++) {
    if (stopRequested) return;
    let key = array[i];
    let j = i - 1;
    markMoving(i);
    await sleep(getDelay());
    while (j >= 0 && array[j] > key) {
      if (stopRequested) return;
      markComparing(j, j+1);
      comparisons++; updateComparisons();
      array[j+1] = array[j];
      const maxVal = Math.max(...array);
      bars[j+1].style.height = `${(array[j+1] / maxVal) * 100}%`;
      await sleep(getDelay());
      markDefault(j+1);
      j--;
    }
    array[j+1] = key;
    const maxVal = Math.max(...array);
    bars[j+1].style.height = `${(key / maxVal) * 100}%`;
    markSorted(j+1);
    for (let k = 0; k <= i; k++) markSorted(k);
  }
}

// ─── MERGE SORT ───────────────────────────────────────────────
async function mergeSort() {
  await mergeSortHelper(0, array.length - 1);
  if (!stopRequested) bars.forEach((_, i) => markSorted(i));
}

async function mergeSortHelper(l, r) {
  if (stopRequested || l >= r) return;
  const mid = Math.floor((l + r) / 2);
  await mergeSortHelper(l, mid);
  await mergeSortHelper(mid + 1, r);
  await merge(l, mid, r);
}

async function merge(l, mid, r) {
  const left  = array.slice(l, mid + 1);
  const right = array.slice(mid + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    if (stopRequested) return;
    markComparing(l + i, mid + 1 + j);
    comparisons++; updateComparisons();
    await sleep(getDelay());
    if (left[i] <= right[j]) {
      setBarHeight(k, left[i++]);
    } else {
      setBarHeight(k, right[j++]);
    }
    markMoving(k);
    await sleep(getDelay());
    markDefault(k);
    k++;
  }
  while (i < left.length) {
    if (stopRequested) return;
    setBarHeight(k, left[i++]);
    markMoving(k); await sleep(getDelay()); markDefault(k); k++;
  }
  while (j < right.length) {
    if (stopRequested) return;
    setBarHeight(k, right[j++]);
    markMoving(k); await sleep(getDelay()); markDefault(k); k++;
  }
}

// ─── QUICK SORT ──────────────────────────────────────────────
async function quickSort() {
  await quickSortHelper(0, array.length - 1);
  if (!stopRequested) bars.forEach((_, i) => markSorted(i));
}

async function quickSortHelper(low, high) {
  if (stopRequested || low >= high) return;
  const pi = await partition(low, high);
  if (pi !== -1) {
    await quickSortHelper(low, pi - 1);
    await quickSortHelper(pi + 1, high);
  }
}

async function partition(low, high) {
  const pivot = array[high];
  markPivot(high);
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (stopRequested) return -1;
    markComparing(j, high);
    comparisons++; updateComparisons();
    await sleep(getDelay());
    if (array[j] <= pivot) {
      i++;
      markMoving(i, j);
      await swapBars(i, j);
      await sleep(getDelay());
      markDefault(i, j);
    } else {
      markDefault(j);
    }
  }
  markMoving(i+1, high);
  await swapBars(i+1, high);
  await sleep(getDelay());
  markSorted(i+1);
  markDefault(high);
  return i + 1;
}

// ─── MAIN SORT RUNNER ────────────────────────────────────────
async function runSort() {
  if (isSorting) return;
  lockUI();
  comparisons = 0; updateComparisons();
  setStatus(`Running <span>${ALGO_INFO[selectedAlgo].name}</span>...`);

  // Reset bar classes
  bars.forEach(b => b.className = "bar");

  const start = performance.now();

  switch (selectedAlgo) {
    case "bubble":    await bubbleSort();    break;
    case "selection": await selectionSort(); break;
    case "insertion": await insertionSort(); break;
    case "merge":     await mergeSort();     break;
    case "quick":     await quickSort();     break;
  }

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);

  if (stopRequested) {
    setStatus('<span style="color:var(--bar-move)">Stopped.</span> Reset or choose another algorithm.');
    bars.forEach(b => { if(!b.classList.contains("sorted")) b.className="bar"; });
  } else {
    // Final green wave animation
    for (let i = 0; i < bars.length; i++) {
      bars[i].classList.remove("comparing","moving","pivot");
      bars[i].classList.add("sorted");
      await sleep(Math.max(2, 400 / bars.length));
    }
    setStatus(`<span style="color:var(--bar-sorted)">Sorted!</span> ${comparisons} comparisons in ${elapsed}s`);
  }

  unlockUI();
}

// ─── COMPLEXITY DISPLAY ──────────────────────────────────────
function updateComplexityDisplay(algo) {
  const info = ALGO_INFO[algo];
  document.getElementById("time-worst").textContent  = info.timeW;
  document.getElementById("time-avg").textContent    = info.timeA;
  document.getElementById("time-best").textContent   = info.timeB;
  document.getElementById("space-worst").textContent = info.space;
  document.getElementById("algo-name").textContent   = info.name;
  document.getElementById("algo-stable").textContent = info.stable;
  document.getElementById("algo-inplace").textContent= info.inplace;
}

// ─── EVENT LISTENERS ─────────────────────────────────────────
document.querySelectorAll(".algo-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (isSorting) return;
    document.querySelectorAll(".algo-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAlgo = btn.dataset.algo;
    updateComplexityDisplay(selectedAlgo);
    resetState();
  });
});

sortBtn.addEventListener("click", runSort);

stopBtn.addEventListener("click", () => {
  stopRequested = true;
  stopBtn.disabled = true;
});

resetBtn.addEventListener("click", () => {
  if (isSorting) return;
  renderBars();
  resetState();
});

generateBtn.addEventListener("click", () => {
  if (isSorting) return;
  generateArray();
});

setArrayBtn.addEventListener("click", () => {
  if (isSorting) return;
  setCustomArray();
});

customInput.addEventListener("keydown", e => {
  if (e.key === "Enter") setCustomArray();
});

sizeSlider.addEventListener("input", () => {
  if (!isSorting) generateArray();
});

// ─── INIT ────────────────────────────────────────────────────
updateComplexityDisplay(selectedAlgo);
generateArray();
