import { Button } from '../Button';

interface LoginScreenProps {
  onLogin: () => void;
  isLoading: boolean;
}

export function LoginScreen({ onLogin, isLoading }: LoginScreenProps) {
  if (isLoading) {
    return (
      <div className="bg-zed-bg min-h-screen">
        <div data-tauri-drag-region className="fixed top-0 left-0 right-0 h-12 bg-zed-bg z-50" />
        <div className="flex flex-col gap-4 max-w-md mx-auto justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zed-fg" />
          <p className="text-zed-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zed-bg min-h-screen">
      <div data-tauri-drag-region className="fixed top-0 left-0 right-0 h-12 bg-zed-bg z-50" />
      <div className="flex flex-col gap-4 max-w-md mx-auto justify-center items-center h-screen">
        <h1 className="text-2xl font-semibold text-zed-fg">JitChat</h1>
        <p className="text-zed-muted text-center">Sign in to continue</p>
        <Button onClick={onLogin}>Login with Browser</Button>
      </div>
    </div>
  );
}
