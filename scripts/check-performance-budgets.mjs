import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const budgets = JSON.parse(
  await readFile(new URL('performance-budgets.json', root), 'utf8'),
);
const bundle = JSON.parse(
  await readFile(new URL('reports/bundle-size.json', root), 'utf8'),
);
const benchmarkReport = JSON.parse(
  await readFile(new URL('reports/benchmarks.json', root), 'utf8'),
);

const failures = [];
const results = [];

function check(name, actual, limit, unit) {
  const passed = Number.isFinite(actual) && actual <= limit;
  results.push({ actual, limit, name, passed, unit });
  if (!passed) failures.push(`${name}: ${actual}${unit} > ${limit}${unit}`);
}

check('bundle.raw', bundle.rawBytes, budgets.bundle.rawBytesMax, ' bytes');
check('bundle.gzip', bundle.gzipBytes, budgets.bundle.gzipBytesMax, ' bytes');

const benchmarks = new Map();
for (const file of benchmarkReport.files ?? []) {
  for (const group of file.groups ?? []) {
    for (const benchmark of group.benchmarks ?? []) {
      benchmarks.set(benchmark.name, benchmark);
    }
  }
}

for (const [name, budget] of Object.entries(budgets.headlessBenchmarks)) {
  const benchmark = benchmarks.get(name);
  if (!benchmark) {
    failures.push(`benchmark missing: ${name}`);
    results.push({
      actual: null,
      limit: budget.meanMsMax,
      name,
      passed: false,
      unit: ' ms mean',
    });
    continue;
  }
  check(`benchmark.${name}`, benchmark.mean, budget.meanMsMax, ' ms mean');
}

const report = {
  budgetVersion: budgets.version,
  checkedAt: new Date().toISOString(),
  failures,
  referenceHardware: budgets.referenceHardware,
  results,
};
const reports = new URL('reports/', root);
await mkdir(reports, { recursive: true });
await writeFile(
  new URL('performance-budget-results.json', reports),
  `${JSON.stringify(report, null, 2)}\n`,
);

for (const result of results) {
  console.log(
    `${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.actual}${result.unit} / ${result.limit}${result.unit}`,
  );
}
if (failures.length > 0) {
  console.error(`Performance budgets failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`All ${results.length} static performance budgets passed.`);
}
