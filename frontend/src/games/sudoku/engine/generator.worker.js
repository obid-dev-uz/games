import { generatePuzzle } from "./generator";

// Runs puzzle generation off the main thread so the UI never freezes.
self.onmessage = ({ data: { id, difficulty, seed, box } }) => {
  try {
    self.postMessage({ id, result: generatePuzzle(difficulty, seed, box) });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
