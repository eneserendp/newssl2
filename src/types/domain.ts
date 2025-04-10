import { SSLInfo } from '../utils/sslChecker';

export interface DomainData {
  domain: string;
  sslInfo: SSLInfo;
  createdAt?: Date;
  updatedAt?: Date;
}