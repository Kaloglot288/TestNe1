const fs = require("node:fs");
const path = require("node:path");
const csv = require("csv-parser");
const { getConfig } = require("./config");

async function main() {
  let config;

  try {
    config = getConfig();
  } catch (error) {
    console.error(`Ошибка конфигурации: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(config.inputFile)) {
    console.error(`Входной файл не найден: ${config.inputFile}`);
    process.exitCode = 1;
    return;
  }

  if (path.resolve(config.inputFile) === path.resolve(config.outputFile)) {
    console.error("Входной и выходной файлы не должны совпадать.");
    process.exitCode = 1;
    return;
  }

  const outputDir = path.dirname(config.outputFile);

  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error(`Не удалось создать папку для результата: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  let processed = 0;
  let matched = 0;
  let headers;

  const input = fs.createReadStream(config.inputFile);
  const output = fs.createWriteStream(config.outputFile, { encoding: "utf8" });
  const parser = csv({ separator: config.delimiter });

  try {
    await new Promise((resolve, reject) => {
      input
        .pipe(parser)
        .on("headers", (receivedHeaders) => {
          headers = receivedHeaders;

          if (!headers.includes(config.filterColumn)) {
            reject(
              new Error(
                `В CSV нет столбца "${config.filterColumn}". Доступные столбцы: ${headers.join(", ")}`
              )
            );
          } else {
            output.write(`${headers.map(escapeCsv).join(config.delimiter)}\n`);
          }
        })
        .on("data", (row) => {
          processed += 1;

          if (row[config.filterColumn] === config.filterValue) {
            matched += 1;
            output.write(
              `${headers.map((header) => escapeCsv(row[header] ?? "")).join(config.delimiter)}\n`
            );
          }
        })
        .on("error", reject)
        .on("end", resolve);

      input.on("error", reject);
      output.on("error", reject);
    });

    await new Promise((resolve, reject) => {
      output.end((error) => (error ? reject(error) : resolve()));
    });

    console.log(`Обработано строк: ${processed}`);
    console.log(`Прошло фильтр: ${matched}`);
    console.log(`Результат записан в: ${config.outputFile}`);
  } catch (error) {
    input.destroy();
    output.destroy();
    console.error(`Ошибка обработки CSV: ${error.message}`);
    process.exitCode = 1;
  }
}

function escapeCsv(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

main();
