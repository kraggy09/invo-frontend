export const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
};


export const convertToGramorKG = (num: number): string => {
  if (num >= 1) {
    return num.toFixed(2) + " kg";
  }
  return (num * 1000).toFixed(2) + " g";
}