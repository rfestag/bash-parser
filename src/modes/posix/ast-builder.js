'use strict';

module.exports = options => {
	const builder = {};
	mkListHelper(builder, 'caseList');
	mkListHelper(builder, 'pattern');
	mkListHelper(builder, 'prefix');
	mkListHelper(builder, 'suffix');

	builder.caseItem = (pattern, body, locStart, locEnd) => {
		const type = 'CaseItem';
		const node = {type, pattern, body};

		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, locStart), locEnd);
		}

		return node;
	};

	builder.caseClause = (clause, cases, locStart, locEnd) => {
		const type = 'Case';
		const node = {type, clause};

		if (cases) {
			Object.assign(node, {cases});
		}

		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, locStart), locEnd);
		}

		return node;
	};

	builder.doGroup = (group, locStart, locEnd) => {
		if (options.insertLOC) {
			setLocEnd(setLocStart(group.loc, locStart), locEnd);
		}
		return group;
	};

	builder.braceGroup = (group, locStart, locEnd) => {
		if (options.insertLOC) {
			setLocEnd(setLocStart(group.loc, locStart), locEnd);
		}
		return group;
	};

	builder.list = logicalExpression => {
		const node = {type: 'Script', commands: [logicalExpression]};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, logicalExpression.loc), logicalExpression.loc);
		}
		return node;
	};
	builder.listAppend = (list, logicalExpression) => {
		list.commands.push(logicalExpression);
		if (options.insertLOC) {
			setLocEnd(list.loc, logicalExpression.loc);
		}
		return list;
	};

	builder.term = logicalExpression => {
		const node = {type: 'CompoundList', commands: [logicalExpression]};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, logicalExpression.loc), logicalExpression.loc);
		}
		return node;
	};

	builder.termAppend = (term, logicalExpression) => {
		term.commands.push(logicalExpression);
		setLocEnd(term.loc, logicalExpression.loc);
		return term;
	};

	builder.subshell = (list, locStart, locEnd) => {
		const node = {type: 'Subshell', list};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, locStart), locEnd);
		}
		return node;
	};

	builder.pipeSequence = command => {
		const node = {type: 'Pipeline', commands: [command]};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, command.loc), command.loc);
		}
		return node;
	};

	builder.pipeSequenceAppend = (pipe, command) => {
		pipe.commands.push(command);
		if (options.insertLOC) {
			setLocEnd(pipe.loc, command.loc);
		}
		return pipe;
	};

	builder.bangPipeLine = pipe => {
		const bang = true;
		if (pipe.commands.length === 1) {
			return Object.assign(pipe.commands[0], {bang});
		}
		return Object.assign(pipe, {bang});
	};

	builder.pipeLine = pipe => {
		if (pipe.commands.length === 1) {
			return pipe.commands[0];
		}
		return pipe;
	};

	builder.andAndOr = (left, right) => {
		const node = {type: 'LogicalExpression', op: 'and', left, right};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, left.loc), right.loc);
		}
		return node;
	};

	builder.orAndOr = (left, right) => {
		const node = {type: 'LogicalExpression', op: 'or', left, right};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, left.loc), right.loc);
		}
		return node;
	};

	builder.forClause = (name, wordlist, doGroup, locStart) => {
		const node = {type: 'For', name, wordlist, do: doGroup};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, locStart), doGroup.loc);
		}
		return node;
	};

	builder.forClauseDefault = (name, doGroup, locStart) => {
		const node = {type: 'For', name, do: doGroup};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, locStart), doGroup.loc);
		}
		return node;
	};

	builder.functionDefinition = (name, body) => {
		const node = {type: 'Function', name, body};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, name.loc), body.loc);
		}
		return node;
	};

	builder.elseClause = (compoundList, locStart) => {
		if (options.insertLOC) {
			setLocStart(compoundList.loc, locStart.loc);
		}

		return compoundList;
	};

	// eslint-disable-next-line max-params
	builder.ifClause = (clause, then, elseBranch, locStart, locEnd) => {
		const node = {type: 'If', clause, then};

		if (elseBranch) {
			node.else = elseBranch;
		}

		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, locStart), locEnd);
		}

		return node;
	};

	builder.while = (clause, body, whileWord) => {
		const node = {type: 'While', clause, do: body};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, whileWord.loc), body.loc);
		}
		return node;
	};

	builder.until = (clause, body, whileWord) => {
		const node = {type: 'Until', clause, do: body};

		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, whileWord.loc), body.loc);
		}

		return node;
	};

	builder.commandName = name => name;

	builder.commandAssignment = function commandAssignment(prefix) {
		return builder.command(prefix, {text: '', type: 'Word'});
	};

	builder.command = function command(prefix, command, suffix) {
		const node = {type: 'SimpleCommand', name: command};

		if (options.insertLOC) {
			node.loc = {};
			if (prefix) {
				const firstPrefix = prefix[0];
				node.loc.start = firstPrefix.loc.start;
			} else {
				node.loc.start = command.loc.start;
			}

			if (suffix) {
				const lastSuffix = suffix[suffix.length - 1];
				node.loc.end = lastSuffix.loc.end;
			} else {
				node.loc.end = command.loc.end;
			}
		}

		if (prefix) {
			node.prefix = prefix;
		}
		if (suffix) {
			node.suffix = suffix;
		}
		return node;
	};

	builder.ioRedirect = (op, file) => {
		const node = {type: 'IORedirect', op: op, file: file};
		if (options.insertLOC) {
			node.loc = setLocEnd(setLocStart({}, op.loc), file.loc);
		}
		return node;
	};

	builder.numberIoRedirect = (ioRedirect, numberIo) => {
		const node = Object.assign({}, ioRedirect, {numberIo});
		if (options.insertLOC) {
			setLocStart(node.loc, numberIo.loc);
		}
		return node;
	};

	return builder;
};

function setLocStart(target, source) {
	if (source) {
		target.start = source.start;
	}
	return target;
}

function setLocEnd(target, source) {
	if (source) {
		target.end = source.end;
	}
	return target;
}

function mkListHelper(builder, listName) {
	builder[listName] = item => {
		return [item];
	};
	builder[`${listName}Append`] = (list, item) => {
		list.push(item);
		return list;
	};
}
