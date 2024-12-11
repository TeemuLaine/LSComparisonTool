const timeToMs = (time) => {
  const timeWithMs = time.padEnd(fullLength, "0");
  const [hours, minutes, remaining] = timeWithMs.split(":");
  const [seconds, milliseconds] = remaining.split(".").map(parseFloat);
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
};

const msToTime = (ms) => {
  const hours = Math.floor(ms / 3600000);
  ms %= 3600000;
  const minutes = Math.floor(ms / 60000);
  ms %= 60000;
  const seconds = Math.floor(ms / 1000);
  ms %= 1000;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
};

const fullLength = 12;

const formatTime = (time) => time.slice(0, time.indexOf(".") + 3);

export { timeToMs, msToTime, fullLength, formatTime };
