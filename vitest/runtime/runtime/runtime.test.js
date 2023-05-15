// @vitest-environment jsdom

import * as path from 'path';
import * as fs from 'fs';
import { rollup } from 'rollup';
import glob from 'tiny-glob/sync.js';
import { beforeAll, afterAll, describe, it, assert } from 'vitest';
import { compile } from '../../../compiler.mjs';
import { clear_loops, flush, set_now, set_raf } from '../../../internal/index.mjs';

import {
	show_output,
	try_load_config,
	mkdirp,
	create_loader,
	setupHtmlEqual
} from '../../helpers.js';
import { assert_html_equal } from '../../html_equal.js';

let compileOptions = null;

const sveltePath = process.cwd().split('\\').join('/');

let unhandled_rejection = false;
function unhandledRejection_handler(err) {
	unhandled_rejection = err;
}

describe('runtime', async () => {
	beforeAll(() => {
		process.on('unhandledRejection', unhandledRejection_handler);
		return setupHtmlEqual({ removeDataSvelte: true });
	});

	afterAll(() => {
		process.removeListener('unhandledRejection', unhandledRejection_handler);
	});

	const failed = new Set();

	async function runTest(dir, hydrate, from_ssr_html) {
		if (dir[0] === '.') return;

		const config = await try_load_config(`${__dirname}/samples/${dir}/_config.js`);
		const solo = config.solo || /\.solo/.test(dir);

		if (hydrate && config.skip_if_hydrate) return;
		if (hydrate && from_ssr_html && config.skip_if_hydrate_from_ssr) return;

		const test_name = `${dir} ${
			hydrate ? `(with hydration${from_ssr_html ? ' from ssr rendered html' : ''})` : ''
		}`;
		const it_fn = config.skip ? it.skip : solo ? it.only : it;

		it_fn(test_name, async () => {
			if (failed.has(dir)) {
				// this makes debugging easier, by only printing compiled output once
				throw new Error('skipping test, already failed');
			}

			unhandled_rejection = null;

			const cwd = path.resolve(`${__dirname}/samples/${dir}`);

			compileOptions = config.compileOptions || {};
			compileOptions.format = 'cjs';
			compileOptions.sveltePath = sveltePath;
			compileOptions.hydratable = hydrate;
			compileOptions.immutable = config.immutable;
			compileOptions.accessors = 'accessors' in config ? config.accessors : true;

			const load = create_loader(compileOptions, cwd);
			const load_ssr = create_loader({ ...compileOptions, generate: 'ssr' }, cwd);

			let mod;
			let SvelteComponent;

			let unintendedError = null;

			glob('**/*.svelte', { cwd }).forEach((file) => {
				if (file[0] === '_') return;

				const dir = `${cwd}/_output/${hydrate ? 'hydratable' : 'normal'}`;
				const out = `${dir}/${file.replace(/\.svelte$/, '.js')}`;

				if (fs.existsSync(out)) {
					fs.unlinkSync(out);
				}

				mkdirp(dir);

				try {
					const { js } = compile(fs.readFileSync(`${cwd}/${file}`, 'utf-8').replace(/\r/g, ''), {
						...compileOptions,
						filename: file
					});

					fs.writeFileSync(out, js.code);
				} catch (err) {
					// do nothing
				}
			});

			return Promise.resolve()
				.then(async () => {
					// hack to support transition tests
					clear_loops();

					const raf = {
						time: 0,
						callback: null,
						tick: (now) => {
							raf.time = now;
							if (raf.callback) raf.callback();
						}
					};
					set_now(() => raf.time);
					set_raf((cb) => {
						raf.callback = () => {
							raf.callback = null;
							cb(raf.time);
							flush();
						};
					});

					try {
						mod = await load(`./main.svelte`);
						SvelteComponent = mod.default;
					} catch (err) {
						show_output(cwd, compileOptions); // eslint-disable-line no-console
						throw err;
					}

					// Put things we need on window for testing
					window.SvelteComponent = SvelteComponent;
					window.document.body.innerHTML = '<main></main>';

					const target = window.document.querySelector('main');
					let snapshot = undefined;

					if (hydrate && from_ssr_html) {
						// ssr into target
						if (config.before_test) config.before_test();
						const SsrSvelteComponent = (await load_ssr(`./main.svelte`)).default;
						const { html } = SsrSvelteComponent.render(config.props);
						target.innerHTML = html;

						if (config.snapshot) {
							snapshot = config.snapshot(target);
						}

						if (config.after_test) config.after_test();
					} else {
						target.innerHTML = '';
					}

					if (config.before_test) config.before_test();

					const warnings = [];
					const warn = console.warn;
					console.warn = (warning) => {
						warnings.push(warning);
					};

					const options = Object.assign(
						{},
						{
							target,
							hydrate,
							props: config.props,
							intro: config.intro
						},
						config.options || {}
					);

					const component = new SvelteComponent(options);

					console.warn = warn;

					if (config.error) {
						unintendedError = true;
						throw new Error('Expected a runtime error');
					}

					if (config.warnings) {
						assert.deepEqual(warnings, config.warnings);
					} else if (warnings.length) {
						unintendedError = true;
						throw new Error('Received unexpected warnings');
					}

					if (config.html) {
						assert_html_equal(target.innerHTML, config.html, {
							without_normalize: config.withoutNormalizeHtml,
							normalize_html: {
								removeDataSvelte: true
							}
						});
					}

					if (config.test) {
						return Promise.resolve(
							config.test({
								assert,
								component,
								mod,
								target,
								snapshot,
								window,
								raf,
								compileOptions
							})
						).finally(() => {
							component.$destroy();

							if (unhandled_rejection) {
								throw unhandled_rejection;
							}
						});
					} else {
						component.$destroy();
						assert_html_equal(target.innerHTML, '', {
							normalize_html: {
								removeDataSvelte: true
							}
						});

						if (unhandled_rejection) {
							throw unhandled_rejection;
						}
					}
				})
				.catch((err) => {
					if (config.error && !unintendedError) {
						if (typeof config.error === 'function') {
							config.error(assert, err);
						} else {
							assert.equal(err.message, config.error);
						}
					} else {
						throw err;
					}
				})
				.catch((err) => {
					failed.add(dir);
					show_output(cwd, compileOptions); // eslint-disable-line no-console
					// print a clickable link to open the directory
					err.stack += `\n\ncmd-click: ${path.relative(process.cwd(), cwd)}/main.svelte`;
					throw err;
				})
				.then(() => {
					if (config.show) {
						show_output(cwd, compileOptions);
					}

					flush();

					if (config.after_test) config.after_test();
				});
		});
	}

	for (const dir of fs.readdirSync(`${__dirname}/samples`)) {
		await runTest(dir, false);
		await runTest(dir, true, false);
		await runTest(dir, true, true);
	}

	async function create_component(src = '<div></div>') {
		const { js } = compile(src, {
			format: 'esm',
			name: 'SvelteComponent',
			dev: true
		});

		const bundle = await rollup({
			input: 'main.js',
			plugins: [
				{
					name: 'svelte-packages',
					resolveId: (importee) => {
						if (importee.startsWith('svelte/')) {
							return importee.replace('svelte', process.cwd()) + '/index.mjs';
						}

						if (importee === 'main.js') {
							return importee;
						}
					},
					load: (id) => (id === 'main.js' ? js.code : null)
				}
			]
		});

		const result = await bundle.generate({
			format: 'iife',
			name: 'App'
		});

		return eval(`(function () { ${result.output[0].code}; return App; }())`);
	}

	it('fails if options.target is missing in dev mode', async () => {
		const App = await create_component();

		assert.throws(() => {
			new App();
		}, /'target' is a required option/);
	});

	it('fails if options.hydrate is true but the component is non-hydratable', async () => {
		const App = await create_component();

		assert.throws(() => {
			new App({
				target: { childNodes: [] },
				hydrate: true
			});
		}, /options\.hydrate only works if the component was compiled with the `hydratable: true` option/);
	});
});
