import { useEffect, useRef, useState } from "react";
import { XMLParser } from "fast-xml-parser";
import { formatTime, timeToMs } from "./utility/TimeFunctions";
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
            // Get segment name
            const name = segment.Name;

            // Get segment time and convert it to milliseconds
            const time = segment.SplitTimes.SplitTime.RealTime;
            const splitTimeMs = timeToMs(time.slice(0, time.indexOf(".") + 4));

            // Get gold time and convert it to milliseconds
            const gold = segment.BestSegmentTime.RealTime;
            const goldMs = timeToMs(gold.slice(0, gold.indexOf(".") + 3));

            // Calculate previous segment time and convert it to milliseconds if it's not the first segment
            const prevSegment =
              i === 0 ? 0 : arr[i - 1].SplitTimes.SplitTime.RealTime;
            const prevMs = prevSegment === 0 ? 0 : timeToMs(prevSegment);

            // Calculate segment time and convert it to milliseconds
            const segmentTimeMs = i === 0 ? splitTimeMs : splitTimeMs - prevMs;

            // Assign values to split object as milliseconds
            return {
              name,
              splitTimeMs,
              goldMs,
              segmentTimeMs,
            };
          }
        );

        setTotalTime(splitObjects[splitObjects.length - 1].splitTimeMs);
        setSplits(splitObjects);

        // Format times to display in the spreadsheet as time strings
        const updatedData = splitObjects.map((split) => [
          { value: split.name },
          { value: formatTime(split.splitTimeMs) },
          { value: formatTime(split.segmentTimeMs) },
          { value: formatTime(split.goldMs) },
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

    prevSplitTime = row === 0 ? 0 : prevSplitTime;

    newData[row][columnLabels.indexOf(ColumnLabels.SplitTime)].value =
      formatTime(prevSplitTime + currentSegment);

    onSplitTimeChange(row, newData);
  };

  const onSplitTimeChange = (row, newData) => {
    let sumAsMs =
      row === 0
        ? newData[row][columnLabels.indexOf(ColumnLabels.SplitTime)].value
        : newData[row][columnLabels.indexOf(ColumnLabels.SplitTime)].value -
          newData[row - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value;

    newData[row][columnLabels.indexOf(ColumnLabels.SegmentTime)].value =
      formatTime(sumAsMs);

    for (let i = row + 1; i < splits.length; i++) {
      sumAsMs =
        newData[i - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value +
        newData[i][columnLabels.indexOf(ColumnLabels.SegmentTime)].value;

      newData[i][columnLabels.indexOf(ColumnLabels.SplitTime)].value =
        formatTime(sumAsMs);
    }
  };

  const handleChange = (newData) => {
    const prevData = prevDataRef.current;
    const change = getChangedColumn(prevData, newData);

    if (change) {
      const { row, col } = change;
      newData[row][col].value = timeToMs(newData[row][col].value);
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
      <h2>Total Time we have to work with: {formatTime(totalTime)}</h2>
    </div>
  );
};

export default App;
