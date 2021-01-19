import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import database from "./database.json";
import chalk from "chalk";
import ora from "ora";
// import { dumpGitHubLabelIntoDB } from "./scrape-labels.js";
dotenv.config();
const owner = "OpenSourceRaidGuild";
const repo = "website";
const octokit = new Octokit({
  auth: process.env.AUTH,
});
// * if 404 comes back (later set up a redundant GET call to verify label doesnt exist if ID is available. No ID assumes it is completely new) for label name the createLabel
// ! Update local DB after updates and creates finish
database.forEach(
  async ({
    name = "",
    new_name = undefined,
    color = "",
    description = "",
    id,
  }) => {
    if (!!id) {
      return await octokit.issues.updateLabel({
        owner,
        repo,
        name,
        new_name,
        color,
        description,
      });
    }

    const spinner = ora(
      chalk.yellowBright("NO ID FOUND ATTEMPING TO CREATE LABEL")
    ).start();
    setTimeout(() => {
      spinner.color = chalk.hex(Number(Math.random()).toString(16));
    }, 3000);
    await createRepoLabel({ name, color, description })
      .then((res) => {
        if (res.status === 201) {
          spinner.succeed(chalk.greenBright(`${res.status} Status`));
          spinner.succeed(
            chalk.greenBright(`createRepoLabel call SUCCESSFUL!!`)
          );
        }
      })
      .catch((err) => {
        spinner.fail(`createRepoLabel call FAILED!`);
      });
  }
);

async function createRepoLabel({ name, color, description }) {
  return await octokit.issues
    .createLabel({
      owner,
      repo,
      name,
      color,
      description,
    })
    .catch((err) => console.error(err));
}
