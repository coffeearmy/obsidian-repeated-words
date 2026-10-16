import { ENGLISH_STOP_WORDS, SPANISH_STOP_WORDS, parseWordList } from "./stopwords";

export type Scope = "words" | "sentence" | "paragraph";

export interface DetectOptions {
	english: boolean;
	spanish: boolean;
	scope: Scope;
	/** Max distance in words between repeats (only used when scope is "words"). */
	window: number;
	minLength: number;
	matchPlurals: boolean;
	ignoreAccents: boolean;
	/** Extra words to ignore, comma/space/newline separated. */
	ignoredWords: string;
}

export interface Repeat {
	from: number;
	to: number;
	word: string;
	/** Distance in words to the nearest repeat of the same word. */
	distance: number;
}

interface Token {
	key: string;
	from: number;
	to: number;
	index: number;
	segment: number;
}

// Letters (incl. accented / combining marks), allowing inner apostrophes and hyphens: don't, ex-novio.
const WORD = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;
const SENTENCE_BREAK = /[.!?…]|\n/;
const PARAGRAPH_BREAK = /\n\s*\n/;

export function foldAccents(s: string): string {
	return s.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Light plural folding for English and Spanish: casas→casa, flores→flor, houses→house. */
export function singular(word: string): string {
	let w = word;
	if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
	if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
	return w;
}

export function createDetector(opts: DetectOptions) {
	const stop = new Set<string>();
	const lists = [
		opts.english ? ENGLISH_STOP_WORDS : "",
		opts.spanish ? SPANISH_STOP_WORDS : "",
		opts.ignoredWords,
	];
	for (const w of parseWordList(lists.join(" "))) {
		stop.add(w);
		stop.add(foldAccents(w));
	}

	const boundary =
		opts.scope === "sentence" ? SENTENCE_BREAK : opts.scope === "paragraph" ? PARAGRAPH_BREAK : null;

	const keyOf = (raw: string): string | null => {
		const lower = raw.toLowerCase().replace(/’/g, "'");
		if (Array.from(lower).length < opts.minLength) return null;
		if (stop.has(lower) || stop.has(foldAccents(lower))) return null;
		let key = opts.ignoreAccents ? foldAccents(lower) : lower;
		if (opts.matchPlurals) key = singular(key);
		return key;
	};

	/** Find repeated words in text[from, to). `text` should already be masked with maskMarkdown. */
	return (text: string, from = 0, to = text.length): Repeat[] => {
		const tokens: Token[] = [];
		let segment = 0;
		let index = 0;
		let prevEnd = from;

		WORD.lastIndex = from;
		for (let m = WORD.exec(text); m && m.index < to; m = WORD.exec(text)) {
			if (boundary && boundary.test(text.slice(prevEnd, m.index))) segment++;
			prevEnd = m.index + m[0].length;
			const key = keyOf(m[0]);
			if (key) tokens.push({ key, from: m.index, to: prevEnd, index, segment });
			index++;
		}

		const last = new Map<string, Token>();
		const distance = new Map<Token, number>();
		const flag = (t: Token, d: number) => distance.set(t, Math.min(d, distance.get(t) ?? Infinity));

		for (const t of tokens) {
			const k = boundary ? `${t.segment}|${t.key}` : t.key;
			const prev = last.get(k);
			if (prev) {
				const d = t.index - prev.index;
				if (boundary || d <= opts.window) {
					flag(prev, d);
					flag(t, d);
				}
			}
			last.set(k, t);
		}

		return tokens
			.filter((t) => distance.has(t))
			.map((t) => ({ from: t.from, to: t.to, word: text.slice(t.from, t.to), distance: distance.get(t)! }));
	};
}

// --- Markdown masking -------------------------------------------------------
// Replace non-prose parts (frontmatter, code, links, math...) with spaces,
// keeping newlines and string length so offsets still match the document.

const blank = (s: string) => s.replace(/[^\n]/g, " ");

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?=\r?\n|$)/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

const INLINE: RegExp[] = [
	/%%[\s\S]*?%%/g, // Obsidian comments
	/\$\$[\s\S]*?\$\$/g, // block math
	/`[^`\n]+`/g, // inline code
	/\$(?=\S)[^$\n]*?\S\$/g, // inline math
	/!?\[\[[^\]\n]*\]\]/g, // wikilinks and embeds
	/\]\([^)\n]*\)/g, // markdown link targets
	/<[^>\n]+>/g, // html tags
	/\bhttps?:\/\/[^\s)>\]]+/g, // bare urls
	/(?<=^|\s)#[\p{L}\p{N}_/-]+/gmu, // tags
];

function maskFences(text: string): string {
	let open: string | null = null;
	return text
		.split("\n")
		.map((line) => {
			const m = FENCE.exec(line);
			if (open === null) {
				if (!m) return line;
				open = m[1];
				return blank(line);
			}
			if (m && m[1][0] === open[0] && m[1].length >= open.length && line.trim() === m[1]) open = null;
			return blank(line);
		})
		.join("\n");
}

export function maskMarkdown(text: string): string {
	let out = text;
	const fm = FRONTMATTER.exec(out);
	if (fm) out = blank(fm[0]) + out.slice(fm[0].length);
	out = maskFences(out);
	for (const re of INLINE) out = out.replace(re, blank);
	return out;
}
