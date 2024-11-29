import { ID } from "jazz-tools";
import { useCoState } from "./main.tsx";
import { ReactionTypes, Reactions } from "./schema.ts";

const reactionEmojiMap: {
  [reaction in (typeof ReactionTypes)[number]]: string;
} = {
  aww: "😍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  tiny: "🐥",
  chonkers: "🐘",
};

export function ReactionsScreen(props: { id: ID<Reactions> }) {
  const reactions = useCoState(Reactions, props.id, []);

  console.log({ reactions });

  return (
    <>
      <h1 className="mb-3">Add your reaction</h1>
      <div className="flex justify-between max-w-xs flex-wrap mb-8">
        {ReactionTypes.map((reactionType) => (
          <button
            key={reactionType}
            type="button"
            onClick={() => {
              reactions?.push(reactionType);
            }}
            title={`React with ${reactionType}`}
            className={[
              "text-2xl p-2 leading-none inline-flex items-center justify-center border rounded",
              reactions?.byMe?.value === reactionType ? "bg-blue-500" : "",
            ].join(" ")}
            data-selected={reactions?.byMe?.value === reactionType}
          >
            {reactionEmojiMap[reactionType]}
          </button>
        ))}
      </div>

      {reactions && <ReactionOverview reactions={reactions} />}
    </>
  );
}

function ReactionOverview({ reactions }: { reactions: Reactions }) {
  return (
    <>
      <h2 className="mb-3">Reactions from you and other users</h2>
      <div className="flex flex-col gap-1">
        {ReactionTypes.map((reactionType) => {
          const reactionsOfThisType = Object.values(reactions).filter(
            (entry) => entry.value === reactionType,
          );

          if (reactionsOfThisType.length === 0) return null;

          return (
            <div className="flex gap-2 items-center" key={reactionType}>
              <span className="text-2xl">{reactionEmojiMap[reactionType]}</span>
              <p>
                {reactionsOfThisType
                  .map((reaction) => reaction.by?.profile?.name)
                  .join(", ")}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
