import fuzzymatch from '../phases/1-parse/utils/fuzzymatch.js';
import * as w from '../warnings.js';

const regex_svelte_ignore = /^\s*svelte-ignore\s/;

/** @type {Record<string, string>} */
const replacements = {
	'non-top-level-reactive-declaration': 'reactive_declaration_invalid_placement'
};

/**
 * @param {number} offset
 * @param {string} text
 * @param {boolean} runes
 * @returns {string[]}
 */
export function extract_svelte_ignore(offset, text, runes) {
	const match = regex_svelte_ignore.exec(text);
	if (!match) return [];

	let length = match[0].length;
	offset += length;

	/** @type {string[]} */
	const ignores = [];

	// Warnings have to be separated by commas, everything after is interpreted as prose
	for (const match of text.slice(length).matchAll(/([\w$-]+)(,)?/gm)) {
		const code = match[1];

		ignores.push(code);

		if (!w.codes.includes(code)) {
			const replacement = replacements[code] ?? code.replace(/-/g, '_');

			if (runes) {
				// github are you stuck?
				const start = offset + match.index;
				const end = start + code.length;

				if (w.codes.includes(replacement)) {
					w.legacy_code({ start, end }, code, replacement);
				} else {
					const suggestion = fuzzymatch(code, w.codes);
					w.unknown_code({ start, end }, code, suggestion);
				}
			} else if (w.codes.includes(replacement)) {
				ignores.push(replacement);
			}
		}

		if (!match[2]) {
			break;
		}
	}

	return ignores;
}
