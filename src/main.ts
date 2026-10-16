import { Plugin, debounce } from "obsidian";
import { Extension } from "@codemirror/state";
import { repeatedWordsExtension } from "./highlighter";
import { DEFAULT_SETTINGS, RepeatedWordsSettingTab, RepeatedWordsSettings } from "./settings";

export default class RepeatedWordsPlugin extends Plugin {
	settings!: RepeatedWordsSettings;
	// Obsidian re-reads this array on updateOptions(), so editors pick up new settings live.
	private editorExtension: Extension[] = [];

	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.registerEditorExtension(this.editorExtension);
		this.refresh();

		this.addSettingTab(new RepeatedWordsSettingTab(this.app, this));

		this.addCommand({
			id: "toggle-highlighting",
			name: "Toggle repeated word highlighting",
			callback: async () => {
				this.settings.enabled = !this.settings.enabled;
				await this.saveData(this.settings);
				this.refresh();
			},
		});
	}

	onunload() {
		document.body.style.removeProperty("--rw-color");
	}

	saveSettings = debounce(
		async () => {
			await this.saveData(this.settings);
			this.refresh();
		},
		250,
		true
	);

	private refresh() {
		this.editorExtension.length = 0;
		if (this.settings.enabled) {
			this.editorExtension.push(repeatedWordsExtension({ ...this.settings }, this.settings.style));
		}
		this.app.workspace.updateOptions();
		document.body.style.setProperty("--rw-color", this.settings.color);
	}
}
