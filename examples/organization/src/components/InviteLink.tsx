import { createInviteLink } from "jazz-react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Organization } from "../schema.ts";

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
    <button
      type="button"
      className="inline-flex items-center gap-2 text-blue-500 dark:text-blue-400"
      onClick={copyUrl}
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      Copy invite link
    </button>
  );
}
