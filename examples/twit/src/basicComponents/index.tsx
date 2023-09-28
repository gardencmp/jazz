import ReactTimeAgo from 'react-time-ago';
import { Button, ButtonProps } from './ui/button';
export { Button } from './ui/button';
export { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Link } from 'react-router-dom';
export { Input } from './ui/input';
export { Skeleton } from './ui/skeleton';
export { Toaster } from './ui/toaster';
export { useToast } from './ui/use-toast';
export { SubmittableInput } from './SubmittableInput';
export { TitleAndLogo } from './TitleAndLogo';
export { ThemeProvider } from './themeProvider';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
export { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
TimeAgo.addDefaultLocale(en);

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
      className="w-full p-2 border rounded max-md:text-base"
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

export function ProfilePicImg(props: { src?: string; size?: 'sm' | 'xxl'; linkTo?: string; initial?: string }) {
  return (
    <Link to={props.linkTo || ''}>
      {props.src ? (
        <img
          src={props.src}
          className={
            'bg-neutral-200 rounded-full mr-2 object-cover shrink-0' +
            (props.size === 'sm' ? ' w-8 h-8' : props.size === 'xxl' ? ' w-20 h-20' : ' w-10 h-10')
          }
        />
      ) : (
        <div
          className={
            'bg-neutral-200 rounded-full mr-2 object-cover shrink-0 flex items-center justify-center text-neutral-700 ' +
            (props.size === 'sm'
              ? ' w-8 h-8 text-[1.5rem]'
              : props.size === 'xxl'
              ? ' w-20 h-20 text-[3.75rem]'
              : ' w-10 h-10 text-[1.875rem]')
          }
        >
          <div className="-mt-[8%]">{props.initial}</div>
        </div>
      )}
    </Link>
  );
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

export function ReactionsContainer(props: { children: React.ReactNode }) {
  return <div className="flex gap-4 mt-2">{props.children}</div>;
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
        className="p-2 border rounded grow max-md:text-base"
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

export function TwitWithRepliesContainer(props: { children: React.ReactNode; isTopLevel?: boolean }) {
  return (
    <div className={'py-2 flex flex-col items-stretch' + (props.isTopLevel ? ' border-t' : ' ml-14')}>
      {props.children}
    </div>
  );
}

export function TwitContainer(props: { children: React.ReactNode }) {
  return <div className="flex gap-2">{props.children}</div>;
}

export function TwitBody(props: { children: React.ReactNode }) {
  return <div className="grow flex flex-col items-stretch">{props.children}</div>;
}

export function TwitHeader(props: { children: React.ReactNode }) {
  return <div className="flex items-baseline">{props.children}</div>;
}

export function TwitImgGallery(props: { children: React.ReactNode }) {
  return <div className="flex gap-2 mt-2 max-w-full overflow-auto">{props.children}</div>;
}

export function TwitText(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={props.style}>{props.children}</div>;
}

export function QuoteContainer(props: { children: React.ReactNode }) {
  return <div className="border rounded">{props.children}</div>;
}

export function MainH1(props: { children: React.ReactNode }) {
  return <h1 className="text-2xl mb-4">{props.children}</h1>;
}

export function SmallInlineButton(props: { children: React.ReactNode } & ButtonProps) {
  const {children, ...rest} = props
  return (
    <Button variant={'ghost'} className="h-6 px-1 -mx-1" {...rest}>
      {children}
    </Button>
  );
}
