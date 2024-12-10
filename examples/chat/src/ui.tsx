import clsx from "clsx";
import { ProgressiveImg } from "jazz-react";
import { ImageDefinition } from "jazz-tools";
import { ImageIcon } from "lucide-react";
import { useId, useRef } from "react";

export function AppContainer(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between w-screen h-screen bg-stone-50 dark:bg-black dark:text-white">
      {props.children}
    </div>
  );
}

export function TopBar(props: { children: React.ReactNode }) {
  return (
    <div className="p-3 bg-white w-full flex justify-between gap-2 border-b dark:bg-transparent dark:border-stone-800">
      {props.children}
    </div>
  );
}

export function ChatBody(props: { children: React.ReactNode }) {
  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col-reverse"
      role="application"
    >
      {props.children}
    </div>
  );
}

export function EmptyChatMessage() {
  return (
    <div className="h-full text-base text-stone-500 flex items-center justify-center px-3 text-lg md:text-2xl">
      Start a conversation below.
    </div>
  );
}

export function BubbleContainer(props: {
  children: React.ReactNode;
  fromMe: boolean | undefined;
}) {
  const align = props.fromMe ? "items-end" : "items-start";
  return (
    <div className={`${align} flex flex-col m-3`} role="row">
      {props.children}
    </div>
  );
}

export function BubbleBody(props: {
  children: React.ReactNode;
  fromMe: boolean | undefined;
}) {
  return (
    <div
      className={clsx(
        "line-clamp-10 text-ellipsis whitespace-pre-wrap",
        "rounded-2xl overflow-hidden max-w-[calc(100%-5rem)] shadow-sm p-1",
        props.fromMe
          ? "bg-white dark:bg-stone-700 dark:text-white"
          : "bg-blue text-white",
      )}
    >
      {props.children}
    </div>
  );
}

export function BubbleText(props: { text: string }) {
  return <p className="px-2 leading-relaxed">{props.text}</p>;
}

export function BubbleImage(props: { image: ImageDefinition }) {
  return (
    <ProgressiveImg image={props.image}>
      {({ src }) => (
        <img
          className="h-auto max-h-[20rem] max-w-full rounded-t-xl mb-1"
          src={src}
        />
      )}
    </ProgressiveImg>
  );
}

export function BubbleInfo(props: { by: string | undefined; madeAt: Date }) {
  return (
    <div className="text-xs text-neutral-500 mt-1.5">
      {props.by} · {props.madeAt.toLocaleTimeString()}
    </div>
  );
}

export function InputBar(props: { children: React.ReactNode }) {
  return (
    <div className="p-3 bg-white border-t shadow-2xl mt-auto flex gap-1 dark:bg-transparent dark:border-stone-800">
      {props.children}
    </div>
  );
}

export function ImageInput({
  onImageChange,
}: { onImageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onUploadClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Send image"
        title="Send image"
        onClick={onUploadClick}
        className="text-stone-500 p-1.5 rounded-full hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
      >
        <ImageIcon size={24} strokeWidth={1.5} />
      </button>

      <label className="sr-only">
        Image
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/gif"
          onChange={onImageChange}
        />
      </label>
    </>
  );
}

export function TextInput(props: { onSubmit: (text: string) => void }) {
  const inputId = useId();

  return (
    <div className="flex-1">
      <label className="sr-only" htmlFor={inputId}>
        Type a message and press Enter
      </label>
      <input
        id={inputId}
        className="rounded-full py-1 px-3 border block w-full placeholder:text-stone-500 dark:bg-black dark:text-white dark:border-stone-700"
        placeholder="Type a message and press Enter"
        maxLength={2048}
        onKeyDown={({ key, currentTarget: input }) => {
          if (key !== "Enter" || !input.value) return;
          props.onSubmit(input.value);
          input.value = "";
        }}
      />
    </div>
  );
}
