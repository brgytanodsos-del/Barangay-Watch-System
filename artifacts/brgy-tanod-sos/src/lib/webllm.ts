type ProgressCb = (pct: number, text: string) => void;
let _progressCb: ProgressCb | null = null;

export function setWebLLMProgressCallback(cb: ProgressCb) {
  _progressCb = cb;
}

export async function getWebLLMEngine(): Promise<any> {
  throw new Error("[WebLLM] WebLLM is not available in this environment.");
}

export function preloadWebLLM(onProgress?: ProgressCb) {
  console.warn("[WebLLM] WebLLM is disabled in this environment.");
}

export function isWebLLMReady(): boolean {
  return false;
}

export async function promptWebLLM(systemPrompt: string, userText: string, temperature = 0.7): Promise<string> {
  throw new Error("[WebLLM] WebLLM is not available. Use Gemini AI instead.");
}
