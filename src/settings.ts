import { App, PluginSettingTab, Setting, SettingDefinitionItem } from "obsidian";
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

// Shared by the declarative settings (Obsidian 1.13+) and the display() fallback.
const TEXT = {
	enabled: { name: "Enable highlighting", desc: "Also available as a command: Toggle repeated word highlighting." },
	english: { name: "English", desc: "Never flag common words such as the, with, that, would." },
	spanish: { name: "Spanish", desc: "Never flag common words such as para, como, pero, está." },
	scope: { name: "Scope", desc: "When two uses of the same word count as too close." },
	window: {
		name: "Distance",
		desc: "For the word distance scope: flag a word if it appears again within this many words.",
	},
	minLength: { name: "Minimum word length", desc: "Shorter words are never flagged." },
	matchPlurals: { name: "Match singular and plural", desc: "Treat casa/casas, flor/flores, house/houses as the same word." },
	ignoreAccents: { name: "Ignore accents", desc: "Treat esta/está, el/él, como/cómo as the same word." },
	ignoredWords: {
		name: "Ignored words",
		desc: "Extra words that are never flagged, such as character names. Separate with commas, spaces or new lines.",
	},
	style: { name: "Style", desc: "" },
	color: { name: "Color", desc: "" },
};

const SCOPES: Record<Scope, string> = {
	words: "Within a word distance",
	sentence: "Same sentence",
	paragraph: "Same paragraph",
};
const STYLES: Record<HighlightStyle, string> = { background: "Background highlight", underline: "Wavy underline" };
const IGNORED_PLACEHOLDER = "said, dijo, asked";

export class RepeatedWordsSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: RepeatedWordsPlugin,
	) {
		super(app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{ ...TEXT.enabled, control: { type: "toggle", key: "enabled" } },
			{
				type: "group",
				heading: "Languages",
				items: [
					{ ...TEXT.english, control: { type: "toggle", key: "english" } },
					{ ...TEXT.spanish, control: { type: "toggle", key: "spanish" } },
				],
			},
			{
				type: "group",
				heading: "Detection",
				items: [
					{ ...TEXT.scope, control: { type: "dropdown", key: "scope", options: SCOPES } },
					{ ...TEXT.window, control: { type: "slider", key: "window", min: 2, max: 100, step: 1 } },
					{ ...TEXT.minLength, control: { type: "slider", key: "minLength", min: 1, max: 10, step: 1 } },
					{ ...TEXT.matchPlurals, control: { type: "toggle", key: "matchPlurals" } },
					{ ...TEXT.ignoreAccents, control: { type: "toggle", key: "ignoreAccents" } },
					{
						...TEXT.ignoredWords,
						control: { type: "textarea", key: "ignoredWords", placeholder: IGNORED_PLACEHOLDER, rows: 5 },
					},
				],
			},
			{
				type: "group",
				heading: "Appearance",
				items: [
					{ name: TEXT.style.name, control: { type: "dropdown", key: "style", options: STYLES } },
					{ name: TEXT.color.name, control: { type: "color", key: "color" } },
				],
			},
		];
	}

	getControlValue(key: string): unknown {
		return this.plugin.settings[key as keyof RepeatedWordsSettings];
	}

	setControlValue(key: string, value: unknown): void {
		Object.assign(this.plugin.settings, { [key]: value });
		this.plugin.saveSettings();
	}

	/** Fallback for Obsidian < 1.13, which never calls getSettingDefinitions(). */
	display(): void {
		const { containerEl } = this;
		const s = this.plugin.settings;
		const save = () => this.plugin.saveSettings();
		containerEl.empty();

		const toggle = (key: "enabled" | "english" | "spanish" | "matchPlurals" | "ignoreAccents") =>
			new Setting(containerEl)
				.setName(TEXT[key].name)
				.setDesc(TEXT[key].desc)
				.addToggle((t) =>
					t.setValue(s[key]).onChange((v) => {
						s[key] = v;
						save();
					}),
				);

		toggle("enabled");

		new Setting(containerEl).setName("Languages").setHeading();
		toggle("english");
		toggle("spanish");

		new Setting(containerEl).setName("Detection").setHeading();

		new Setting(containerEl)
			.setName(TEXT.scope.name)
			.setDesc(TEXT.scope.desc)
			.addDropdown((d) =>
				d
					.addOptions(SCOPES)
					.setValue(s.scope)
					.onChange((v) => {
						s.scope = v as Scope;
						save();
					}),
			);

		const slider = (key: "window" | "minLength", min: number, max: number) => {
			const setting = new Setting(containerEl).setName(TEXT[key].name).setDesc(TEXT[key].desc);
			const value = setting.controlEl.createSpan({ cls: "rw-slider-value", text: String(s[key]) });
			setting.addSlider((sl) =>
				sl
					.setLimits(min, max, 1)
					.setValue(s[key])
					.onChange((v) => {
						s[key] = v;
						value.setText(String(v));
						save();
					}),
			);
		};

		slider("window", 2, 100);
		slider("minLength", 1, 10);
		toggle("matchPlurals");
		toggle("ignoreAccents");

		new Setting(containerEl)
			.setName(TEXT.ignoredWords.name)
			.setDesc(TEXT.ignoredWords.desc)
			.addTextArea((ta) => {
				ta.setPlaceholder(IGNORED_PLACEHOLDER)
					.setValue(s.ignoredWords)
					.onChange((v) => {
						s.ignoredWords = v;
						save();
					});
				ta.inputEl.rows = 5;
				ta.inputEl.addClass("rw-ignored-words");
			});

		new Setting(containerEl).setName("Appearance").setHeading();

		new Setting(containerEl).setName(TEXT.style.name).addDropdown((d) =>
			d
				.addOptions(STYLES)
				.setValue(s.style)
				.onChange((v) => {
					s.style = v as HighlightStyle;
					save();
				}),
		);

		new Setting(containerEl).setName(TEXT.color.name).addColorPicker((c) =>
			c.setValue(s.color).onChange((v) => {
				s.color = v;
				save();
			}),
		);
	}
}
