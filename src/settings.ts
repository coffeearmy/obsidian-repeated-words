import { App, PluginSettingTab, Setting } from "obsidian";
import type RepeatedWordsPlugin from "./main";
import type { DetectOptions, Scope } from "./detect";
import type { HighlightStyle } from "./highlighter";

export interface RepeatedWordsSettings extends DetectOptions {
	enabled: boolean;
	color: string;
	style: HighlightStyle;
}

export const DEFAULT_SETTINGS: RepeatedWordsSettings = {
	enabled: true,
	english: true,
	spanish: true,
	scope: "words",
	window: 15,
	minLength: 4,
	matchPlurals: true,
	ignoreAccents: false,
	ignoredWords: "",
	color: "#ffaa00",
	style: "background",
};

export class RepeatedWordsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: RepeatedWordsPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		const s = this.plugin.settings;
		const save = () => this.plugin.saveSettings();
		containerEl.empty();

		new Setting(containerEl)
			.setName("Enable highlighting")
			.setDesc("Also available as a command: Toggle repeated word highlighting.")
			.addToggle((t) =>
				t.setValue(s.enabled).onChange((v) => {
					s.enabled = v;
					save();
				})
			);

		new Setting(containerEl).setName("Languages").setHeading();

		new Setting(containerEl)
			.setName("English")
			.setDesc("Ignore common English words (the, with, that, would…).")
			.addToggle((t) =>
				t.setValue(s.english).onChange((v) => {
					s.english = v;
					save();
				})
			);

		new Setting(containerEl)
			.setName("Spanish")
			.setDesc("Ignore common Spanish words (para, como, pero, está…).")
			.addToggle((t) =>
				t.setValue(s.spanish).onChange((v) => {
					s.spanish = v;
					save();
				})
			);

		new Setting(containerEl).setName("Detection").setHeading();

		new Setting(containerEl)
			.setName("Scope")
			.setDesc("When two uses of the same word count as too close.")
			.addDropdown((d) =>
				d
					.addOptions({
						words: "Within a word distance",
						sentence: "Same sentence",
						paragraph: "Same paragraph",
					})
					.setValue(s.scope)
					.onChange((v) => {
						s.scope = v as Scope;
						save();
						this.display();
					})
			);

		if (s.scope === "words") {
			new Setting(containerEl)
				.setName("Distance")
				.setDesc("Flag a word if it appears again within this many words.")
				.addSlider((sl) =>
					sl
						.setLimits(2, 100, 1)
						.setValue(s.window)
						.setDynamicTooltip()
						.onChange((v) => {
							s.window = v;
							save();
						})
				);
		}

		new Setting(containerEl)
			.setName("Minimum word length")
			.setDesc("Shorter words are never flagged.")
			.addSlider((sl) =>
				sl
					.setLimits(1, 10, 1)
					.setValue(s.minLength)
					.setDynamicTooltip()
					.onChange((v) => {
						s.minLength = v;
						save();
					})
			);

		new Setting(containerEl)
			.setName("Match singular and plural")
			.setDesc("Treat casa/casas, flor/flores, house/houses as the same word.")
			.addToggle((t) =>
				t.setValue(s.matchPlurals).onChange((v) => {
					s.matchPlurals = v;
					save();
				})
			);

		new Setting(containerEl)
			.setName("Ignore accents")
			.setDesc("Treat esta/está, el/él, como/cómo as the same word.")
			.addToggle((t) =>
				t.setValue(s.ignoreAccents).onChange((v) => {
					s.ignoreAccents = v;
					save();
				})
			);

		new Setting(containerEl)
			.setName("Ignored words")
			.setDesc("Extra words that are never flagged, such as character names. Separate with commas, spaces or new lines.")
			.addTextArea((ta) => {
				ta.setPlaceholder("María, Juan, said, dijo")
					.setValue(s.ignoredWords)
					.onChange((v) => {
						s.ignoredWords = v;
						save();
					});
				ta.inputEl.rows = 5;
				ta.inputEl.style.width = "100%";
			});

		new Setting(containerEl).setName("Appearance").setHeading();

		new Setting(containerEl).setName("Style").addDropdown((d) =>
			d
				.addOptions({ background: "Background highlight", underline: "Wavy underline" })
				.setValue(s.style)
				.onChange((v) => {
					s.style = v as HighlightStyle;
					save();
				})
		);

		new Setting(containerEl).setName("Color").addColorPicker((c) =>
			c.setValue(s.color).onChange((v) => {
				s.color = v;
				save();
			})
		);
	}
}
