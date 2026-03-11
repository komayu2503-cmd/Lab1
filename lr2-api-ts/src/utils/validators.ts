export function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

export function countWords(text: string): number {
  if (!text) {
    return 0;
  }

  return text.trim().split(/\s+/).filter(Boolean).length;
}