import { Doc } from "../../schema";
import { Tweet } from 'react-tweet'

export function RenderDoc({ doc }: { doc: Doc }) {
  return (
    <>
      <input
        type="text"
        value={doc.title}
        className="border rounded p-2 text-2xl font-bold"
        onChange={(e) => {
          doc.title = e.target.value;
        }}
      />
      <textarea
        value={doc.text}
        className="border rounded p-2 text-lg"
        onChange={(e) => {
          doc.text = e.target.value;
        }}
      />
      <input
        type="text"
        value={doc.tweet}
        className="border rounded p-2 text-lg"
        onChange={(e) => {
          doc.tweet = e.target.value;
        }}
      />
      {doc.tweet && <Tweet id={doc.tweet} />}
    </>
  );
}
