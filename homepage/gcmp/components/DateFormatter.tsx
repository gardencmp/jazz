import {formatDate} from "@/lib/date";

type Props = {
    date: Date;
};

const DateFormatter = ({ date }: Props) => {
    const formattedDate = formatDate(date)
    return <p>{formattedDate}</p>;
};

export default DateFormatter;
