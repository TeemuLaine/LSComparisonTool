import { useEffect, useState } from "react";
import { XMLParser } from "fast-xml-parser";
import { formatTime, msToTime, timeToMs } from "./utility/TimeFunctions";

const App = () => {
  const [splits, setSplits] = useState([]);

  useEffect(() => {
    fetch("/example.lss")
      .then((response) => response.text())
      .then((xmlString) => {
        const parser = new XMLParser();
        const result = parser.parse(xmlString);
        const splitObjects = result.Run.Segments.Segment.map((segment) => {
          const name = segment.Name;
          const time = segment.SplitTimes.SplitTime.RealTime;
          const ms = timeToMs(time.slice(0, time.indexOf(".") + 4));
          const gold = segment.BestSegmentTime.RealTime;
          const goldMs = timeToMs(gold.slice(0, gold.indexOf(".") + 3));
          return {
            name,
            time,
            ms,
            gold,
            goldMs,
          };
        });
        setSplits(splitObjects);
      })
      .catch((error) => console.error("Error loading XML:", error));
  }, []);

  // Generate segment times
  useEffect(() => {
    // Only run when segmentTime is first added
    if (splits.length > 0 && splits[0].segmentTime === undefined) {
      const updatedSplits = splits.map((split, i) => {
        const segmentTimeMs = i === 0 ? split.ms : split.ms - splits[i - 1].ms;
        const segmentTime = msToTime(segmentTimeMs);
        return {
          ...split,
          segmentTimeMs,
          segmentTime,
        };
      });
      setSplits(updatedSplits);
    }
  }, [splits]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h1>Splits</h1>
      <ul>
        {splits.map((split) => {
          return (
            <li key={split.id} style={{marginBottom: 20}}>
              <strong>{split.name}</strong> - {formatTime(split.time)}
              <br></br> Gold: {formatTime(split.gold)}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default App;
