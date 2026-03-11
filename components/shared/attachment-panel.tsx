"use client";

import { useMemo, useState } from "react";
import { Attachment, AttachmentEntityType } from "@/lib/types";
import { Button, Card, EmptyState } from "@/components/shared/ui";
import { formatDateTime } from "@/lib/calculations";

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPanel({
  title = "Attachments",
  entityType,
  entityId,
  attachments,
  canUpload,
  onAdd,
  onDelete
}: {
  title?: string;
  entityType: AttachmentEntityType;
  entityId: string;
  attachments: Attachment[];
  canUpload: boolean;
  onAdd: (payload: {
    entityType: AttachmentEntityType;
    entityId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
  }) => { success: boolean; message: string; id?: string };
  onDelete: (attachmentId: string) => { success: boolean; message: string };
}) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const sortedAttachments = useMemo(
    () =>
      [...attachments].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [attachments]
  );

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = onAdd({
        entityType,
        entityId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        dataUrl: String(reader.result || "")
      });
      setMessage(result.message);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setMessage("Attachment upload failed. Try again.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Card>
      <div className="list-title">
        <div>
          <p className="eyebrow">{title}</p>
          <p>Keep linked documents and proofs on the same record.</p>
        </div>
        {canUpload ? (
          <label className="button button-secondary" style={{ cursor: "pointer" }}>
            {isUploading ? "Uploading..." : "Add file"}
            <input
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              hidden
              onChange={handleChange}
              type="file"
            />
          </label>
        ) : null}
      </div>
      {message ? <div className="notice" style={{ marginTop: 16 }}>{message}</div> : null}
      {sortedAttachments.length ? (
        <div className="panel-stack" style={{ marginTop: 16 }}>
          {sortedAttachments.map((attachment) => (
            <div className="list-row" key={attachment.id}>
              <div className="list-title">
                <div>
                  <strong>{attachment.fileName}</strong>
                  <p>
                    {formatFileSize(attachment.sizeBytes)} · {formatDateTime(attachment.createdAt)}
                  </p>
                </div>
                <div className="button-row">
                  <a
                    className="button button-secondary"
                    download={attachment.fileName}
                    href={attachment.dataUrl}
                  >
                    Open
                  </a>
                  {canUpload ? (
                    <Button
                      kind="danger"
                      onClick={() => setMessage(onDelete(attachment.id).message)}
                      type="button"
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            description="Invoices, expenses, purchases, and contact records can keep their files here."
            title="No attachments yet"
          />
        </div>
      )}
    </Card>
  );
}
