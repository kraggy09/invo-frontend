export const calculateDate = (date: Date) => {
  let str =
    date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
  return str;
};
export const calculateTime = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const str =
    (hours > 9 ? hours : "0" + hours) +
    ":" +
    (minutes > 9 ? minutes : "0" + minutes) +
    ":" +
    (seconds > 9 ? seconds : "0" + seconds);
  return str;
};
// Sample category array with price information

export const calculateMeasuring = (total: number) => {
  if (total < 1) {
    const grams = total * 1000;
    const formatted = grams % 1 !== 0 ? grams.toPrecision(3) : grams.toString();
    return formatted + " g";
  } else {
    const formatted = total % 1 !== 0 ? total.toFixed(2) : total.toString();
    return formatted + " kg";
  }
};
