import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const srcDir = join(root, "src");

const forbiddenClientImports = [
	"server-only",
	"@/src/infrastructure",
	"../infrastructure",
	"../../infrastructure",
	"../../../infrastructure",
	"@/src/infrastructure/db",
];

const forbiddenFeatureDeepImport =
	/^@\/src\/features\/[^/]+\/.+\/(application|domain|infrastructure|server|tests)\//;

const sourceFiles = [];

function walk(dir) {
	for (const entry of readdirSync(dir)) {
		if (entry === "node_modules" || entry === ".next") {
			continue;
		}
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			walk(fullPath);
			continue;
		}
		if (/\.(ts|tsx)$/.test(entry)) {
			sourceFiles.push(fullPath);
		}
	}
}

function hasUseClientDirective(source) {
	const firstStatements = source.slice(0, 200).trimStart();
	return (
		firstStatements.startsWith('"use client"') ||
		firstStatements.startsWith("'use client'")
	);
}

function getImports(source) {
	const imports = [];
	const importRegex =
		/(?:import\s+(?:type\s+)?(?:[^"']+\s+from\s+)?|export\s+[^"']+\s+from\s+|import\s*\()\s*["']([^"']+)["']/g;
	let match;
	while ((match = importRegex.exec(source))) {
		imports.push(match[1]);
	}
	return imports;
}

walk(srcDir);

const violations = [];

for (const file of sourceFiles) {
	const source = readFileSync(file, "utf8");
	const imports = getImports(source);
	const displayPath = relative(root, file).split(sep).join("/");

	if (hasUseClientDirective(source)) {
		for (const specifier of imports) {
			if (forbiddenClientImports.some((rule) => specifier.startsWith(rule))) {
				violations.push(
					`${displayPath}: client component imports server-only module "${specifier}"`
				);
			}
		}
	}

	for (const specifier of imports) {
		if (forbiddenFeatureDeepImport.test(specifier)) {
			violations.push(
				`${displayPath}: import feature internals through public index.ts instead of "${specifier}"`
			);
		}
	}
}

if (violations.length > 0) {
	console.error("Architecture boundary violations found:");
	for (const violation of violations) {
		console.error(`- ${violation}`);
	}
	process.exit(1);
}

console.log("Architecture boundaries passed.");
