import { Editor } from "../Editor";
import { useConfigState } from "../shared/state";

export function PluginTestExample() {
  const [config, setConfig] = useConfigState();

  const toggleParagraphDraft = () => {
    setConfig({ collapseDraftParagraphs: !config.collapseDraftParagraphs });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.collapseDraftParagraphs}
            onChange={toggleParagraphDraft}
            className="rounded"
          />
          <span>Collapse draft paragraphs (hold Alt to preview)</span>
        </label>
      </div>

      <div className="border rounded-lg p-4">
        <Editor
          namespace="plugin-test-example"
          placeholder="Type something to test both plugins..."
          user={{
            username: "test-user",
            color: "#3b82f6",
          }}
          textBlur={{
            unlockKey: "Alt",
            showIndicator: true,
          }}
          useYjs={true}
          documentId="test-doc"
        />
      </div>

      <div className="text-sm text-gray-600">
        <p>
          <strong>Testing Instructions:</strong>
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>TextBlurPlugin:</strong> Draft text from other users should
            be blurred. Hold Alt to view.
          </li>
          <li>
            <strong>ParagraphDraftPlugin:</strong> When enabled, paragraphs with
            draft text from other users should be collapsed (height: 0). Hold
            Alt to view.
          </li>
          <li>
            <strong>Your own content:</strong> Should always be visible (not
            blurred or collapsed).
          </li>
          <li>
            <strong>Published content:</strong> Should always be visible to all
            users.
          </li>
        </ul>
      </div>
    </div>
  );
}
