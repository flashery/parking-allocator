const moment = require("moment")
class Vehicle {
  constructor(id, color, start_time, entry_point, size) {
    this.id = id;
    this.color = color;
    this.start_time = start_time;
    this.entry_point = entry_point;
    this.size = size;
  }

  parkPrint(parking_slot) {
    console.log(`Successfully park this vehicle @ ${moment(this.start_time).format("YYYY-MM-DD H:m A")} on this parking slot`, parking_slot);
  }

  unParkPrint(parking_slot) {
    console.log(`Successfully unpark this vehicle @ ${moment(this.start_time).format("YYYY-MM-DD H:m A")} on this parking slot`, parking_slot);
  }
}

module.exports = Vehicle;
