export default {
	test(assert, component) {
		const nested = component.refs.nested;

		assert.deepEqual(component.events, ['create']);
		assert.deepEqual(nested.events, { create: false });
		component.destroy();
		assert.deepEqual(component.events, ['create', 'destroy', 'unmount']);
		assert.deepEqual(nested.events, { create: false, unmount: false, destroy: true });
	}
};
