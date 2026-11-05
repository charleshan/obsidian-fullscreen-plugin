import esbuild from 'esbuild';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import path from 'node:path';

const prod = process.argv[2] === 'production';
const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

// Set OBSIDIAN_VAULT (e.g. in .env) to copy each build into that vault's plugin folder.
const vault = process.env.OBSIDIAN_VAULT;
const pluginDir = vault ? path.join(vault, '.obsidian', 'plugins', manifest.id) : null;

const deployPlugin = {
	name: 'deploy-to-vault',
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0 || !pluginDir) return;

			await mkdir(pluginDir, { recursive: true });
			await Promise.all(['main.js', 'manifest.json', 'styles.css'].map((file) => copyFile(file, path.join(pluginDir, file))));
			console.log(`Deployed to ${pluginDir}`);

			// In watch mode, reload the running plugin through the Obsidian CLI.
			if (!prod) {
				execFile('obsidian', ['plugin:reload', `id=${manifest.id}`], (error) => {
					if (error) console.warn(`Could not reload plugin: ${error.message}`);
				});
			}
		});
	},
};

const context = await esbuild.context({
	entryPoints: ['src/main.ts'],
	bundle: true,
	external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*', ...builtinModules],
	format: 'cjs',
	target: 'es2018',
	logLevel: 'info',
	sourcemap: prod ? false : 'inline',
	minify: prod,
	treeShaking: true,
	outfile: 'main.js',
	plugins: [deployPlugin],
});

if (prod) {
	await context.rebuild();
	await context.dispose();
} else {
	await context.watch();
}
