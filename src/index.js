import { createReadStream, createWriteStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { parse } from 'csv-parse';

import { loadConfig } from './config/index.js';

async function main() {
  const { inputFile, outputFile, minAge, cityFilter } = loadConfig();

  await access(inputFile);

  const input = createReadStream(inputFile);
  const output = createWriteStream(outputFile);
  const parser = input.pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
      trim: true,
    }),
  );

  output.write('id,name,age,city\n');

  let processed = 0;
  let matched = 0;

  for await (const row of parser) {
    processed++;

    const age = Number(row.age);

    if (!Number.isFinite(age)) {
      throw new Error(`Invalid age for row ${processed}: ${row.age}`);
    }

    if (age >= minAge && row.city === cityFilter) {
      const line = [row.id, row.name, row.age, row.city]
        .map(escapeCsv)
        .join(',');

      if (!output.write(`${line}\n`)) {
        await new Promise((resolve) => output.once('drain', resolve));
      }

      matched++;
    }
  }

  await new Promise((resolve, reject) => {
    output.end(resolve);
    output.on('error', reject);
  });

  console.log(`processed: ${processed}`);
  console.log(`matched: ${matched}`);
}

function escapeCsv(value) {
  const text = String(value ?? '');

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

try {
  await main();
} catch (error) {
  console.error(`err: ${error.message}`);
  process.exitCode = 1;
}
