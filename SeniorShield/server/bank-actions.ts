// Bank contact information and actions
const BANK_CONTACTS = {
  'ANZ': {
    name: 'ANZ Bank',
    fraudHotline: '1800 019 208',
    website: 'https://www.anz.com.au/support/security-privacy/report-fraud/',
    actions: ['Call Fraud Hotline', 'Report Online', 'Block Card', 'Dispute Transaction']
  },
  'NAB': {
    name: 'National Australia Bank',
    fraudHotline: '1800 033 103',
    website: 'https://www.nab.com.au/personal/help-and-support/security-and-fraud/report-fraud',
    actions: ['Call Fraud Hotline', 'Report Online', 'Block Card', 'Dispute Transaction']
  },
  'CBA': {
    name: 'Commonwealth Bank',
    fraudHotline: '1800 023 100',
    website: 'https://www.commbank.com.au/support/security/report-fraud.html',
    actions: ['Call Fraud Hotline', 'Report Online', 'Block Card', 'Dispute Transaction']
  },
  'Westpac': {
    name: 'Westpac Banking Corporation',
    fraudHotline: '1800 032 100',
    website: 'https://www.westpac.com.au/help/security/report-fraud/',
    actions: ['Call Fraud Hotline', 'Report Online', 'Block Card', 'Dispute Transaction']
  },
  'ING': {
    name: 'ING Australia',
    fraudHotline: '133 464',
    website: 'https://www.ing.com.au/help-and-support/security/report-fraud.html',
    actions: ['Call Customer Service', 'Report Online', 'Block Card']
  },
  'Bendigo': {
    name: 'Bendigo Bank',
    fraudHotline: '1300 236 344',
    website: 'https://www.bendigobank.com.au/customer-support/security-fraud/',
    actions: ['Call Customer Service', 'Report Online', 'Block Card']
  }
};

export function getBankActions(bankName: string) {
  const normalizedName = bankName?.toUpperCase().replace(/\s+/g, '');
  
  // Try exact match first
  if (BANK_CONTACTS[normalizedName]) {
    return BANK_CONTACTS[normalizedName];
  }
  
  // Try partial matches
  for (const [key, value] of Object.entries(BANK_CONTACTS)) {
    if (normalizedName?.includes(key) || key.includes(normalizedName || '')) {
      return value;
    }
  }
  
  // Default actions for unknown banks
  return {
    name: bankName || 'Your Bank',
    fraudHotline: 'Contact your bank',
    website: null,
    actions: ['Call Bank', 'Visit Branch', 'Check Bank App', 'Dispute Transaction']
  };
}

export function generateBankActionPlan(transaction: any, account: any) {
  const bankInfo = getBankActions(account.bankName || account.yodleeProviderName);
  
  return {
    bankInfo,
    recommendedActions: [
      {
        priority: 1,
        action: 'Call Fraud Hotline',
        description: `Call ${bankInfo.fraudHotline} immediately to report suspicious activity`,
        urgent: true
      },
      {
        priority: 2,
        action: 'Block Card/Account',
        description: 'Request immediate block on the affected card or account',
        urgent: true
      },
      {
        priority: 3,
        action: 'Dispute Transaction',
        description: `Formally dispute the transaction for ${transaction.amount} at ${transaction.merchant}`,
        urgent: false
      },
      {
        priority: 4,
        action: 'Monitor Account',
        description: 'Set up enhanced monitoring and alerts for future transactions',
        urgent: false
      }
    ],
    transactionDetails: {
      amount: transaction.amount,
      merchant: transaction.merchant,
      date: transaction.transactionDate,
      reference: `TXN-${transaction.id}`
    }
  };
}