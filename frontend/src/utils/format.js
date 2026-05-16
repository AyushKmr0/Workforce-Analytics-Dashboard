export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}
