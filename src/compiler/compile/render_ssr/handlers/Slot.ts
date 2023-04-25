import Renderer, { RenderOptions } from '../Renderer';
import Slot from '../../nodes/Slot';
import { x } from 'code-red';
import get_slot_data from '../../utils/get_slot_data';
import { get_attribute_value } from './shared/get_attribute_value';
import { get_slot_scope } from './shared/get_slot_scope';

export default function(node: Slot, renderer: Renderer, options: RenderOptions & {
	slot_scopes: Map<any, any>;
}) {
	const slot_data = get_slot_data(node.values);
	const slot = node.values.get('slot')?.get_value(null);
	const nearest_inline_component = node.find_nearest(/InlineComponent/);

	if (slot && nearest_inline_component) {
		renderer.push();
	}

	renderer.push();
	renderer.render(node.children, options);
	const result = renderer.pop();

	const slot_expression = get_attribute_value(node.name_attribute);
	renderer.add_expression(x`
		#slots[${slot_expression}]
			? #slots[${slot_expression}](${slot_data})
			: ${result}
	`);

	if (slot && nearest_inline_component) {
		const lets = node.lets;
		const seen = new Set(lets.map(l => l.name.name));

		nearest_inline_component.lets.forEach(l => {
			if (!seen.has(l.name.name)) lets.push(l);
		});
		options.slot_scopes.set(slot, {
			input: get_slot_scope(node.lets),
			output: renderer.pop()
		});
	}
}
