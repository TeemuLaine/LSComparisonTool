import { useEffect, useState } from "react";
import { XMLParser } from "fast-xml-parser";
import { formatTime, timeToMs } from "./utility/TimeFunctions";
import Spreadsheet from "react-spreadsheet";
import ColumnLabels from "./utility/ColumnLabels";
import _ from "lodash"; // Import lodash for deep comparison

const App = () => {
  const [splits, setSplits] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [data, setData] = useState([]);
  const [activatedCell, setActivatedCell] = useState({ row: 0, col: 0 });
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
      })
      .catch((error) => console.error("Error loading XML:", error));
  }, []);

  const columnLabels = Object.values(ColumnLabels);
  const rowLabels = splits.map((split, index) => [index + 1]);

  const onSegmentTimeChange = (row, col, newData) => {
    const segmentTimeMs = timeToMs(newData[row][col].value);
    if (isNaN(segmentTimeMs)) return;

    const prevSplitTimeMs =
      row === 0
        ? 0
        : timeToMs(
            newData[row - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value
          );
    if (isNaN(prevSplitTimeMs)) return;

    const newSplitTimeMs = prevSplitTimeMs + segmentTimeMs;
    if (newSplitTimeMs < 0) return;

    newData[row][columnLabels.indexOf(ColumnLabels.SplitTime)].value =
      formatTime(newSplitTimeMs);

    for (let i = row + 1; i < splits.length; i++) {
      const segmentTimeMs = timeToMs(
        newData[i][columnLabels.indexOf(ColumnLabels.SegmentTime)].value
      );
      if (isNaN(segmentTimeMs)) return;

      const prevSplitTimeMs = timeToMs(
        newData[i - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value
      );
      if (isNaN(prevSplitTimeMs)) return;

      const newSplitTimeMs = prevSplitTimeMs + segmentTimeMs;
      if (newSplitTimeMs < 0) return;

      newData[i][columnLabels.indexOf(ColumnLabels.SplitTime)].value =
        formatTime(newSplitTimeMs);
    }
  };

  const onSplitTimeChange = (row, newData) => {
    const splitTimeMs = timeToMs(
      newData[row][columnLabels.indexOf(ColumnLabels.SplitTime)].value
    );
    if (isNaN(splitTimeMs)) return;

    const prevSplitTimeMs =
      row === 0
        ? 0
        : timeToMs(
            newData[row - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value
          );
    if (isNaN(prevSplitTimeMs)) return;

    const newSegmentTimeMs = splitTimeMs - prevSplitTimeMs;
    if (newSegmentTimeMs < 0) return;

    newData[row][columnLabels.indexOf(ColumnLabels.SegmentTime)].value =
      formatTime(newSegmentTimeMs);

    for (let i = row + 1; i < splits.length; i++) {
      const segmentTimeMs = timeToMs(
        newData[i][columnLabels.indexOf(ColumnLabels.SegmentTime)].value
      );
      if (isNaN(segmentTimeMs)) return;

      const prevSplitTimeMs = timeToMs(
        newData[i - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value
      );
      if (isNaN(prevSplitTimeMs)) return;

      const newSplitTimeMs = prevSplitTimeMs + segmentTimeMs;
      if (newSplitTimeMs < 0) return;

      newData[i][columnLabels.indexOf(ColumnLabels.SplitTime)].value =
        formatTime(newSplitTimeMs);
    }
  };

  const handleChange = (newData) => {
    const row = activatedCell.row;
    const col = activatedCell.column;
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

    // Only update state if newData is different from current data
    if (!_.isEqual(data, newData)) {
      setData(newData);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h1>Splits</h1>
      <Spreadsheet
        data={data}
        columnLabels={columnLabels}
        rowLabels={rowLabels}
        onChange={handleChange}
        onActivate={setActivatedCell}
      />
      <h2>Total Time we have to work with: {formatTime(totalTime)}</h2>
    </div>
  );
};

export default App;
