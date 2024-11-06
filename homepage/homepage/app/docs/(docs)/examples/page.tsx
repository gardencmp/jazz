export default function Page() {
  const examples = [
    {
      name: "Chat",
      slug: "chat",
    },
    {
      name: "Chat (with Clerk for auth)",
      slug: "chat-clerk",
    },
    {
      name: "Music player",
      slug: "music-player",
    },
    {
      name: "Pets",
      slug: "pets",
    },
    {
      name: "Todo",
      slug: "todo",
    },
    {
      name: "Password manager",
      slug: "password-manager",
    },
    {
      name: "Book shelf",
      slug: "book-shelf",
    },
  ];
  return (
    <>
      <h1>Example Apps</h1>
      <ul>
        {examples.map(({ name, slug }) => (
          <li key={name}>
            <a
              href={`https://github.com/gardencmp/jazz/tree/main/examples/${slug}`}
            >
              {name}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
