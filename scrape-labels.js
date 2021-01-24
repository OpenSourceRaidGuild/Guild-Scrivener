// #!/usr/bin/env node
import fsp from "fs/promises";
import got from "got";
import chalk from "chalk";
import ora from "ora";
import { db } from "./firebase.js";
import database from "./database.json";

try {
  database.forEach(
    async (label) =>
      await db
        .collection("labels")
        .doc(label.name)
        .set(label)
        .then(() => console.log("Label in DB"))
  );
} catch (err) {
  console.log(err);
}
// const spinner = ora(chalk.cyanBright("Retrieving Labels From GitHub")).start();
// spinner.color = chalk.greenBright();
// export async function dumpGitHubLabelIntoDB() {
//   return await got(
//     "https://api.github.com/repos/OpenSourceRaidGuild/website/labels"
//   ).json();
// }

// //TODO convert to Firebase Firestore
// const docRef = db.collection("labels");
// try {
//   fsp.writeFile(
//     "./database.json",
//     JSON.stringify(await dumpGitHubLabelIntoDB(), null, 2)
//   );
//   spinner.succeed(chalk.green("Label Fetching Successful!"));
//   spinner.succeed(chalk.green("Labels Written to Database"));
// } catch (err) {
//   spinner.fail(chalk.redBright("Label Fetching/Writing Failed!!!"));
//   console.error("ERROR", err);
// }
