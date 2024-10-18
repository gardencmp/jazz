import { formatDate } from "@/lib/date";

export function FormattedDate({ date }: { date: Date }) {
    const formattedDate = formatDate(date);

    return <>{formattedDate}</>;
}
