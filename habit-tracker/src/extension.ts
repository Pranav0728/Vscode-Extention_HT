import { commands, ExtensionContext } from "vscode";
import { HTPanel } from "./panels/HTPanel";

export function activate(context: ExtensionContext) {
  
  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand("habit-tracker.Start", () => {
    HTPanel.render(context.extensionUri, context);  // Pass context to HTPanel.render
  });

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);
}
