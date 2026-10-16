// Renders one README scene, picked by the page's #hash, using the real highlighter and settings tab.
import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { repeatedWordsExtension } from "../../src/highlighter";
import { DEFAULT_SETTINGS, RepeatedWordsSettingTab, RepeatedWordsSettings } from "../../src/settings";

const root = document.getElementById("root")!;

function notePane(title: string, text: string, extensions: Extension[]) {
	const pane = root.createDiv("workspace-leaf-content shot-pane");
	const source = pane
		.createDiv("view-content")
		.createDiv("markdown-source-view cm-s-obsidian mod-cm6 is-readable-line-width is-live-preview");
	const sizer = source.createDiv("shot-sizer");
	sizer.createDiv({ cls: "inline-title", text: title });
	new EditorView({ parent: sizer, doc: text, extensions: [EditorView.lineWrapping, ...extensions] });
}

const english = `Mara walked down to the harbor before dawn. The harbor was quiet, and the boats rocked gently against the dock. She counted the boats twice, then counted them again, because one of the boats was missing.

Her father had always said the sea keeps what it takes. She had never believed him. Now, standing at the end of the pier with the lantern in her hand, she wondered whether the water had finally taken something back.

The lantern flickered. Somewhere beyond the breakwater, a bell rang once and went silent.`;

const spanish = `Lucía abrió la puerta del teatro con cuidado. La puerta crujió como siempre, y el teatro olía a polvo y a madera vieja.

Caminó despacio hasta el escenario; el escenario seguía igual que la última vez, con las butacas cubiertas por sábanas blancas.

Encendió una sola luz. Desde el fondo de la sala, alguien aplaudió.`;

const scene = location.hash.slice(1);
const settings: RepeatedWordsSettings = { ...DEFAULT_SETTINGS };

try {
if (scene === "highlight") {
	notePane("The harbor", english, [repeatedWordsExtension(settings, "background")]);
} else if (scene === "underline") {
	notePane("El teatro", spanish, [repeatedWordsExtension(settings, "underline")]);
} else if (scene === "settings") {
	const tab = new RepeatedWordsSettingTab({} as any, { settings, saveSettings: () => {} } as any);
	tab.display();
	root.createDiv("shot-settings vertical-tab-content").appendChild(tab.containerEl);
}
} catch (e) {
	// Surfaced in the page title so a blank screenshot can be debugged with --dump-dom.
	document.title = "ERR " + (e as Error).stack;
}
document.body.dataset.ready = "1";
