import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
// import database from '../database.json';
import chalk from 'chalk';
import ora from 'ora';
import { db } from './firebase.js';
// import { dumpGitHubLabelIntoDB } from "./scrape-labels.js";
dotenv.config();
const owner = 'OpenSourceRaidGuild';

const octokit = new Octokit({
  auth: process.env.AUTH,
});

const listOfRepos =  await octokit.repos.listForOrg({
    type: 'all',
    org: owner,
  }).then(res => res.data)

listOfRepos.forEach(async repo => {
      const spinner = ora(
        chalk.yellowBright('NO ID FOUND ATTEMPING TO CREATE LABEL')
      ).start();
      spinner.color = chalk.redBright();
      return await octokit.issues
        .updateLabel({
          owner,
          repo,
          name: repo.name,
          new_name,
          color,
          description,
        })
(await db.collection('labels').get()).forEach(
  async (document) => {
    console.log(res)

  //       .then((res) => {
  //         if (res.status === 200)
  //           spinner.succeed(
  //             chalk.greenBright(`${name} Label Updated Successfully`)
  //           );
  //       })
  //       .catch(
  //         () =>
  //           spinner.fail(chalk.red(`Label update or creation Failed!`)) &&
  //           createLabelInRepo({ name, color, description })
  //       );
  //   }

  //   createLabelInRepo({ name, color, description });
  }
);
  
})
// * if 404 comes back (later set up a redundant GET call to verify label doesnt exist if ID is available. No ID assumes it is completely new) for label name the createLabel
// ! Update local DB after updates and creates finish -> would overwrite DB changes if update failed -- Fixed by FireStore integration
// TODO  certain messages are repeated due to happening in forEach
// database.forEach(
//   async ({
//     name = '',
//     new_name = undefined,
//     color = '',
//     description = '',
//     id,
//   }) => {
//     if (!!id) {
//       const spinner = ora(
//         chalk.yellowBright('NO ID FOUND ATTEMPING TO CREATE LABEL')
//       ).start();
//       spinner.color = chalk.redBright();
//       return await octokit.issues
//         .updateLabel({
//           owner,
//           repo,
//           name,
//           new_name,
//           color,
//           description,
//         })
//         .then((res) => {
//           if (res.status === 200)
//             spinner.succeed(
//               chalk.greenBright(`${name} Label Updated Successfully`)
//             );
//         })
//         .catch(
//           () =>
//             spinner.fail(chalk.red(`Label update or creation Failed!`)) &&
//             createLabelInRepo({ name, color, description })
//         );
//     }

//     createLabelInRepo({ name, color, description });
//   }
// );

// async function createLabelInRepo({ name, color, description }) {
//   const spinner = ora(
//     chalk.yellowBright('NO ID FOUND ATTEMPING TO CREATE LABEL')
//   ).start();
//   setTimeout(() => {
//     spinner.color = chalk.hex(Number(Math.random()).toString(16));
//   }, 3000);
//   return await octokit.issues
//     .createLabel({
//       owner,
//       repo,
//       name,
//       color,
//       description,
//     })
//     .then((res) => {
//       if (res.status === 201) {
//         spinner.succeed(chalk.greenBright(`${res.status} Status`));
//         spinner.succeed(
//           chalk.greenBright(`${name} Label Created Successfully!!`)
//         );
//       }
//     })
//     .catch(() => {
//       spinner.fail(`Label Creation ${chalk.red('FAILED!')}`);
//     });
// }
