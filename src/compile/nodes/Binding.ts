import Node from './shared/Node';
import Element from './Element';
import getObject from '../../utils/getObject';
import getTailSnippet from '../../utils/getTailSnippet';
import flattenReference from '../../utils/flattenReference';
import Component from '../Component';
import Block from '../render-dom/Block';
import Expression from './shared/Expression';
import { dimensions } from '../../utils/patterns';

// TODO a lot of this element-specific stuff should live in Element —
// Binding should ideally be agnostic between Element and InlineComponent

export default class Binding extends Node {
	name: string;
	value: Expression;
	isContextual: boolean;
	usesContext: boolean;
	obj: string;
	prop: string;

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.name = info.name;
		this.value = new Expression(component, this, scope, info.value);

		let obj;
		let prop;

		const { name } = getObject(this.value.node);
		this.isContextual = scope.names.has(name);

		if (this.value.node.type === 'MemberExpression') {
			prop = `[✂${this.value.node.property.start}-${this.value.node.property.end}✂]`;
			if (!this.value.node.computed) prop = `'${prop}'`;
			obj = `[✂${this.value.node.object.start}-${this.value.node.object.end}✂]`;

			this.usesContext = true;
		} else {
			obj = 'ctx';
			prop = `'${name}'`;

			this.usesContext = scope.names.has(name);
		}

		this.obj = obj;
		this.prop = prop;
	}
}
