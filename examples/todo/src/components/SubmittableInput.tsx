import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SubmittableInput({
    onSubmit, label, placeholder,
}: {
    onSubmit: (text: string) => void;
    label: string;
    placeholder: string;
}) {
    return (
        <form
            className="flex flex-row items-center gap-3"
            onSubmit={(e) => {
                e.preventDefault();
                const textEl = e.currentTarget.elements.namedItem(
                    "text"
                ) as HTMLInputElement;
                onSubmit(textEl.value);
                textEl.value = "";
            }}
        >
            <Input
                className="-ml-3 -my-2 flex-grow flex-3 text-base"
                name="text"
                placeholder={placeholder}
                autoComplete="off" />
            <Button asChild type="submit" className="flex-shrink flex-1">
                <Input type="submit" value={label} />
            </Button>
        </form>
    );
}
