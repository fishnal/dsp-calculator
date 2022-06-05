import converter from 'xml2js';
import { readFile } from 'fs/promises';
import path from 'path';

const THRESHOLDS = {
	branches: 90,
	methods: 90,
	statements: 90,
	maxMissedStatements: 10
};

(async () => {
	console.log('__dirname: ', __dirname);
	console.log('file: ', path.resolve('./coverage/clover.xml'));
	let coverageContents = await readFile('./coverage/clover.xml');
	let x = await converter.parseStringPromise(coverageContents, {});

	let metrics = strictGet(x, 'coverage', 'project', 0, 'metrics', 0, '$');

	let [
		statements, coveredStatements,
		branches, coveredBranches,
		methods, coveredMethods
	] = strictParseInts(
		metrics.statements,
		metrics.coveredstatements,
		metrics.conditionals,
		metrics.coveredconditionals,
		metrics.methods,
		metrics.coveredmethods);

	let missedStatements = statements - coveredStatements;
	let stmtCoverage = coveredStatements / statements * 100;
	let branchCoverage = coveredBranches / branches * 100;
	let methodCoverage = coveredMethods / methods * 100;

	let failed = false;

	if (missedStatements >= THRESHOLDS.maxMissedStatements) {
		failed = true;
		console.error(`Exceeded max missed statements: (${missedStatements})`);
	}

	if (stmtCoverage < THRESHOLDS.statements) {
		failed = true;
		console.error(`Statement coverage not met: expected ${THRESHOLDS.statements}% `
			+ `but got ${stmtCoverage.toFixed(2)}%`);
	}

	if (branchCoverage < THRESHOLDS.branches) {
		failed = true;
		console.error(`Branch coverage not met: expected ${THRESHOLDS.branches}% `
			+ `but got ${branchCoverage.toFixed(2)}%`);
	}

	if (methodCoverage < THRESHOLDS.methods) {
		failed = true;
		console.error(`Method coverage not met: expected ${THRESHOLDS.methods}% `
			+ `but got ${methodCoverage.toFixed(2)}%`);
	}

	if (failed) {
		process.exit(1);
	}
})().catch(err => {
	console.error(err);
	process.exit(1);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function strictGet(obj: any, ...keys: (string | number)[]) {
	return keys.reduce((iteratingObj, key, i) => {
		if (typeof key === 'number' && !(iteratingObj instanceof Array)) {
			let jsPath = buildJsPath(keys.slice(0, i+1))
			throw new TypeError(`Expected ${jsPath} to be an array `
				+ `but got ${typeof iteratingObj} instead`);
		} else if (typeof iteratingObj !== 'object') {
			let actualType = iteratingObj instanceof Array ? 'array' : typeof iteratingObj;
			let jsPath = buildJsPath(keys.slice(0, i+1))
			throw new TypeError(`Expected ${jsPath} to be an object `
				+ `but got ${actualType} instead`);
		}

		return iteratingObj[key];
	}, obj);
}

function buildJsPath(keys: (string | number)[]): string {
	let s = '';

	keys.forEach(key => {
		if (typeof key === 'number'
			|| key.match(/^\d/i) != null // starts with number
			|| key.match(/^\d+$/i) != null // number-like string
			|| key.match(/[^a-zA-Z0-9$]/i) != null // contains non-alphanumeric
		) {
			s += `[${key}]`;
		} else {
			s += `.${key}`;
		}
	});

	return s;
}

function strictParseInts(...arr: string[]): number[] {
	return arr.map((x, i) => {
		let asNum = Number.parseInt(x);
		if (Number.isNaN(asNum)) {
			throw new TypeError(`${x} at index ${i} is not an integer`);
		}
		return asNum;
	});
}
