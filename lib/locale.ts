import type {Language,ReplyLanguage} from './contracts';
export function resolveLanguage(selection:ReplyLanguage,text:string,previous:Language):Language {
 if(selection!=='auto') return selection;
 if(/\p{Script=Arabic}/u.test(text)) return 'ur';
 if(/\p{Script=Latin}/u.test(text)) return 'en';
 return previous;
}
