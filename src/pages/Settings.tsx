import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileUpload } from "@ark-ui/react/file-upload";
import { useAuth } from "../contexts/auth";
import { getBackendUrl } from "../services/auth";
import { getAvatarUrl } from "../utils/avatar";
import ArrowLeftIcon from "~icons/solar/arrow-left-outline";
import UploadIcon from "~icons/solar/upload-outline";
import TrashIcon from "~icons/solar/trash-bin-trash-outline";

export function Settings() {
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(0);

  if (!user) return null;

  const avatarUrl = getAvatarUrl(user, "large");

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`${getBackendUrl()}/api/avatars`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Upload failed");
      }

      await refreshUser();
      setAvatarKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`${getBackendUrl()}/api/avatars`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete avatar");
      }

      await refreshUser();
      setAvatarKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-25">
      <header className="h-14 flex items-center gap-4 px-4 border-b border-gray-100">
        <button
          onClick={() => navigate({ to: "/" })}
          className="p-2 rounded-lg hover:bg-gray-50 text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <img
                key={avatarKey}
                src={`${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}t=${avatarKey}`}
                alt={user.username}
                className="size-24 rounded-full object-cover border-2 border-gray-100"
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <p className="text-gray-900">{user.username}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar
                </label>

                <FileUpload.Root
                  maxFiles={1}
                  accept="image/jpeg,image/png,image/webp"
                  maxFileSize={5 * 1024 * 1024}
                  onFileAccept={(details) => handleUpload(details.files)}
                  disabled={isUploading}
                >
                  <div className="flex items-center gap-3">
                    <FileUpload.Trigger
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UploadIcon className="size-4" />
                      {isUploading ? "Uploading..." : "Upload new avatar"}
                    </FileUpload.Trigger>

                    {user.avatar_url && (
                      <button
                        onClick={handleDelete}
                        disabled={isUploading}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="size-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <FileUpload.HiddenInput />
                </FileUpload.Root>

                <p className="mt-2 text-xs text-gray-500">
                  JPEG, PNG or WebP. Max 5MB.
                </p>

                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
