import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface WhoisInfo {
  domainExpiryDate: string | null;
  registrar?: string | null;
}

export async function checkWhois(domain: string): Promise<WhoisInfo> {
  try {
    // Try whois command first
    const { stdout } = await execPromise(`whois ${domain}`);
    
    // Parse expiry date and registrar from whois output
    const expiryMatch = stdout.match(/Expir[y|ation] Date:\s*(.+)/i);
    const registrarMatch = stdout.match(/Registrar:\s*(.+)/i);

    const domainExpiryDate = expiryMatch?.[1]?.trim();
    const registrar = registrarMatch?.[1]?.trim();

    // If we can't find the date, return null values
    if (!domainExpiryDate) {
      console.log(`No expiry date found for ${domain} in WHOIS data`);
      return {
        domainExpiryDate: null,
        registrar: registrar || null
      };
    }

    // Try to parse the date
    const parsedDate = new Date(domainExpiryDate);
    if (isNaN(parsedDate.getTime())) {
      console.log(`Invalid date format for ${domain}: ${domainExpiryDate}`);
      return {
        domainExpiryDate: null,
        registrar: registrar || null
      };
    }

    return {
      domainExpiryDate: parsedDate.toISOString(),
      registrar: registrar || null
    };

  } catch (error) {
    console.log(`WHOIS lookup failed for ${domain}, using fallback values`);
    return {
      domainExpiryDate: null,
      registrar: null
    };
  }
}
