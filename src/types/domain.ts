export interface SSLInfo {
  valid: boolean;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  issuer: string;
  domainExpiryDate?: string;
  registrar?: string;
  lastChecked?: string;
}

export interface DomainData {
  domain: string;
  sslInfo: SSLInfo;
  updatedAt: Date;
}