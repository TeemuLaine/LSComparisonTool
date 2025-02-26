import { useEffect, useState } from "react";
import { XMLParser } from "fast-xml-parser";
import { formatTime, timeToMs } from "./utility/TimeFunctions";
import Spreadsheet from "react-spreadsheet";
import ColumnLabels from "./utility/ColumnLabels";
import _ from "lodash";
import "./App.css";

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
          { value: formatTime(split.goldMs), readOnly: true, className: "gold" },
        ]);
        setData(updatedData);
      })
      .catch((error) => console.error("Error loading XML:", error));
  }, []);

  const columnLabels = Object.values(ColumnLabels);
  const rowLabels = splits.map((split, index) => [index + 1]);

  const updateTimes = (row, newData, isSegmentTimeChange) => {
    // Convert currently edited time to milliseconds
    const currentTimeMs = timeToMs(
      newData[row][
        columnLabels.indexOf(
          isSegmentTimeChange
            ? ColumnLabels.SegmentTime
            : ColumnLabels.SplitTime
        )
      ].value
    );
    if (isNaN(currentTimeMs)) return;

    // Get previous split time if it's not the first row
    const prevSplitTimeMs =
      row === 0
        ? 0
        : timeToMs(
            newData[row - 1][columnLabels.indexOf(ColumnLabels.SplitTime)].value
          );
    if (isNaN(prevSplitTimeMs)) return;

    // Calculate new time for the currently edited row
    const newTimeMs = isSegmentTimeChange
      ? prevSplitTimeMs + currentTimeMs
      : currentTimeMs - prevSplitTimeMs;
    if (newTimeMs < 0) return;

    // Update the appropriate time for the currently edited row and format it for display
    newData[row][
      columnLabels.indexOf(
        isSegmentTimeChange ? ColumnLabels.SplitTime : ColumnLabels.SegmentTime
      )
    ].value = formatTime(newTimeMs);

    const goldTimeMs = timeToMs(
      newData[row][columnLabels.indexOf(ColumnLabels.Gold)].value
    );

    if (currentTimeMs < goldTimeMs) {
      newData[row][columnLabels.indexOf(ColumnLabels.SegmentTime)].className =
        "error";
    } else {
      newData[row][columnLabels.indexOf(ColumnLabels.SegmentTime)].className =
        "";
    }

    // Update times from the currently edited row to the end of the splits
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
    // Determine which cell was edited and call the function appropriately
    const row = activatedCell.row;
    const col = activatedCell.column;

    let isSegmentTimeChange =
      col === columnLabels.indexOf(ColumnLabels.SegmentTime);
    updateTimes(row, newData, isSegmentTimeChange);

    // Only update state if new data is different from previous data
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
