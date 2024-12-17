import { createInviteLink } from "jazz-react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Organization } from "../../schema.ts";

export function InviteLink({ organization }: { organization: Organization }) {
  const [inviteLink, setInviteLink] = useState<string>();
  let [copyCount, setCopyCount] = useState(0);
  let copied = copyCount > 0;

  useEffect(() => {
    if (organization) {
      setInviteLink(createInviteLink(organization, "writer"));
    }
  }, [organization.id]);

  useEffect(() => {
    if (copyCount > 0) {
      let timeout = setTimeout(() => setCopyCount(0), 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copyCount]);

  const copyUrl = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setCopyCount((count) => count + 1);
      });
    }
  };

  return (
    <div className="flex gap-3 items-center max-w-2xl w-full">
      <strong>Invite</strong>
      <div className="border p-2 overflow-hidden leading-none flex gap-2 flex-1">
        <input
          className="flex-1 border-0 p-0"
          type="text"
          defaultValue={inviteLink}
          onClick={(e) => e.currentTarget.select()}
          onBlur={(e) => e.currentTarget.setSelectionRange(0, 0)}
          readOnly
        />
        <button
          type="button"
          className="text-blue-500 dark:text-blue-400"
          onClick={copyUrl}
        >
          {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          <span className="sr-only">Copy URL</span>
        </button>
      </div>
    </div>
  );
}
