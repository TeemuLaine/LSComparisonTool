import { useEffect, useRef, useState } from "react";
import { XMLParser } from "fast-xml-parser";
import {
  formatTime,
  msToTime,
  timeRegex,
  timeToMs,
} from "./utility/TimeFunctions";
import Spreadsheet from "react-spreadsheet";
import ColumnLabels from "./utility/ColumnLabels";

const App = () => {
  const [splits, setSplits] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [data, setData] = useState([]);
  const prevDataRef = useRef([]);

  useEffect(() => {
    fetch("/example.lss")
      .then((response) => response.text())
      .then((xmlString) => {
        const parser = new XMLParser();
        const result = parser.parse(xmlString);
        const splitObjects = result.Run.Segments.Segment.map(
          (segment, i, arr) => {
            const name = segment.Name;
            const time = segment.SplitTimes.SplitTime.RealTime;
            const ms = timeToMs(time.slice(0, time.indexOf(".") + 4));

            const gold = segment.BestSegmentTime.RealTime;
            const goldMs = timeToMs(gold.slice(0, gold.indexOf(".") + 3));

            const prevSegment =
              i === 0 ? 0 : arr[i - 1].SplitTimes.SplitTime.RealTime;
            const prevMs = prevSegment === 0 ? 0 : timeToMs(prevSegment);

            const segmentTimeMs = i === 0 ? ms : ms - prevMs;
            const segmentTime = msToTime(segmentTimeMs);
            return {
              name,
              time,
              ms,
              gold,
              goldMs,
              segmentTime,
              segmentTimeMs,
            };
          }
        );

        setTotalTime(splitObjects[splitObjects.length - 1].ms);
        setSplits(splitObjects);

        const updatedData = splitObjects.map((split) => [
          { value: split.name },
          { value: formatTime(split.time) },
          { value: formatTime(split.segmentTime) },
          { value: formatTime(split.gold) },
        ]);
        setData(updatedData);
        prevDataRef.current = updatedData;
      })
      .catch((error) => console.error("Error loading XML:", error));
  }, []);

  const columnLabels = Object.values(ColumnLabels);
  const rowLabels = splits.map((split, index) => [index + 1]);

  const getChangedColumn = (prevData, newData) => {
    for (let row = 0; row < newData.length; row++) {
      for (let col = 0; col < newData[row].length; col++) {
        if (newData[row][col].value !== prevData[row][col].value) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const onSegmentTimeChange = (row, col, newData) => {
    let prevSplitTime =
      row === 0
        ? 0
        : newData[row - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value;
    let currentSegment = newData[row][col].value;
    if (
      (row === 0 || timeRegex.test(prevSplitTime)) &&
      timeRegex.test(currentSegment)
    ) {
      prevSplitTime = row === 0 ? 0 : timeToMs(prevSplitTime);
      currentSegment = timeToMs(currentSegment);

      newData[row][columnLabels.indexOf(ColumnLabels.SplitTime)].value =
        formatTime(msToTime(prevSplitTime + currentSegment));

      onSplitTimeChange(row, newData);
    } else {
      console.error("Invalid time format. Expected mm:ss.ms");
    }
  };

  const onSplitTimeChange = (row, newData) => {
    if (
      timeRegex.test(
        newData[row][columnLabels.indexOf(ColumnLabels.SplitTime)].value
      )
    ) {
      let sumAsMs =
        timeToMs(
          newData[row][columnLabels.indexOf(ColumnLabels.SplitTime)].value
        ) -
        timeToMs(
          newData[row - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value
        );

      newData[row][columnLabels.indexOf(ColumnLabels.SegmentTime)].value =
        formatTime(msToTime(sumAsMs));

      for (let i = row + 1; i < splits.length; i++) {
        sumAsMs =
          timeToMs(
            newData[i - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value
          ) +
          timeToMs(
            newData[i][columnLabels.indexOf(ColumnLabels.SegmentTime)].value
          );

        newData[i][columnLabels.indexOf(ColumnLabels.SplitTime)].value =
          formatTime(msToTime(sumAsMs));
      }
    }
  };

  const handleChange = (newData) => {
    const prevData = prevDataRef.current;
    const change = getChangedColumn(prevData, newData);

    if (change) {
      const { row, col } = change;
      switch (col) {
        case columnLabels.indexOf(ColumnLabels.SegmentTime): {
          onSegmentTimeChange(row, col, newData);
          break;
        }
        case columnLabels.indexOf(ColumnLabels.SplitTime): {
          onSplitTimeChange(row, newData);
          break;
        }
        default:
          break;
      }

      setData(newData);
      prevDataRef.current = newData;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h1>Splits</h1>
      <Spreadsheet
        data={data}
        onChange={handleChange}
        columnLabels={columnLabels}
        rowLabels={rowLabels}
      />
      <h2>
        Total Time we have to work with: {formatTime(msToTime(totalTime))}
      </h2>
    </div>
  );
};

export default App;
