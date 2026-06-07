/**
 * Locale-aware text processing helpers used by the deterministic social-story
 * generator. All routines are pure functions so they can be unit-tested
 * exhaustively without any IO.
 */

const STOPWORDS: Record<string, Set<string>> = {
  en: new Set([
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", "while",
    "for", "to", "of", "in", "on", "at", "by", "with", "from", "as", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we",
    "they", "me", "him", "her", "us", "them", "my", "your", "his", "its", "our",
    "their", "what", "which", "who", "whom", "where", "how", "very", "so", "not",
    "no", "yes", "can", "will", "just", "too",
  ]),
  es: new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "pero",
    "si", "entonces", "cuando", "para", "por", "de", "del", "en", "con", "sin",
    "sobre", "es", "son", "era", "ser", "estar", "ha", "han", "ese", "esa",
    "este", "esta", "yo", "tú", "él", "ella", "nosotros", "ellos", "ellas",
    "mi", "tu", "su", "no", "sí", "muy", "más", "menos",
  ]),
};

/**
 * Split a text into sentences using `Intl.Segmenter` when available (Node 18+,
 * modern browsers). Falls back to a punctuation-based heuristic.
 */
export function splitIntoSentences(text: string, locale = "en"): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n\n").trim();
  if (!cleaned) return [];

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new (Intl as unknown as {
        Segmenter: new (l: string, o: { granularity: "sentence" }) => {
          segment: (s: string) => Iterable<{ segment: string; isWordLike?: boolean }>;
        };
      }).Segmenter(locale, { granularity: "sentence" });
      const out: string[] = [];
      for (const seg of segmenter.segment(cleaned)) {
        const s = seg.segment.trim();
        if (s) out.push(s);
      }
      if (out.length > 0) return out;
    } catch {
      /* fall through */
    }
  }

  return cleaned
    .split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÑ¡¿])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Apply social-story style transformations to a single sentence.
 *
 * Heuristic rules suitable as a sane default; the AI-backed generator can do
 * much more sophisticated rewrites.
 */
export function simplifySentence(sentence: string, _locale = "en"): string {
  let s = sentence.trim();
  s = s.replace(/\s+/g, " ");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?…]$/.test(s)) s += ".";
  return s;
}

/**
 * Pull keyword candidates from a sentence (stopword-filtered, lowercased,
 * deduplicated, longest-first). Used to find the most representative
 * pictogram for a page.
 */
export function extractKeywords(text: string, locale = "en"): string[] {
  const stop = STOPWORDS[locale] ?? STOPWORDS.en!;
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w));

  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

  return [...counts.entries()]
    .sort(([a, ca], [b, cb]) => cb - ca || b.length - a.length)
    .map(([w]) => w);
}
