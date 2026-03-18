export const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return '';
  const date = parseDate(dateString);
  if (!date) return '';
  return date.toLocaleDateString();
};

export const parseDate = (dateString: string | undefined | null) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};
