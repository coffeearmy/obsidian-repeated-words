import { Extension, RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { DetectOptions, Repeat, createDetector, maskMarkdown } from "./detect";

// Extra characters scanned around the visible area, so repeats just off-screen still pair up.
const MARGIN = 4000;

export type HighlightStyle = "background" | "underline";

export function repeatedWordsExtension(opts: DetectOptions, style: HighlightStyle): Extension {
	const detect = createDetector(opts);
	const className = `rw-repeat rw-${style}`;

	const tooltip = (r: Repeat) =>
		opts.scope === "words"
			? `"${r.word}" repeated ${r.distance} word${r.distance === 1 ? "" : "s"} apart`
			: `"${r.word}" repeated in the same ${opts.scope}`;

	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			masked: string;

			constructor(view: EditorView) {
				this.masked = maskMarkdown(view.state.doc.toString());
				this.decorations = this.build(view);
			}

			update(u: ViewUpdate) {
				if (u.docChanged) this.masked = maskMarkdown(u.state.doc.toString());
				if (u.docChanged || u.viewportChanged) this.decorations = this.build(u.view);
			}

			build(view: EditorView): DecorationSet {
				const doc = view.state.doc;
				const from = doc.lineAt(Math.max(0, view.viewport.from - MARGIN)).from;
				const to = doc.lineAt(Math.min(doc.length, view.viewport.to + MARGIN)).to;
				const builder = new RangeSetBuilder<Decoration>();
				for (const r of detect(this.masked, from, to)) {
					builder.add(r.from, r.to, Decoration.mark({ class: className, attributes: { title: tooltip(r) } }));
				}
				return builder.finish();
			}
		},
		{ decorations: (v) => v.decorations }
	);
}
