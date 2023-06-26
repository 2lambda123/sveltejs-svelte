import { nodes_match } from '../../utils/nodes_match.js';
import { x } from 'code-red';

/**
 * @param {import('./Renderer.js').default} renderer
 * @param {import('periscopic').Scope} scope
 * @param {import('estree').Node} node
 * @param {Set<string>} names
 * @param {boolean} main_execution_context
 * @returns {import('estree').Node}
 */
export function invalidate(renderer, scope, node, names, main_execution_context = false) {
	const { component } = renderer;
	const names_vars = /** @type {import('../../interfaces.js').Var[]} */ (
		Array.from(names)
			.filter((name) => {
				const owner = scope.find_owner(name);
				return !owner || owner === component.instance_scope;
			})
			.map((name) => component.var_lookup.get(name))
			.filter((variable) => {
				return (
					variable &&
					!variable.hoistable &&
					!variable.global &&
					!variable.module &&
					(variable.referenced ||
						variable.subscribable ||
						variable.is_reactive_dependency ||
						variable.export_name ||
						variable.name[0] === '$')
				);
			})
	);

	/**
	 * @param {import('../../interfaces.js').Var} variable
	 * @param {import('estree').Expression} [node]
	 */
	function get_invalidated(variable, node) {
		if (main_execution_context && !variable.subscribable && variable.name[0] !== '$') {
			return node;
		}
		return renderer_invalidate(renderer, variable.name, undefined, main_execution_context);
	}
	if (names_vars.length === 0) {
		return node;
	}
	component.has_reactive_assignments = true;
	if (
		node.type === 'AssignmentExpression' &&
		node.operator === '=' &&
		nodes_match(node.left, node.right) &&
		names_vars.length === 1
	) {
		return get_invalidated(names_vars[0], node);
	}

	const invalidated_names_vars = names_vars.map((variable) => get_invalidated(variable));
	for (let i = 0; i < names_vars.length; i += 1) {
		const head = names_vars[i];
		const extra_args = invalidated_names_vars.slice(i + 1).filter(Boolean);
		const is_store_value = head.name[0] === '$' && head.name[1] !== '$';
		if (is_store_value) {
			return x`@set_store_value(${head.name.slice(1)}, ${node}, ${head.name}, ${extra_args})`;
		}

		let invalidate = null;
		if (!main_execution_context) {
			const pass_value =
				extra_args.length > 0 ||
				(node.type === 'AssignmentExpression' && node.left.type !== 'Identifier') ||
				(node.type === 'UpdateExpression' && (!node.prefix || node.argument.type !== 'Identifier'));
			if (pass_value) {
				extra_args.unshift({
					type: 'Identifier',
					name: head.name
				});
			}
			invalidate = x`$$invalidate(${
				renderer.context_lookup.get(head.name).index
			}, ${node}, ${extra_args})`;
		}

		if (head.subscribable && head.reassigned) {
			const subscribe = `$$subscribe_${head.name}`;
			if (invalidate) {
				invalidate = x`${subscribe}(${invalidate})`;
			} else {
				extra_args.unshift(node);
				invalidate = x`${subscribe}(${extra_args})`;
			}
		}

		if (invalidate) {
			return invalidate;
		}
	}

	return node;
}

/**
 * @param {import('./Renderer.js').default} renderer
 * @param {string} name
 * @param {any} [value]
 * @param {boolean} [main_execution_context]
 * @returns {import('estree').Node}
 */
export function renderer_invalidate(renderer, name, value, main_execution_context = false) {
	const variable = renderer.component.var_lookup.get(name);
	if (variable && variable.subscribable && (variable.reassigned || variable.export_name)) {
		if (main_execution_context) {
			return x`${`$$subscribe_${name}`}(${value || name})`;
		} else {
			const member = renderer.context_lookup.get(name);
			return x`${`$$subscribe_${name}`}($$invalidate(${member.index}, ${value || name}))`;
		}
	}
	if (name[0] === '$' && name[1] !== '$') {
		return x`${name.slice(1)}.set(${value || name})`;
	}
	if (
		variable &&
		(variable.module ||
			(!variable.referenced &&
				!variable.is_reactive_dependency &&
				!variable.export_name &&
				!name.startsWith('$$')))
	) {
		return value || name;
	}
	if (value) {
		if (main_execution_context) {
			return x`${value}`;
		} else {
			const member = renderer.context_lookup.get(name);
			return x`$$invalidate(${member.index}, ${value})`;
		}
	}
	if (main_execution_context) return;
	// if this is a reactive declaration, invalidate dependencies recursively
	const deps = new Set([name]);
	deps.forEach((name) => {
		const reactive_declarations = renderer.component.reactive_declarations.filter((x) =>
			x.assignees.has(name)
		);
		reactive_declarations.forEach((declaration) => {
			declaration.dependencies.forEach((name) => {
				deps.add(name);
			});
		});
	});
	// TODO ideally globals etc wouldn't be here in the first place
	const filtered = Array.from(deps).filter((n) => renderer.context_lookup.has(n));
	if (!filtered.length) return null;
	return filtered
		.map((n) => x`$$invalidate(${renderer.context_lookup.get(n).index}, ${n})`)
		.reduce((lhs, rhs) => x`${lhs}, ${rhs}`);
}
