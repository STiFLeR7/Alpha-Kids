import type {Language,ReplyLanguage,Turn} from './contracts';
export function resolveLanguage(selection:ReplyLanguage,text:string,previous:Language):Language {
 if(selection!=='auto') return selection;
 if(/\p{Script=Arabic}/u.test(text)) return 'ur';
 if(/\p{Script=Latin}/u.test(text)) return 'en';
 return previous;
}
export function conversationLanguage(transcript: readonly Turn[]): Language {
 return transcript.reduce<Language>((previous,turn)=>turn.role==='assistant'
   ? turn.reply.language : resolveLanguage('auto',turn.text,previous),'en');
}
