// Import libraries
const readline = require("readline");
const moment = require("moment");

// Import classess
const Vehicle = require("./classes/Vehicle");
const { Console } = require("console");

// Initialize libraries
const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Import data structures
const parking_slots = require("./parking-slots").get();
const entry_points = require("./entry-points").get();


const flat_rate = 40;
const starting_hours = 3;
const rate_24_hour = 5000
const exceeding_hours_rates = [
  { slot_size: "SP", rate: 20, unit: "hour" },
  { slot_size: "MP", rate: 60, unit: "hour" },
  { slot_size: "LP", rate: 100, unit: "hour" },
]

function ask(questionText) {
  return new Promise((resolve, reject) => {
    readlineInterface.question(questionText, (input) => resolve(input));
  });
}

async function park(entry_point) {
  const vehicle_id = await ask("What is your vehicle id?: ");
  const vehicle_color = await ask("What your vehicle color?: ");
  const vehicle_size = await ask("What is the size of your vehicle? (S|M|L): ");

  let vehicle = null;
  let vehicle_found = false;
  let parking_slot = null;
  let fail = false;

  for (let i = 0; i < parking_slots.length; i++) {
    
    if(parking_slots[i].occopied && parking_slots[i].occopied.id === vehicle_id) {
      vehicle_found = true; 
      break;
    }

    if (
      !parking_slots[i].occopied &&
      parking_slots[i].allowed_vehicle_size.includes(vehicle_size) &&
      parking_slots[i].new_entry_point === entry_point
    ) {
      parking_slot = parking_slots[i];
      console.log("Parking slot found for your vehicle!", parking_slot)
      vehicle = new Vehicle(vehicle_id, vehicle_color, moment.now(), entry_point, vehicle_size);
      parking_slots[i].occopied = vehicle;
      fail = false;
      break;
    } else {
      fail = true;
    }
  }

  if (fail) {
    console.log("Sorry, no parking slot available for this type of vehicle.")
  } else if(vehicle_found){
    console.log("Vehicle found and already parked.")
  } else {
    vehicle.parkPrint(parking_slot);
  }


  parkPrompt();
}

async function unpark() {
  let vehicle = null;
  let found = false;
  let paid = false;
  let parking_slot = null;
  const vehicle_id = await ask("What is your vehicle id?: ");

  for (let i = 0; i < parking_slots.length; i++) {
    vehicle = parking_slots[i].occopied;
    if (vehicle && vehicle.id === vehicle_id) {
      parking_slot =  parking_slots[i]
      console.log("Your vehicle found on this parking slot!", parking_slot)
      paid = await computePaymentandPay(parking_slot);
      if (paid) {
        parking_slots[i].occopied = null;
        found = true
        break;
      }
    } else {
      found = false;
    }
  }

  if (!found) {
    console.log("Sorry, vehicle not found in our parking slots.")
  } else if(found && paid) {
    vehicle.unParkPrint(parking_slot);
  } else {
    console.log("Sorry, some error occur during unpark process.")
  }

  parkPrompt();
}

async function computePaymentandPay(parking_slot) {
  const vehicle = parking_slot.occopied;
  const duration = moment.duration(moment().add(52, 'hours').diff(vehicle.start_time));
  const hours = Math.round(duration.asHours());
  let price = 0;

  if (hours <= starting_hours) {
    price = flat_rate;
  } else if (hours > starting_hours && hours < 24) {
    price = computeExceedingHours(parking_slot, hours)
  } else if (hours >= 24) {
    price = compute24HourRate(parking_slot, hours)
  }
  console.log(`Your total parking amount is ${price}`)
  const paid = await pay(price);

  if (paid) {
    console.log("Thank you for using our parking slot");
    return paid;
  }
}

async function pay(price) {
  const payment = await ask("Please enter your payment: ");
  price -= payment;
  
  if (price > 0) {
    console.log(`Sorry, you still have existing amount to be pay ${price}`);
    console.log(`Please pay before exiting.`);
    await pay(price);
  } else {
    return true;
  }
}

function computeExceedingHours(parking_slot, hours) {
  const { rate } = exceeding_hours_rates.find(rate => rate.slot_size === parking_slot.size)
  return (hours - starting_hours) * rate + flat_rate;
}

function compute24HourRate(parking_slot, hours) {
  price = Math.round(hours / 24) * rate_24_hour
  const remainder = hours % 24;
  const { rate } = exceeding_hours_rates.find(rate => rate.slot_size === parking_slot.size)
  return (remainder * rate) + price;
}

function randomEntryPoint(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function parkPrompt() {
  let answer = await ask("Want to park or unpark a vehicle? (P|UP|X): ");

  if (answer === "P") {
    const entry_point = entry_points[randomEntryPoint(0, 2)];
    console.log("You are from entry point", entry_point)
    park(entry_point);
  } else if (answer === "UP") {
    unpark();
  } else if (answer === "X") {
    process.exit();
  } else {
    console.log("Wrong input please enter:");
    console.log("P => to park ");
    console.log("UP => to unpark");
    console.log("X => to exit the prompt");
    parkPrompt();
  }
}

(() => {
  parkPrompt();
})();
