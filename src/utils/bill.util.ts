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

export const formatNum = (
  val: number | string | undefined | null,
  useCommas: boolean = true
): string => {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num)) return "0";
  const rounded = Math.round(num * 100) / 100;
  if (!useCommas) {
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2);
  }
  return rounded.toLocaleString("en-IN", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
};
