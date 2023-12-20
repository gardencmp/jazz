import { CoMap, CoList } from 'cojson';

export type Chat = CoList<Message['id']>;
export type Message = CoMap<{ text: string }>;
