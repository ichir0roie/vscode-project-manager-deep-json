import * as assert from 'assert';
import * as vscode from 'vscode';

import { renameKey } from '../../lib/Util';

suite('Extension Test Suite', () => {
	test('extension activates and registers commands', async () => {
		const ext = vscode.extensions.getExtension('ichir0roie.project-manager-deep-json');
		assert.ok(ext);
		await ext.activate();
		const commands = await vscode.commands.getCommands(true);
		for (const id of ['deleteItem', 'renameItem', 'revealInFileExplorer', 'refresh']) {
			assert.ok(commands.includes(`projectManagerDeepJson.${id}`), id);
		}
	});

	test('renameKey keeps key order', () => {
		const obj: Record<string, any> = { a: 1, b: 2, c: 3 };
		renameKey(obj, 'b', 'x');
		assert.deepStrictEqual(Object.entries(obj), [['a', 1], ['x', 2], ['c', 3]]);
	});
});
