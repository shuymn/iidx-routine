import * as fs from "fs";
import * as path from "path";

(async () => {
  if (process.argv.length < 4) {
    console.error("invalid argument");
    process.exit(1);
  }

  const name = process.argv[3];
  const filepath = path.resolve(__dirname, "handlers", `${name}.ts`);
  if (!fs.existsSync(filepath)) {
    console.error(`target file does not exist. file: ${filepath}`);
    process.exit(1);
  }

  const module = await import(filepath);

  console.info(`${name}: start`);
  await module.handler().catch((err: unknown) => console.error(err));
  console.info(`${name}: finish`);
})();
