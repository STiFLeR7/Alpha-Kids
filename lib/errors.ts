import type {UnavailableReason} from './contracts';
export class CoachError extends Error {
 constructor(public readonly reason:UnavailableReason){super(reason);this.name='CoachError';}
}
