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

const ReactionForm = ({ reactions }: { reactions: Reactions }) => (
  <div className="reaction-form">
    {ReactionTypes.map((reactionType) => (
      <button
        key={reactionType}
        type="button"
        onClick={() => {
          reactions?.push(reactionType);
        }}
        title={`React with ${reactionType}`}
        className={reactions?.byMe?.value === reactionType ? "active" : ""}
        data-selected={reactions?.byMe?.value === reactionType}
      >
        {reactionEmojiMap[reactionType]}
      </button>
    ))}
  </div>
);

export function ReactionsScreen(props: { id: ID<Reactions> }) {
  const reactions = useCoState(Reactions, props.id, []);

  if (!reactions) return;

  return (
    <>
      <section>
        <h1>Add your reaction</h1>
        <ReactionForm reactions={reactions} />
      </section>

      <section>
        <h2>Reactions from you and other users</h2>
        {reactions && <ReactionOverview reactions={reactions} />}
      </section>
    </>
  );
}

const ReactionOverview = ({ reactions }: { reactions: Reactions }) => (
  <>
    {ReactionTypes.map((reactionType) => {
      const reactionsOfThisType = Object.values(reactions).filter(
        (entry) => entry.value === reactionType,
      );

      if (reactionsOfThisType.length === 0) return null;

      return (
        <div key={reactionType} className="reaction-row">
          <span>{reactionEmojiMap[reactionType]}</span>{" "}
          {reactionsOfThisType
            .map((reaction) => reaction.by?.profile?.name)
            .join(", ")}
        </div>
      );
    })}
  </>
);
