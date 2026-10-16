import { test } from "node:test";
import assert from "node:assert/strict";
import esbuild from "esbuild";

// Bundle the pure detection module (no Obsidian/CodeMirror deps) and import it.
const { outputFiles } = await esbuild.build({
	entryPoints: ["src/detect.ts"],
	bundle: true,
	format: "esm",
	write: false,
});
const { createDetector, maskMarkdown } = await import(
	"data:text/javascript;base64," + Buffer.from(outputFiles[0].text).toString("base64")
);

const defaults = {
	english: true,
	spanish: true,
	scope: "words",
	window: 15,
	minLength: 4,
	matchPlurals: true,
	ignoreAccents: false,
	ignoredWords: "",
};
const words = (text, opts = {}) =>
	createDetector({ ...defaults, ...opts })(maskMarkdown(text)).map((r) => r.word);

test("flags close English repeats, skips stop words", () => {
	assert.deepEqual(words("The garden was quiet and the garden was dark."), ["garden", "garden"]);
});

test("flags close Spanish repeats, skips stop words", () => {
	assert.deepEqual(
		words("La casa estaba vacía y la casa estaba fría para todos."),
		["casa", "casa"]
	);
});

test("respects distance window", () => {
	const text = "river one two three four five six seven eight nine ten river";
	assert.deepEqual(words(text, { window: 5 }), []);
	assert.deepEqual(words(text, { window: 15 }), ["river", "river"]);
});

test("case-insensitive", () => {
	assert.deepEqual(words("Silence fell. silence again."), ["Silence", "silence"]);
});

test("plural matching", () => {
	assert.deepEqual(words("Las flores y la flor."), ["flores", "flor"]);
	assert.deepEqual(words("Las flores y la flor.", { matchPlurals: false }), []);
	assert.deepEqual(words("One house, two houses."), ["house", "houses"]);
});

test("accents: distinct by default, merged when ignoring accents", () => {
	assert.deepEqual(words("Canción triste, cancion alegre."), []);
	assert.deepEqual(words("Canción triste, cancion alegre.", { ignoreAccents: true }), ["Canción", "cancion"]);
});

test("sentence scope", () => {
	const text = "The window was open. The window was closed. The window window.";
	assert.deepEqual(words(text, { scope: "sentence" }), ["window", "window"]);
});

test("paragraph scope", () => {
	const text = "Mar azul y mar.\n\nOtro mar distinto.";
	assert.deepEqual(words(text, { scope: "paragraph", minLength: 3 }), ["Mar", "mar"]);
});

test("ignored words setting", () => {
	assert.deepEqual(words("María dijo hola. María sonrió.", { ignoredWords: "maría" }), []);
});

test("ignores code, links, frontmatter, tags", () => {
	const text = [
		"---",
		"title: dragon dragon",
		"---",
		"A dragon story. See [[dragon notes]] and `dragon` and https://dragon.com #dragon",
		"```",
		"dragon dragon",
		"```",
	].join("\n");
	assert.deepEqual(words(text), []);
});

test("mask keeps length and offsets", () => {
	const text = "---\na: b\n---\nHello `code` world";
	const masked = maskMarkdown(text);
	assert.equal(masked.length, text.length);
	assert.equal(masked.indexOf("world"), text.indexOf("world"));
});

test("reports correct offsets", () => {
	const text = "Una noche, otra noche.";
	const r = createDetector(defaults)(maskMarkdown(text));
	assert.deepEqual(r.map((x) => text.slice(x.from, x.to)), ["noche", "noche"]);
	assert.equal(r[0].distance, 2);
});

test("tags are masked at line start, after spaces, and back to back, but not mid-word", () => {
	const text = "#dragon story\nsee #dragon #lair here\nnot a#tag";
	const masked = maskMarkdown(text);
	assert.equal(masked.length, text.length);
	assert.equal(masked.split("\n").length, 3);
	assert.ok(!masked.includes("#dragon"));
	assert.ok(!masked.includes("#lair"));
	assert.ok(masked.includes("story") && masked.includes("here"));
	assert.ok(masked.includes("a#tag"));
});
