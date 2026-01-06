import { Editor } from "../Editor";
import { useConfigState } from "../shared/state";

export function ParagraphDraftExample() {
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
          namespace="paragraph-draft-example"
          placeholder="Type something to test paragraph draft behavior..."
          user={{
            id: "example-user-1",
            username: "current-user",
            color: "#3b82f6",
          }}
          textBlur={{
            unlockKey: "Alt",
            showIndicator: true,
          }}
          useYjs={true}
          documentId="example-doc"
        />
      </div>

      <div className="text-sm text-gray-600">
        <p>
          <strong>How it works:</strong>
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            When "Collapse draft paragraphs" is enabled, paragraphs from other
            users in draft mode will be collapsed (height: 0)
          </li>
          <li>
            Hold the Alt key to temporarily reveal collapsed draft paragraphs
          </li>
          <li>
            Your own paragraphs (both draft and published) are always visible
          </li>
          <li>Published paragraphs from other users are always visible</li>
        </ul>
      </div>
    </div>
  );
}
