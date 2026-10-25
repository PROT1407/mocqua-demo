import { bankDefaults } from './contact.js';

function clean(value) {
  return String(value ?? '').trim();
}

function pick(value, fallback) {
  return clean(value) || fallback;
}

export function bankConfig() {
  const bin = pick(process.env.BANK_BIN, bankDefaults.bin);
  const accountNo = pick(process.env.ACCOUNT_NO, bankDefaults.accountNo);
  const accountName = pick(process.env.ACCOUNT_NAME, bankDefaults.accountName);
  const bankName = pick(process.env.BANK_NAME, bankDefaults.bankName);
  const ready = /^\d{6}$/.test(bin) && /^\d{6,20}$/.test(accountNo) && accountName.length >= 2;
  return { bin, accountNo, accountName, bankName, ready };
}

export function vietqrFor(amount, addInfo) {
  const bank = bankConfig();
  const value = Math.max(0, Math.round(Number(amount) || 0));
  const content = String(addInfo || '').trim();
  if (!bank.ready) {
    return { ready: false, amount: value, addInfo: content, url: '', ...bank };
  }
  const params = new URLSearchParams();
  params.set('amount', String(value));
  params.set('addInfo', content);
  params.set('accountName', bank.accountName);
  const url = `https://img.vietqr.io/image/${bank.bin}-${bank.accountNo}-compact2.png?${params.toString()}`;
  return { ready: true, amount: value, addInfo: content, url, ...bank };
}
