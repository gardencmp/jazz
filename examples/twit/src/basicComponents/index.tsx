import ReactTimeAgo from 'react-time-ago';
import { Button } from './ui/button';
export { Button } from './ui/button';
export { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
export { Input } from './ui/input';
export { Skeleton } from './ui/skeleton';
export { Toaster } from './ui/toaster';
export { useToast } from './ui/use-toast';
export { SubmittableInput } from './SubmittableInput';
export { TitleAndLogo } from './TitleAndLogo';
export { ThemeProvider } from './themeProvider';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

export function BioInput(props: { value?: string; onChange: (value: string) => void }) {
  return (
    <Input
      type="text"
      value={props.value}
      autoComplete="off"
      onChange={e => {
        props.onChange(e.target.value);
      }}
      placeholder="Add a bio..."
      className="w-full p-2 border rounded"
    />
  );
}

export function ProfileTitleContainer(props: { children: React.ReactNode }) {
  return <div className="flex items-baseline">{props.children}</div>;
}

export function ProfileName(props: { children: React.ReactNode }) {
  return <h1 className="text-2xl">{props.children}</h1>;
}

export function FollowerStatsContainer(props: { children: React.ReactNode }) {
  return <div className="flex gap-2 mt-2 text-neutral-500">{props.children}</div>;
}

export function ChooseProfilePicInput(props: { onChange: (file: File) => void }) {
  return (
    <Button asChild className="mt-2" size="sm" variant="secondary">
      <label className="cursor-pointer text-xs">
        Choose Pic
        <Input
          type="file"
          accept="image/*"
          onChange={e => {
            e.target.files?.[0] && props.onChange(e.target.files[0]);
            e.target.value = '';
          }}
          className="hidden"
        />
      </label>
    </Button>
  );
}

export function LargeProfilePicImg(props: { src?: string }) {
  return <img src={props.src} className="w-20 h-20 bg-neutral-200 rounded-full mr-2 object-cover" />;
}

export function ProfilePicImg(props: { src?: string; smaller?: boolean }) {
  return (
    <img
      src={props.src}
      className={'bg-neutral-200 rounded-full mr-2 object-cover shrink-0' + (props.smaller ? ' w-8 h-8' : ' w-10 h-10')}
    />
  );
}

export function SubtleProfileID(props: { children: React.ReactNode }) {
  return <div className="ml-2 text-neutral-300 text-xs">{props.children}</div>;
}

export function SubtleRelativeTimeAgo(props: { dateTime?: Date }) {
  return (
    <div className="ml-auto text-neutral-300 text-xs whitespace-nowrap">
      <ReactTimeAgo date={props.dateTime || 0} />
    </div>
  );
}

export function TwitImg(props: { src?: string }) {
  return <img src={props.src} className="h-40 rounded object-cover" />;
}

export function ReactionsAndReplyContainer(props: { children: React.ReactNode }) {
  return <div className="flex flex-col mt-2">{props.children}</div>;
}

export function ReactionsContainer(props: { children: React.ReactNode }) {
  return <div className="flex gap-4">{props.children}</div>;
}

export function RepliesContainer(props: { children: React.ReactNode }) {
  return <div className="flex flex-col items-stretch gap-2 mt-2">{props.children}</div>;
}

export function ButtonWithCount(props: {
  count: number;
  onClick: () => void;
  active?: boolean;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center">
      <Button
        className="w-10 h-7 p-1 mr-1"
        variant={props.active ? 'secondary' : 'outline'}
        onClick={props.onClick}
        size="icon"
      >
        {props.active ? props.activeIcon : props.icon}
      </Button>{' '}
      <span className="tabular-nums">{props.count}</span>
    </div>
  );
}

export function TwitTextInput(props: { onSubmit: (text: string) => void; submitButtonLabel: string }) {
  return (
    <form
      onSubmit={event => {
        event.preventDefault();

        const form = event.target as HTMLFormElement;
        const text = form.twitText.value;
        text && props.onSubmit(text);
        form.twitText.value = '';
      }}
      className="flex gap-2 items-end"
    >
      <Input
        type="text"
        name="twitText"
        placeholder="What's happenin'"
        autoComplete="off"
        className="p-2 border rounded grow"
      />
      <Button asChild>
        <input type="submit" value={props.submitButtonLabel} />
      </Button>
    </form>
  );
}

export function AddTwitPicsInput(props: { onChange: (files: File[]) => void }) {
  return (
    <Button asChild className="mt-2" size="sm" variant="secondary">
      <label className="cursor-pointer text-xs">
        Add Pics
        <Input
          type="file"
          onChange={e => {
            props.onChange(Array.from(e.target.files || []));
          }}
          className="hidden"
          accept="image/*"
          multiple
        />
      </label>
    </Button>
  );
}
