// Admission policy for the web form only; engine and CLI behavior is unchanged.
export const MAX_WORDS = 2000;
export const MAX_CHARACTERS = 20000;
export function withinInputLimit(input) {
  let words = 0, characters = 0, insideWord = false;
  for (const character of input) {
    if (++characters > MAX_CHARACTERS) return false;
    if (/\p{L}/u.test(character)) {
      if (!insideWord && ++words > MAX_WORDS) return false;
      insideWord = true;
    } else if (!/\p{M}/u.test(character)) insideWord = false;
  }
  return true;
}
