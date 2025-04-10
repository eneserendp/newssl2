export interface WhoisInfo {
  domainExpiryDate: string;
  registrar?: string;
}

export const checkWhois = async (domain: string): Promise<WhoisInfo> => {
  const apiKey = 'at_JLgYZoinG09Dy3UxKh4NuVb0f5ktS';
  const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error('WHOIS lookup failed');
    }

    const expiryDate = data.WhoisRecord?.registryData?.expiresDate || 
                      data.WhoisRecord?.expiresDate;
    const registrar = data.WhoisRecord?.registrar?.name;

    return {
      domainExpiryDate: expiryDate || 'Unknown',
      registrar: registrar || 'Unknown'
    };
  } catch (error) {
    console.error('WHOIS lookup error:', error);
    throw error;
  }
};
