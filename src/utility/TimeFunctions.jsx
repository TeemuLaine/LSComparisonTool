const timeToMs = (time) => {
  // console.log(time)
  let timeWithMs = time.includes(".")
    ? time.split(".")[0] + "." + time.split(".")[1].slice(0, 3).padEnd(3, "0")
    : time + ".000";

  const timeParts = timeWithMs.split(":");
  let hours = 0, minutes = 0, seconds = 0, milliseconds = 0;

  if (timeParts.length === 3) {
    [hours, minutes, seconds] = timeParts;
    [seconds, milliseconds] = seconds.split(".").map(parseFloat);
  } else if (timeParts.length === 2) {
    [minutes, seconds] = timeParts;
    [seconds, milliseconds] = seconds.split(".").map(parseFloat);
  } else if (timeParts.length === 1) {
    [seconds, milliseconds] = timeParts[0].split(".").map(parseFloat);
  }

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
};

const msToTime = (ms) => {
  const hours = Math.floor(ms / 3600000);
  ms %= 3600000;
  const minutes = Math.floor(ms / 60000);
  ms %= 60000;
  const seconds = Math.floor(ms / 1000);
  ms %= 1000;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")
    .slice(0, 2)}`;
};

const formatTime = (time) => {
  let formattedTime = time.slice(0, time.indexOf(".") + 3);
  return formattedTime.startsWith("00:") ? formattedTime.slice(3) : formattedTime;
};


export const timeRegex = /^\d{2}:\d{2}.\d{2}$/;

export { timeToMs, msToTime, formatTime };
