import path from "path";
import fs from "fs-extra";
import childProcess from "child_process";
import { Command, OptionValues } from "commander";
import chalk from "chalk";
import simpleGit, { SimpleGit } from "simple-git";
import Listr from "listr";
import packageJson from "../package.json";

let projectName: any;
const program = new Command(packageJson.name)
  .version(packageJson.version)
  .description(chalk.bold.blue(packageJson.description))
  .usage(chalk.green("[project-name]"))
  .arguments("[project-name]")
  .action(name => {
    projectName = name;
  })
  .option("-a,--auth", "use auth template")
  .parse(process.argv);

const options: OptionValues = program.opts();

if (projectName === undefined) {
  console.error(chalk.red("Please specify the project name:"));
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green("[project-name]")}`
  );
  console.log();
  console.log("For example:");
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green("my-express-api")}`
  );
  console.log();
  console.log(`Run ${chalk.cyan(program.name())} --help to see all options.`);
  process.exit();
}

const projectDestination: string = path.join(process.cwd(), projectName);

const templateName: string = options.auth ? "mongodb-auth" : "mongodb-main";

function hasYarn() {
  try {
    childProcess.execSync("yarn --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

const packageManager: string = hasYarn() ? "yarn" : "npm";

const tasks = new Listr([
  {
    title: `Install packages with ${templateName} template`,
    task: async () => {
      await fs.copy(
        path.join(__dirname, "../templates", templateName),
        projectName
      );
      const json = fs.readFileSync(`${projectDestination}/package.json`, {
        encoding: "utf8",
      });
      const jsonObject = JSON.parse(json);
      jsonObject["name"] = projectName;
      fs.writeFileSync(
        `${projectDestination}/package.json`,
        JSON.stringify(jsonObject, null, 4)
      );
    },
  },
  {
    title: "Install dependencies",
    task: () => {
      process.chdir(projectDestination);
      childProcess.execSync(`${packageManager} install`);
    },
  },
  {
    title: "Initialize git in directory",
    task: async () => {
      const git: SimpleGit = simpleGit({
        baseDir: projectDestination,
        binary: "git",
      });
      await git.init();
      await git.add(".");
      await git.commit("Initialized project using Create TsEx App");
    },
  },
]);

const printScript = (script: string): string => {
  return chalk.cyan`${packageManager} ${script}`;
};

tasks.run().then(() => {
  console.log(
    chalk.green(`Success! Created ${projectName} at ${projectDestination}`)
  );
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(` ${printScript("clean")}`);
  console.log(`   Deletes the build destination folder`);
  console.log();
  console.log(` ${printScript("dev")}`);
  console.log(`   Starts the development server`);
  console.log();
  console.log(` ${printScript("dev:test")}`);
  console.log(`   Runs development tests`);
  console.log();
  console.log(` ${printScript("test")}`);
  console.log(`   Runs tests. for ci mode only`);
  console.log();
  console.log(` ${printScript("test:watch")}`);
  console.log(`   Runs development tests in watch mode`);
  console.log();
  console.log(` ${printScript("start")}`);
  console.log(`   Starts the production server`);
  console.log();
  console.log(` ${printScript("build")}`);
  console.log(`   Compiles the typescript api into javascript for production`);
  console.log();
  console.log("To start the development server:");
  console.log();
  console.log(`   Type ${chalk.cyan("cd")} ${projectName}`);
  console.log();
  console.log(`   Create .env and test.env files in the config folder`);
  console.log(`   and add the properties you see in the .example.env`);
  console.log(`   and test.example.env files respectively`);
  console.log();
  console.log(`   Type ${printScript("dev")}`);
  console.log();
  console.log("Happy hacking!");
});
