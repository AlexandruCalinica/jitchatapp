import { RouterProvider } from "@tanstack/react-router";
import { PhoenixSocketProvider } from "./contexts/phoenix-socket";
import { AuthProvider, useAuth } from "./contexts/auth";
import { LoginScreen } from "./components/LoginScreen";
import { router } from "./router";
import { useEffect } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import "./App.css";

function createWebviewWindow() {
  const label = `jitchat-copy-${Math.random().toString(36).substring(2, 15)}`;
  const webview = new WebviewWindow(label, {
    width: 800,
    height: 600,
    dragDropEnabled: false,
  });
  webview.once("tauri://error", function (e) {
    console.log("Error creating new webview " + JSON.stringify(e));
  });
  webview.once("tauri://created", function () {
    console.log("webview created");
  });
}

function MainApp() {
  const { user, isLoading, isAuthenticated, login } = useAuth();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key === "n"
      ) {
        event.preventDefault();
        createWebviewWindow();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} isLoading={isLoading} />;
  }

  return (
    <PhoenixSocketProvider key={user?.id}>
      <RouterProvider router={router} />
    </PhoenixSocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
