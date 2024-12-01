import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import axios from 'axios';  // Ensure axios is imported
import { authenticate } from "../authenticate";
import vscode from "vscode";
import { TokenManager } from "../TokenManager";

export class HTPanel {
  public static currentPanel: HTPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  /**
   * The HTPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Renders the current webview panel if it exists, otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   * @param context The context of the extension, needed for global state
   */
  public static render(extensionUri: Uri, context: vscode.ExtensionContext) {
    TokenManager.globalState = context.globalState; // Set the global state
    if (HTPanel.currentPanel) {
      HTPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      const panel = window.createWebviewPanel(
        // Panel view type
        "Habit Tracker",
        // Panel title
        "Habit Tracker",
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [Uri.joinPath(extensionUri, "out"), Uri.joinPath(extensionUri, "webview-ui/build")],
        }
      );

      HTPanel.currentPanel = new HTPanel(panel, extensionUri);
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    HTPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e., commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri): string {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    const nonce = getNonce();
    const AccessToken = TokenManager.getToken();
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}' 'unsafe-inline';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Habit Tracker</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}">
            const accessToken = ${JSON.stringify(AccessToken)}         
          </script>
        </body>
      </html>
    `;
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is received.
   *
   * @param webview A reference to the extension webview
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        switch (message.command) {
          case "Start":
            vscode.window.showInformationMessage(message.text);
            return;
  
          case "signIn":
            // Redirect to the website sign-in page
            const authUrl = "http://localhost:3000/signin"; // Replace with your actual sign-in URL
            vscode.env.openExternal(vscode.Uri.parse(authUrl));
            vscode.window.showInformationMessage("Redirecting to sign-in page...");
            return;
          
          case "getToken":
            // Fetch the token using the provided accessToken
            try {
              // Make sure authenticate() handles token retrieval asynchronously
              await authenticate();
              const token = TokenManager.getToken();
              if (token) {
                vscode.window.showInformationMessage("Token value: " + token);
              } else {
                vscode.window.showErrorMessage("Token is not available.");
              }
            } catch (error) {
              console.error('Error fetching token:', error);
              vscode.window.showErrorMessage("Failed to fetch token.");
            }
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}
