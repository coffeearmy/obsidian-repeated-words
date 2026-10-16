// Function words and very common verbs that repeat naturally in prose.
// Users can add more from the settings tab.

export const ENGLISH_STOP_WORDS = `
a about above after again against all also am an and any are as at
be because been before being below between both but by
can could did do does doing down during
each even ever every few for from further
get got had has have having he her here hers herself him himself his how
i if in into is it its itself just
like many may me might more most much must my myself
never no nor not now of off on once one only or other our ours ourselves out over own
same say said she should so some such
than that the their theirs them themselves then there these they this those through to too
under until up upon us very
was we were what when where which while who whom whose why will with would
yet you your yours yourself yourselves
`;

export const SPANISH_STOP_WORDS = `
a al algo algún alguna algunas alguno algunos ante antes aquel aquella aquellas aquello aquellos aquí así aunque
cada como cómo con contra cual cuál cuales cuando cuándo cuanto cuánto
de del desde donde dónde dos durante
e el él ella ellas ello ellos en entre era eran eres es esa esas ese eso esos esta está
estaba estaban estado estamos están estar estas este esto estos estoy fue fueron fui
ha había habían han has hasta hay he
la las le les lo los más me mi mí mis mismo misma mucho muchos muy
nada ni no nos nosotros nosotras nuestra nuestro nuestras nuestros nunca
o os otra otras otro otros
para pero poco por porque pues
que qué quien quién quienes se sea ser será si sí sido siempre sin sobre solo sólo son su sus
también tan tanto te ten tenía tiene tienen todo toda todas todos tu tú tus
u un una unas uno unos usted ustedes
y ya yo
`;

export function parseWordList(list: string): string[] {
	return list
		.split(/[\s,;]+/)
		.map((w) => w.trim().toLowerCase())
		.filter((w) => w.length > 0);
}
