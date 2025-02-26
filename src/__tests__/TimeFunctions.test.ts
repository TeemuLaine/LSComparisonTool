import { describe, it, expect } from "vitest";
import { timeToMs } from "../utility/TimeFunctions";

describe("timeToMs", () => {

  it('should convert "01:02:03.45000000000000" to milliseconds', () => {
    expect(timeToMs("01:02:03.45000000000000")).toBe(3723450);
  });

  it('should convert "3.7981239898132" to milliseconds', () => {
    expect(timeToMs("3.7981239898132")).toBe(3798);
  });

  it('should convert "01:02:03.45" to milliseconds', () => {
    expect(timeToMs("01:02:03.45")).toBe(3723450);
  });

  it('should convert "1:02:03.45" to milliseconds', () => {
    expect(timeToMs("1:02:03.45")).toBe(3723450);
  });

  it('should convert "02:03.45" to milliseconds', () => {
    expect(timeToMs("02:03.45")).toBe(123450);
  });

  it('should convert "2:03.45" to milliseconds', () => {
    expect(timeToMs("2:03.45")).toBe(123450);
  });

  it('should convert "03.45" to milliseconds', () => {
    expect(timeToMs("03.45")).toBe(3450);
  });

  it('should convert "3.45" to milliseconds', () => {
    expect(timeToMs("3.45")).toBe(3450);
  });

  it("should return for invalid time format", () => {
    expect(() => timeToMs("invalid")).toReturn;
  });

  it("should return for invalid time format (over 60 seconds)", () => {
    expect(() => timeToMs("1:81:22.21")).toReturn;
  });
});
