import Ajv from "ajv";
import fs from "node:fs";
import path from "node:path";

const ajv = new Ajv({ strict: true });

export function loadSchema(name: string) {
  const p = path.join(process.cwd(), "events", "schemas", `${name}.schema.json`);
  const schema = JSON.parse(fs.readFileSync(p, "utf8"));
  return ajv.compile(schema);
}

// Example:
// const validate = loadSchema("payment_settled");
// if (!validate(payload)) throw new Error(JSON.stringify(validate.errors));
