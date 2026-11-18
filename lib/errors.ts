import type {UnavailableReason} from './contracts';
export class CoachError extends Error {
 constructor(public readonly reason:UnavailableReason, public readonly diagnostic?: {httpStatus:number;category:'quota_or_rate_limit'|'access'|'request_configuration'|'provider_service'|'other'}){super(reason);this.name='CoachError';}
}
