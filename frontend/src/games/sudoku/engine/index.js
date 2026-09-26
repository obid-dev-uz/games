import { generatePuzzle } from "./generator";

export * from "./board";
export * from "./difficulty";
export { generatePuzzle } from "./generator";
export { solve, countSolutions, hasUniqueSolution } from "./solver";
export { isValidPlacement, findConflicts, isSolved } from "./validator";

let worker = null;
let workerBroken = false;
let nextId = 0;
const pending = new Map();

const generateOnMainThread = (difficulty, seed) =>
  Promise.resolve().then(() => generatePuzzle(difficulty, seed));

function getWorker() {
  if (worker || workerBroken || typeof Worker === "undefined") return worker;
  try {
    worker = new Worker(new URL("./generator.worker.js", import.meta.url), { type: "module" });
    worker.onmessage = ({ data: { id, result, error } }) => {
      const job = pending.get(id);
      if (!job) return;
      pending.delete(id);
      if (error) job.reject(new Error(error));
      else job.resolve(result);
    };
    worker.onerror = () => {
      // The worker failed to load (e.g. an old WebView without module workers):
      // stop using it and finish pending jobs on the main thread.
      workerBroken = true;
      worker.terminate();
      worker = null;
      const jobs = [...pending.values()];
      pending.clear();
      for (const job of jobs) {
        generateOnMainThread(job.difficulty, job.seed).then(job.resolve, job.reject);
      }
    };
  } catch {
    workerBroken = true;
    worker = null;
  }
  return worker;
}

/**
 * Generates a puzzle in a Web Worker so the UI never freezes; falls back to
 * the main thread where workers are unavailable or fail to load.
 */
export function generatePuzzleAsync(difficulty, seed) {
  const w = getWorker();
  if (!w) return generateOnMainThread(difficulty, seed);

  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject, difficulty, seed });
    w.postMessage({ id, difficulty, seed });
  });
}
