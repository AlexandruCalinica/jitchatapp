import { Button } from '../Button';

interface LoginScreenProps {
  onLogin: () => void;
  isLoading: boolean;
}

export function LoginScreen({ onLogin, isLoading }: LoginScreenProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-md mx-auto justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto justify-center items-center h-screen">
      <h1 className="text-2xl font-semibold text-gray-900">JitChat</h1>
      <p className="text-gray-600 text-center">Sign in to continue</p>
      <Button onClick={onLogin}>Login with Browser</Button>
    </div>
  );
}
