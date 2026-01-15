import { PhoenixSocketProvider } from "./contexts/phoenix-socket";
import { AuthProvider, useAuth } from "./contexts/auth";
import "./App.css";
import Editor from "./components/Editor/Editor";
import { formatDate, formatDistanceToNow } from "date-fns";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import LeftTwo from "~icons/icon-park-outline/left-two";
import RightTwo from "~icons/icon-park-outline/right-two";
import SunIcon from "~icons/icon-park-outline/sun-one";
import MoonIcon from "~icons/icon-park-outline/moon";
import { useState, useEffect } from "react";
import { useTheme } from "./contexts/theme";

import { LoginScreen } from "./components/LoginScreen";
import { AccountSwitcher } from "./components/AccountSwitcher/AccountSwitcher";

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
  const { theme, toggleTheme } = useTheme();
  const [draftMode] = useState<"always" | "default">("default");

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);

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

  const dates = [
    {
      date: today,
      label: "Now",
      isActive: true,
      summary:
        "Some summary about what happens in real time in the last 10 minutes",
      summaryColor: "text-zed-blue",
    },
    {
      date: yesterday,
      label: "Yesterday",
      summary:
        "Some summary about what happened yesterday and the most important topic",
      summaryColor: "text-zed-muted",
    },
    {
      date: dayBeforeYesterday,
      label:
        formatDistanceToNow(dayBeforeYesterday, { includeSeconds: false }) +
        " ago",
      summary:
        "Some summary about what happened 2 days ago and the most important topic",
      summaryColor: "text-zed-muted",
    },
    {
      date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      label: "3 days ago",
      summary: "Important updates and discussions from three days ago",
      summaryColor: "text-zed-muted",
    },
    {
      date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      label: "4 days ago",
      summary: "Key events and decisions from four days ago",
      summaryColor: "text-zed-muted",
    },
    {
      date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      label: "5 days ago",
      summary: "Notable activities and changes from five days ago",
      summaryColor: "text-zed-muted",
    },
    {
      date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      label: "6 days ago",
      summary: "Significant developments from six days ago",
      summaryColor: "text-zed-muted",
    },
    {
      date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      label: "A week ago",
      summary: "Weekly summary of major events and milestones",
      summaryColor: "text-zed-muted",
    },
  ];

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} isLoading={isLoading} />;
  }

  const editorUser = {
    id: user?.id ?? "",
    username: user?.username ?? "anonymous",
    color: user?.color ?? "#000000",
  };

  return (
    <PhoenixSocketProvider key={user?.id}>
      <header className="fixed -top-6 w-full h-6 bg-zed-bg"></header>
      <main className="flex h-screen border-t border-zed-border bg-zed-bg text-zed-fg">
        <div className="w-[320px] p-4">
          <h1 className="text-2xl font-bold mb-4">Activity</h1>
          <div className="flex flex-col gap-2 cursor-pointer">
            {dates.map((item, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="hover:text-zed-blue flex items-center gap-2 group">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      {item.label}
                      {item.isActive && (
                        <div className="size-[6px] bg-zed-blue rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-zed-muted group-hover:text-zed-blue">
                      {formatDate(item.date, "MMM d, yyyy")}
                    </span>
                  </div>
                  <RightTwo className="w-0 group-hover:w-4 transition-all" />
                </div>
                <p className={`text-xs line-clamp-1 ${item.summaryColor}`}>
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-full w-px bg-zed-border" />
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center border-b border-zed-border py-1 px-2">
            <div className="flex items-center gap-2">
              <LeftTwo />
              <p>Yesterday</p>
            </div>
            <AccountSwitcher />
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-zed-active transition-colors text-zed-muted hover:text-zed-fg"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
            </button>
            <p>Today</p>
          </div>
          <div className="flex-1 overflow-y-auto" data-scroll-container>
            <Editor
              user={editorUser}
              documentId="doc_avarh0wicwaeg1dj"
              namespace="main"
              useYjs
              draftMode={draftMode}
              textBlur={{
                unlockKey: "Alt",
                blurAmount: "3px",
                showIndicator: true,
              }}
            />
          </div>
        </div>
      </main>
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
