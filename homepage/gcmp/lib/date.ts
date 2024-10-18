export function formatDate(date: Date) {
  const day = date.getDate().toString();
  date.getMonth();
  const year = date.getFullYear();
  const month = date.toLocaleString("en", { month: "short" });

  return `${month} ${day}, ${year}`;
}
