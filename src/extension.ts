// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as needle from "needle";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extensions-vuln-scanner.helloWorld",
    async () => {
      const extensionSourceRepoUrls = vscode.extensions.all
        .filter(({ packageJSON }) => !packageJSON.isBuiltin)
        .map(extension => {
          if (!extension.packageJSON.repository?.url) {
            console.log(
              `Unable to scan extension ${extension.packageJSON.name} as it lacks a repository`
            );
          }
          return {
            name: extension.packageJSON.name,
            url: extension.packageJSON.repository?.url
              .replace(/\.git$/, "")
              .replace("github.com", "snyk.io/test/github")
          };
        })
        .filter(extension => Boolean(extension.url));

      const extensionTestResponses: any[] = [];

      for (let index = 0; index < extensionSourceRepoUrls.length; index++) {
        const { name, url } = extensionSourceRepoUrls[index];
        const testResponse = await needle("get", url + "?type=json", {
          json: true
        });

        if (testResponse.statusCode === 200) {
          extensionTestResponses.push({
            name,
            url,
            testResponse: testResponse.body
          });
        }
      }

      extensionTestResponses.filter(ext => ext.testResponse.totalVulns);

      vscode.window.showWarningMessage(
        `Oh noes! ${
          extensionTestResponses.filter(ext => ext.testResponse.totalVulns)
            .length
        } extension(s) found with security issues`,
        { modal: false }
      );

      extensionTestResponses
        .filter(ext => ext.testResponse.totalVulns)
        .map(ext => {
          console.log(`${ext.testResponse.totalVulns} vulns found in ${ext.name}`);
        });
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
