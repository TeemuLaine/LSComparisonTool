function timeToMs(time: string) {
  const timeRegex =
    /^(?:(?:[0-9]|[0-1][0-9]|2[0-3]):)?(?:[0-5]?[0-9]:)?(?:[0-5]?[0-9])(?:\.\d+)?$/;
  if (!timeRegex.test(time)) {
    return;
  }

  let timeWithMs = time.includes(".")
    ? time.split(".")[0] + "." + time.split(".")[1].slice(0, 3).padEnd(3, "0")
    : time + ".000";

  const timeParts = timeWithMs.split(":");
  let hours = "0",
    minutes = "0",
    seconds = "0",
    milliseconds = "0";

  if (timeParts.length === 3) {
    [hours, minutes, seconds] = timeParts;
    [seconds, milliseconds] = seconds.split(".");
  } else if (timeParts.length === 2) {
    [minutes, seconds] = timeParts;
    [seconds, milliseconds] = seconds.split(".");
  } else if (timeParts.length === 1) {
    [seconds, milliseconds] = timeParts[0].split(".");
  }

  return (
    parseInt(hours) * 3600000 +
    parseInt(minutes) * 60000 +
    parseInt(seconds) * 1000 +
    Math.round(parseInt(milliseconds))
  );
}


const formatTime = (ms: number) => {
  const hours: number = Math.floor(ms / 3600000);
  ms %= 3600000;
  const minutes: number = Math.floor(ms / 60000);
  ms %= 60000;
  const seconds: number = Math.floor(ms / 1000);
  ms %= 1000;
  let time = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")
    .slice(0, 2)}`;

  let formattedTime = time.slice(0, time.indexOf(".") + 3);
  return formattedTime.startsWith("00:")
    ? formattedTime.slice(3)
    : formattedTime;
};

export { timeToMs, formatTime };
