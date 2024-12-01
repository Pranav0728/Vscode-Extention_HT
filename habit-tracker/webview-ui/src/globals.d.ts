import vscode from "vscode";
declare global {
  const tsvscode: {
    postMessage: ({ type: string, value: any }) => void;
  };
  const apiBaseUrl: string;
  const AccessToken: string;
}
