"use strict";

// Usage: `npm run generate:config:doc DOC_REPO_PATH`
//
// Example:
//
// ```sh
// npm run generate:config:doc ../thelounge.github.io/
// ```

const {readFileSync, writeFileSync} = require("fs");
const colors = require("chalk");
const {join} = require("path");
const {spawnSync} = require("child_process");

function timestamp() {
	const datetime = new Date().toISOString().split(".")[0].replace("T", " ");

	return colors.dim(datetime);
}

const log = {
	/* eslint-disable no-console */
	error(...args) {
		console.error(timestamp(), colors.red("[ERROR]"), ...args);
	},
	warn(...args) {
		console.error(timestamp(), colors.yellow("[WARN]"), ...args);
	},
	info(...args) {
		console.log(timestamp(), colors.blue("[INFO]"), ...args);
	},
	debug(...args) {
		console.log(timestamp(), colors.green("[DEBUG]"), ...args);
	},
	raw(...args) {
		console.log(...args);
	},
	/* eslint-enable no-console */
};

function getGitUsername() {
	return spawnSync("git", ["config", "user.name"], {encoding: "utf8"}).stdout.trim();
}

const configContent = readFileSync(join(__dirname, "..", "defaults", "config.js"), "utf8");

const docRoot = process.argv[2];

if (!docRoot) {
	log.error("Missing DOC_REPO_PATH. Pass the path to the cloned `thelounge.github.io` repo.");
	process.exit(1);
}

const docPath = join(process.argv[2], "_includes", "config.js.md");

/** @type {string[]} */
const acc = [];

const extractedDoc = configContent
	.replace(/https:\/\/thelounge\.chat\/docs/g, "/docs") // make links relative
	.split("\n")
	.reduce((acc, line) => {
		line = line.trim();

		if (line.startsWith("// ")) {
			acc.push(line.substr(3));
		} else if (acc.length > 0 && acc[acc.length - 1] !== "") {
			// Treat whitespaces between comment blocks as separators in the generated
			// Markdown. Multiple blank lines are treated as one.
			acc.push("");
		}

		return acc;
	}, acc)
	.join("\n");

const infoBlockHeader = `<!--
DO NOT EDIT THIS FILE MANUALLY.
Content for the following is generated by this script in the main repo:
https://github.com/thelounge/thelounge/blob/master/scripts/generate-config-doc.js`;

const infoBlockTop = `${infoBlockHeader}
Last updated at ${getPrettyDate()} (UTC) by ${getGitUsername()}
-->`;

const infoBlockBottom = `${infoBlockHeader}
-->`;

const generatedContent = `${infoBlockTop}\n\n${extractedDoc}\n${infoBlockBottom}\n`;

writeFileSync(docPath, generatedContent);

log.info(
	`${colors.bold(generatedContent.split("\n").length)} lines ` +
		`(${colors.bold(generatedContent.length)} characters) ` +
		`were written in ${colors.green(docPath)}.`
);

function getPrettyDate() {
	return new Date().toISOString().split(".")[0].replace("T", " ");
}
