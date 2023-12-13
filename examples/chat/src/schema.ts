import { CoListOf, CoMapOf, imm } from 'jazz-js';

export class Message extends CoMapOf({ text: imm.string }) {}
export class Chat extends CoListOf(Message) {}