/** Stub for optional Node `canvas` import in pdfjs-dist — not used by browser PDF viewer. */
function createCanvas(): never {
  throw new Error("Node canvas is not available in the browser bundle.");
}

const canvasStub = { createCanvas };

export { createCanvas };
export default canvasStub;
