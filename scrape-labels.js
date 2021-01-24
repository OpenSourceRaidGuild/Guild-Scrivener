// #!/usr/bin/env node
import fsp from "fs/promises";
import got from "got";
import chalk from "chalk";
import ora from "ora";

const spinner = ora(chalk.cyanBright("Retrieving Labels From GitHub")).start();
spinner.color = chalk.greenBright();
export async function dumpGitHubLabelIntoDB() {
  return await got(
    "https://api.github.com/repos/OpenSourceRaidGuild/website/labels"
  ).json();
}

//TODO convert to Firebase RTDB
try {
  fsp.writeFile(
    "./database.json",
    JSON.stringify(await dumpGitHubLabelIntoDB(), null, 2)
  );
  spinner.succeed(chalk.green("Label Fetching Successful!"));
  spinner.succeed(chalk.green("Labels Written to Database"));
} catch (err) {
  spinner.fail(chalk.redBright("Label Fetching/Writing Failed!!!"));
  console.error("ERROR", err);
}
