const fs = require("fs")
const path = require("path")
const Ajv = require("ajv")
const addFormats = require("ajv-formats");

const {
    NodeV1Schema,
    NodeSnapshotV1Schema,
    OrganizationV1Schema,
    OrganizationSnapshotV1Schema,
    NetworkV1Schema
} = require("./lib");
const standaloneCode = require("ajv/dist/standalone").default

// For CJS, it generates an exports array, will generate
// `exports["#/definitions/Foo"] = ...;exports["#/definitions/Bar"] = ... ;`
const ajv = new Ajv({
    schemas: [NodeV1Schema, NodeSnapshotV1Schema, OrganizationV1Schema, OrganizationSnapshotV1Schema, NetworkV1Schema],
    code: {source: true }
})
addFormats(ajv);
let moduleCode = standaloneCode(ajv)

// Now you can write the module code to file
fs.writeFileSync(path.join(__dirname, "./lib/dto/generated/validators.js"), moduleCode)