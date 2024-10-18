import { formatDate } from "@/lib/date";

export function FormattedDate({ date }: { date: string }) {
    const formattedDate = formatDate(new Date(date));

    return <>{formattedDate}</>;
}
