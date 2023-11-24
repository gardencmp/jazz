import { co, im } from 'jazz-schema';

export class Message extends co.Map({ text: im.string }) {}
export class Chat extends co.List(Message) {}