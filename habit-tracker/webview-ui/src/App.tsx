import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { vscode } from "./utils/vscode";
import { useState } from "react";  // Import useState to manage user data
import "./App.css";

// Define the type for user data
interface User {
  email: string;
  name: string;
  image: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);  // State to store user data (typed as User or null)
  const [error, setError] = useState("");  // State to store any errors

  function handleHowdyClick() {
    vscode.postMessage({
      command: "Start",
      text: "Hey there partner! 🤠",
    });
  }

  function handleSignInClick() {
    vscode.postMessage({
      command: "signIn",
    });
  }

  // This function triggers the getToken command and fetches the user
  async function handleGetTokenClick() {
    try {
      // Send token to your extension
      // vscode.postMessage({
      //   command: "getToken",
      // });

      // Fetch user data from backend using the token
      const response = await fetch("http://localhost:3002/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${AccessToken}`, // Send token in the authorization header
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);  // Store the fetched user data in state
      } else {
        setError("Failed to fetch user data");
      }
    } catch (err:any) {
      setError(err.message);
      console.error(err);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Habit Tracker</h1>
      <div className="flex space-x-4">
        <VSCodeButton
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-md transition-all duration-300"
          onClick={handleHowdyClick}
        >
          Howdy!
        </VSCodeButton>
        <VSCodeButton
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-md transition-all duration-300"
          onClick={handleSignInClick}
        >
          Sign In
        </VSCodeButton>
        {/* Button to trigger getToken */}
        <VSCodeButton
          className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md shadow-md transition-all duration-300"
          onClick={handleGetTokenClick}
        >
          Get Token
        </VSCodeButton>
      </div>

      {/* Display user data or error */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {user && (
        <div className="mt-4">
          <h2 className="text-2xl font-semibold text-gray-800">User Info:</h2>
          <p>Email: {user.email}</p>
          <p>Name: {user.name}</p>
          <img src={user.image} alt="User" className="w-16 h-16 rounded-full mt-2" />
        </div>
      )}
    </main>
  );
}

export default App;
