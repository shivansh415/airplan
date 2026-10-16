/**
 * Spare-parts catalog (demo content).
 *
 * Generic narrow-body twin-engine airliner. Part numbers are DEMO IDs only;
 * real part numbers must come from the supplier or the aircraft IPC.
 * Shape kept flat so it can later be replaced by an Excel import or admin panel.
 */

export type PartCategory = "Rotable" | "Repairable" | "Expendable" | "Consumable";

export type SystemId =
  | "engines"
  | "apu"
  | "landing-gear"
  | "flight-controls"
  | "hydraulics"
  | "fuel"
  | "electrical"
  | "avionics"
  | "lighting"
  | "air-conditioning"
  | "cabin"
  | "doors-windows"
  | "protection"
  | "consumables";

/** Named regions of the 3D airliner that a part highlights. */
export type Anchor =
  | "engine"
  | "pylon"
  | "apu"
  | "nose-gear"
  | "main-gear"
  | "wing"
  | "slats"
  | "flaps"
  | "aileron"
  | "spoilers"
  | "hstab"
  | "elevator"
  | "vstab"
  | "rudder"
  | "fuel"
  | "hydraulic"
  | "electrical"
  | "avionics"
  | "cockpit"
  | "radome"
  | "probes"
  | "lights"
  | "packs"
  | "cabin"
  | "galley"
  | "doors"
  | "windows"
  | "fuselage";

export const ANCHOR_LABELS: Record<Anchor, string> = {
  engine: "Engine & nacelle",
  pylon: "Engine pylon",
  apu: "Auxiliary power unit",
  "nose-gear": "Nose landing gear",
  "main-gear": "Main landing gear",
  wing: "Wing",
  slats: "Leading-edge slats",
  flaps: "Trailing-edge flaps",
  aileron: "Ailerons",
  spoilers: "Spoilers",
  hstab: "Horizontal stabiliser",
  elevator: "Elevators",
  vstab: "Vertical fin",
  rudder: "Rudder",
  fuel: "Fuel tanks",
  hydraulic: "Hydraulic bay",
  electrical: "Electrical power centre",
  avionics: "Avionics bay",
  cockpit: "Flight deck",
  radome: "Radome & weather radar",
  probes: "Air-data probes",
  lights: "Exterior lights",
  packs: "Air-conditioning packs",
  cabin: "Passenger cabin",
  galley: "Galleys & lavatories",
  doors: "Doors & exits",
  windows: "Cabin windows",
  fuselage: "Fuselage & structure",
};

export type System = {
  id: SystemId;
  name: string;
  ata: string;
  tagline: string;
  description: string;
  anchors: Anchor[];
};

export type Part = {
  id: string;
  name: string;
  ata: string;
  system: SystemId;
  description: string;
  category: PartCategory;
  location: string;
  anchor: Anchor;
  image: string;
  compatible: string[];
  partNumber: string;
};

export const COMPATIBLE_PLACEHOLDER = ["Narrow-body twin (fleet type TBC)"];
export const PART_NUMBER_NOTE = "To be confirmed by supplier";

export const CATEGORY_INFO: Record<PartCategory, string> = {
  Rotable:
    "Serialised component that is overhauled and returned to stock. Usually supplied on exchange with a certificate (EASA Form 1 / FAA 8130-3).",
  Repairable:
    "Component that can be repaired a limited number of times before it is scrapped.",
  Expendable: "Low-cost hardware replaced rather than repaired.",
  Consumable: "Used up in service: fluids, filters, seals, lamps and similar.",
};

export const SYSTEMS: System[] = [
  {
    id: "engines",
    name: "Engines & Nacelles",
    ata: "ATA 71–80",
    tagline: "Thrust, start, oil and exhaust.",
    description:
      "High-bypass turbofans in under-wing nacelles: fan, core, gearbox accessories, ignition, start and oil systems.",
    anchors: ["engine", "pylon"],
  },
  {
    id: "apu",
    name: "Auxiliary Power Unit",
    ata: "ATA 49",
    tagline: "Power on the ground.",
    description:
      "Small gas turbine in the tail cone supplying electrical power and bleed air for engine start and air conditioning.",
    anchors: ["apu"],
  },
  {
    id: "landing-gear",
    name: "Landing Gear, Wheels & Brakes",
    ata: "ATA 32",
    tagline: "Every landing ends here.",
    description:
      "Nose and main gear legs, retraction, steering, wheels, tyres and carbon brakes with anti-skid.",
    anchors: ["nose-gear", "main-gear"],
  },
  {
    id: "flight-controls",
    name: "Flight Controls",
    ata: "ATA 27",
    tagline: "Pitch, roll, yaw and lift.",
    description:
      "Primary and secondary control surfaces with their actuators, sensors and computers.",
    anchors: ["aileron", "elevator", "rudder", "flaps", "slats", "spoilers"],
  },
  {
    id: "hydraulics",
    name: "Hydraulic Power",
    ata: "ATA 29",
    tagline: "The muscle behind the surfaces.",
    description:
      "Engine- and electrically-driven pumps, reservoirs, accumulators and filtration for three independent systems.",
    anchors: ["hydraulic"],
  },
  {
    id: "fuel",
    name: "Fuel System",
    ata: "ATA 28",
    tagline: "Stored, measured, delivered.",
    description:
      "Wing and centre tanks, boost pumps, valves, quantity probes and the refuel panel.",
    anchors: ["fuel"],
  },
  {
    id: "electrical",
    name: "Electrical Power",
    ata: "ATA 24",
    tagline: "AC, DC and backup.",
    description:
      "Generators, transformer-rectifiers, batteries, contactors and distribution panels.",
    anchors: ["electrical"],
  },
  {
    id: "avionics",
    name: "Avionics & Navigation",
    ata: "ATA 22 / 23 / 31 / 34",
    tagline: "Sense, compute, communicate.",
    description:
      "Displays, flight computers, radios, navigation sensors and the probes that feed them.",
    anchors: ["avionics", "cockpit", "radome", "probes"],
  },
  {
    id: "lighting",
    name: "Lighting",
    ata: "ATA 33",
    tagline: "Seen and seeing.",
    description:
      "Exterior navigation, strobe, beacon, landing and taxi lights, plus cabin and emergency lighting.",
    anchors: ["lights"],
  },
  {
    id: "air-conditioning",
    name: "Air Conditioning & Pneumatics",
    ata: "ATA 21 / 36",
    tagline: "Air you can breathe at 37,000 ft.",
    description:
      "Air-conditioning packs, pressurisation control, bleed air valves and cabin air recirculation.",
    anchors: ["packs"],
  },
  {
    id: "cabin",
    name: "Cabin & Interior",
    ata: "ATA 25 / 35 / 38",
    tagline: "Where passengers notice everything.",
    description:
      "Seats, galleys, lavatories, oxygen, water and waste systems, and cabin furnishings.",
    anchors: ["cabin", "galley"],
  },
  {
    id: "doors-windows",
    name: "Doors & Windows",
    ata: "ATA 52 / 56",
    tagline: "Sealed, pressurised, certified.",
    description:
      "Passenger, service, cargo and emergency exits, cockpit windshields and cabin windows.",
    anchors: ["doors", "windows"],
  },
  {
    id: "protection",
    name: "Fire, Ice & Rain Protection",
    ata: "ATA 26 / 30",
    tagline: "Detect, suppress, keep clear.",
    description:
      "Fire detection and extinguishing, wing and engine anti-ice, probe heating and windshield rain removal.",
    anchors: ["probes", "engine", "wing"],
  },
  {
    id: "consumables",
    name: "Filters & Consumables",
    ata: "Various",
    tagline: "Small parts, every check.",
    description:
      "Filters, seals, fluids, lamps and hardware replaced at routine maintenance checks.",
    anchors: ["fuselage"],
  },
];

type Seed = [
  name: string,
  ata: string,
  category: PartCategory,
  anchor: Anchor,
  location: string,
  description: string,
];

const SEEDS: Record<SystemId, Seed[]> = {
  engines: [
    ["Fan Blade Set", "72", "Rotable", "engine", "Engine inlet, fan stage", "Wide-chord titanium or composite fan blades producing most of the engine's thrust. Inspected for erosion and impact damage."],
    ["Spinner Cone", "72", "Repairable", "engine", "Engine inlet, fan hub", "Aerodynamic nose cone over the fan hub that guides airflow and sheds ice."],
    ["Engine Inlet Cowl", "71", "Repairable", "engine", "Nacelle, forward", "Leading section of the nacelle that delivers smooth airflow to the fan, with anti-ice ducting."],
    ["Fan Cowl Door", "71", "Repairable", "engine", "Nacelle, sides", "Hinged cowl panels giving access to the fan case and accessory gearbox."],
    ["Thrust Reverser Actuator", "78", "Rotable", "engine", "Thrust reverser, aft nacelle", "Hydraulic or electric actuator that deploys the reverser sleeve to slow the aircraft after touchdown."],
    ["Fuel Metering Unit", "73", "Rotable", "engine", "Accessory gearbox", "Meters fuel flow to the combustor on command of the engine control computer."],
    ["Engine Control Unit (FADEC)", "73", "Rotable", "engine", "Fan case", "Dual-channel full-authority digital engine control that manages thrust, start and limits."],
    ["Ignition Exciter", "74", "Rotable", "engine", "Core case", "High-energy unit that powers the igniter plugs during start and in-flight relight."],
    ["Igniter Plug", "74", "Expendable", "engine", "Combustion chamber", "Spark plug that lights the fuel-air mixture in the combustor. Replaced at set intervals."],
    ["Pneumatic Starter", "80", "Rotable", "engine", "Accessory gearbox", "Air turbine starter that spins the engine core using APU or ground bleed air."],
    ["Starter Air Valve", "80", "Rotable", "engine", "Core cowl area", "Controls the flow of start air to the pneumatic starter."],
    ["Oil Pump Assembly", "79", "Rotable", "engine", "Accessory gearbox", "Pressure and scavenge pump unit that circulates oil through bearings and gearboxes."],
    ["Oil Quantity Transmitter", "79", "Rotable", "engine", "Oil tank", "Sensor that reports engine oil level to the cockpit displays."],
    ["Exhaust Nozzle & Plug", "78", "Repairable", "engine", "Engine exhaust", "Shapes the core exhaust stream for efficient thrust and lower noise."],
    ["Engine Pylon Fairing", "54", "Repairable", "pylon", "Wing-to-engine pylon", "Aerodynamic fairing over the strut that attaches the engine to the wing."],
  ],
  apu: [
    ["APU Power Section", "49", "Rotable", "apu", "Tail cone", "Gas-turbine core of the APU that drives the generator and supplies bleed air."],
    ["APU Starter Motor", "49", "Rotable", "apu", "Tail cone, APU gearbox", "DC electric motor that spins the APU up to self-sustaining speed."],
    ["APU Generator", "24", "Rotable", "apu", "Tail cone, APU gearbox", "AC generator providing aircraft electrical power on the ground and as a backup in flight."],
    ["APU Electronic Control Box", "49", "Rotable", "apu", "Aft cargo / tail area", "Controls APU start, speed, temperature and protective shutdowns."],
    ["APU Air Inlet Door Actuator", "49", "Rotable", "apu", "Tail cone, inlet", "Opens and closes the APU air inlet flap."],
    ["APU Fuel Control Unit", "49", "Rotable", "apu", "APU accessory section", "Schedules fuel flow to the APU combustor."],
    ["APU Exhaust Muffler", "49", "Repairable", "apu", "Tail cone, exhaust", "Ducts and silences APU exhaust gas out of the tail."],
  ],
  "landing-gear": [
    ["Main Landing Gear Shock Strut", "32", "Rotable", "main-gear", "Main gear bay", "Oleo-pneumatic leg that absorbs landing loads and supports the aircraft on the ground."],
    ["Nose Landing Gear Shock Strut", "32", "Rotable", "nose-gear", "Nose gear bay", "Oleo strut carrying the nose wheels, with integrated steering collar."],
    ["Main Wheel Assembly", "32", "Rotable", "main-gear", "Main gear axle", "Forged aluminium wheel with bearings and fusible plugs that release pressure if overheated."],
    ["Nose Wheel Assembly", "32", "Rotable", "nose-gear", "Nose gear axle", "Twin nose wheels supporting steering and nose loads."],
    ["Main Tyre", "32", "Consumable", "main-gear", "Main gear wheels", "Radial or bias aircraft tyre inflated with nitrogen. Replaced or retreaded on wear limits."],
    ["Nose Tyre", "32", "Consumable", "nose-gear", "Nose gear wheels", "Chined nose tyre that deflects runway water away from the engines."],
    ["Carbon Brake Assembly", "32", "Rotable", "main-gear", "Main gear wheels", "Multi-disc carbon heat-sink brake with wear indicator pins."],
    ["Anti-Skid Transducer", "32", "Rotable", "main-gear", "Main wheel axle", "Wheel-speed sensor that lets the anti-skid system prevent wheel lock-up."],
    ["Brake Control Valve", "32", "Rotable", "main-gear", "Main gear bay", "Meters hydraulic pressure to the brakes on pedal or autobrake command."],
    ["Retraction Actuator", "32", "Rotable", "main-gear", "Main gear bay", "Hydraulic actuator that raises and lowers the gear leg."],
    ["Nose Wheel Steering Actuator", "32", "Rotable", "nose-gear", "Nose gear leg", "Turns the nose wheels for ground steering via tiller and rudder pedals."],
    ["Gear Uplock Assembly", "32", "Rotable", "main-gear", "Main gear bay", "Mechanical lock that holds the gear up in flight."],
    ["Torque Link Assembly", "32", "Repairable", "nose-gear", "Gear leg", "Scissor links that stop the inner cylinder rotating and transmit steering."],
  ],
  "flight-controls": [
    ["Aileron Servo Actuator", "27", "Rotable", "aileron", "Outboard wing, trailing edge", "Hydraulic actuator that moves the aileron for roll control."],
    ["Elevator Servo Actuator", "27", "Rotable", "elevator", "Horizontal stabiliser", "Drives the elevator for pitch control."],
    ["Rudder Power Control Unit", "27", "Rotable", "rudder", "Vertical fin", "Hydraulic unit that drives the rudder for yaw control."],
    ["Trimmable Horizontal Stabiliser Actuator", "27", "Rotable", "hstab", "Tail cone, stabiliser hinge", "Screw-jack that trims the entire horizontal stabiliser."],
    ["Flap Actuator", "27", "Rotable", "flaps", "Wing trailing edge", "Ball-screw actuator that extends the trailing-edge flaps."],
    ["Slat Actuator", "27", "Rotable", "slats", "Wing leading edge", "Rotary actuator driving the leading-edge slats."],
    ["Spoiler Actuator", "27", "Rotable", "spoilers", "Upper wing surface", "Raises the spoiler panels for roll assist, speed brake and ground lift dump."],
    ["Flap Track Fairing", "57", "Repairable", "flaps", "Under wing", "Streamlined fairing over the flap support track ('canoe')."],
    ["Flight Control Computer", "27", "Rotable", "avionics", "Avionics bay", "Computes surface commands from pilot inputs and protections."],
    ["Control Surface Position Sensor", "27", "Rotable", "aileron", "At each control surface", "Reports actual surface position back to the flight control computers."],
    ["Static Discharger (Wick)", "23", "Expendable", "aileron", "Trailing edges and tips", "Bleeds static charge into the air to reduce radio interference."],
  ],
  hydraulics: [
    ["Engine-Driven Hydraulic Pump", "29", "Rotable", "hydraulic", "Engine accessory gearbox", "Variable-displacement pump supplying main system pressure."],
    ["Electric Motor-Driven Pump", "29", "Rotable", "hydraulic", "Main gear bay", "Electric pump for backup pressure and ground operation."],
    ["Power Transfer Unit", "29", "Rotable", "hydraulic", "Main gear bay", "Transfers hydraulic power between systems without mixing fluid."],
    ["Hydraulic Reservoir", "29", "Repairable", "hydraulic", "Main gear bay", "Pressurised tank storing fluid for each hydraulic system."],
    ["Hydraulic Accumulator", "29", "Rotable", "hydraulic", "Main gear bay", "Nitrogen-charged unit that dampens pressure surges and stores reserve energy."],
    ["Ram Air Turbine (RAT)", "29", "Rotable", "hydraulic", "Wing-to-body fairing", "Emergency wind-driven turbine that supplies hydraulic and electrical power."],
    ["Hydraulic Pressure Transmitter", "29", "Rotable", "hydraulic", "Hydraulic manifolds", "Sends system pressure readings to the cockpit."],
    ["Priority Valve", "29", "Rotable", "hydraulic", "Hydraulic manifolds", "Keeps pressure to flight controls when demand is high."],
  ],
  fuel: [
    ["Fuel Boost Pump", "28", "Rotable", "fuel", "Wing tanks", "Submerged electric pump supplying pressurised fuel to the engines."],
    ["Fuel Quantity Probe", "28", "Rotable", "fuel", "Inside fuel tanks", "Capacitance probe that measures fuel height for the gauging system."],
    ["Fuel Shut-Off Valve (LP Valve)", "28", "Rotable", "fuel", "Wing, engine feed line", "Motorised valve isolating fuel to the engine in an emergency."],
    ["Crossfeed Valve", "28", "Rotable", "fuel", "Centre wing box", "Lets either tank feed either engine to balance fuel."],
    ["Refuel Control Panel", "28", "Rotable", "fuel", "Under right wing", "Panel for pressure refuelling and setting fuel loads."],
    ["Refuel Coupling", "28", "Repairable", "fuel", "Under right wing", "Standard pressure refuel nozzle adaptor."],
    ["Fuel Quantity Indicating Computer", "28", "Rotable", "avionics", "Avionics bay", "Processes probe signals into fuel quantity per tank."],
    ["Water Drain Valve", "28", "Expendable", "fuel", "Tank low points", "Sump drain for removing water from fuel tanks."],
  ],
  electrical: [
    ["Integrated Drive Generator", "24", "Rotable", "engine", "Engine accessory gearbox", "Constant-frequency AC generator driven by each engine."],
    ["Generator Control Unit", "24", "Rotable", "electrical", "Avionics bay", "Regulates generator voltage and protects the electrical network."],
    ["Transformer Rectifier Unit", "24", "Rotable", "electrical", "Avionics bay", "Converts AC power to 28 V DC for aircraft systems."],
    ["Main Aircraft Battery", "24", "Rotable", "electrical", "Avionics bay", "Nickel-cadmium or lithium battery for APU start and emergency DC power."],
    ["Static Inverter", "24", "Rotable", "electrical", "Avionics bay", "Converts battery DC into AC for essential instruments."],
    ["Power Contactor", "24", "Rotable", "electrical", "Electrical power centre", "Heavy-duty relay switching generator and bus connections."],
    ["Circuit Breaker Panel", "24", "Repairable", "electrical", "Cockpit overhead / aft", "Protective breakers for each aircraft circuit."],
    ["Ground Power Receptacle", "24", "Repairable", "electrical", "Nose, lower right", "External socket for 115 V AC ground power."],
  ],
  avionics: [
    ["Primary Flight Display", "31", "Rotable", "cockpit", "Flight deck panel", "LCD display showing attitude, speed, altitude and heading."],
    ["Multi-Function Display", "31", "Rotable", "cockpit", "Flight deck panel", "Shows navigation, engine and system pages."],
    ["Flight Management Computer", "34", "Rotable", "avionics", "Avionics bay", "Plans and flies the route, performance and fuel predictions."],
    ["Air Data Inertial Reference Unit", "34", "Rotable", "avionics", "Avionics bay", "Combines air data and laser-gyro inertial reference for attitude and position."],
    ["Weather Radar Antenna", "34", "Rotable", "radome", "Nose radome", "Scans ahead for precipitation and windshear."],
    ["Weather Radar Transceiver", "34", "Rotable", "avionics", "Avionics bay", "Transmitter/receiver for the weather radar system."],
    ["VHF Communication Transceiver", "23", "Rotable", "avionics", "Avionics bay", "Voice and datalink radio for air traffic control."],
    ["Pitot Probe", "34", "Rotable", "probes", "Forward fuselage", "Heated probe that measures total pressure for airspeed."],
    ["Angle-of-Attack Sensor", "34", "Rotable", "probes", "Forward fuselage", "Vane sensor measuring the wing's angle to the airflow."],
    ["Transponder", "34", "Rotable", "avionics", "Avionics bay", "Replies to ATC and collision-avoidance interrogations."],
    ["Radio Altimeter Antenna", "34", "Expendable", "fuselage", "Lower fuselage", "Measures height above ground on approach."],
    ["Cockpit Voice Recorder", "23", "Rotable", "fuselage", "Aft fuselage", "Crash-protected recorder of flight-deck audio."],
    ["Flight Data Recorder", "31", "Rotable", "fuselage", "Aft fuselage", "Crash-protected recorder of flight parameters."],
    ["Static Port", "34", "Expendable", "probes", "Forward fuselage sides", "Flush ports sensing static pressure for altitude and speed."],
  ],
  lighting: [
    ["Landing Light", "33", "Repairable", "lights", "Wing root / leading edge", "High-intensity light for approach and landing."],
    ["Taxi & Turnoff Light", "33", "Repairable", "nose-gear", "Nose gear leg", "Lights the taxiway ahead and to the sides."],
    ["Navigation Light (Red/Green)", "33", "Repairable", "lights", "Wing tips", "Position lights: red on the left, green on the right."],
    ["Anti-Collision Strobe", "33", "Repairable", "lights", "Wing tips and tail", "White high-intensity strobes for visibility."],
    ["Beacon Light", "33", "Repairable", "lights", "Upper and lower fuselage", "Red rotating or flashing light showing engines are running."],
    ["Logo Light", "33", "Repairable", "lights", "Horizontal stabiliser", "Illuminates the tail fin at night."],
    ["Cabin LED Light Strip", "33", "Repairable", "cabin", "Cabin ceiling / sidewall", "Mood lighting strips along the cabin."],
    ["Emergency Exit Sign", "33", "Repairable", "cabin", "Above each exit", "Self-powered illuminated EXIT sign."],
    ["Floor Path Marking", "33", "Expendable", "cabin", "Cabin aisle floor", "Photoluminescent strip guiding passengers to exits."],
  ],
  "air-conditioning": [
    ["Air Cycle Machine", "21", "Rotable", "packs", "Belly, under centre wing", "Turbine/compressor unit at the heart of each air-conditioning pack."],
    ["Pack Heat Exchanger", "21", "Repairable", "packs", "Belly, under centre wing", "Cools hot bleed air using ram air."],
    ["Pack Flow Control Valve", "21", "Rotable", "packs", "Pack bay", "Regulates bleed air flow into each pack."],
    ["Cabin Pressure Controller", "21", "Rotable", "avionics", "Avionics bay", "Schedules cabin altitude and rate of change."],
    ["Outflow Valve", "21", "Rotable", "fuselage", "Aft lower fuselage", "Modulates air leaving the cabin to set pressurisation."],
    ["Recirculation Fan", "21", "Rotable", "cabin", "Mixer unit area", "Recirculates filtered cabin air to reduce bleed demand."],
    ["Trim Air Valve", "21", "Rotable", "packs", "Mixer unit", "Adds hot air to fine-tune zone temperatures."],
    ["Bleed Air Valve", "36", "Rotable", "pylon", "Engine pylon", "Controls hot bleed air taken from the engine compressor."],
    ["Pre-Cooler", "36", "Repairable", "pylon", "Engine pylon", "Heat exchanger cooling bleed air with fan air."],
  ],
  cabin: [
    ["Passenger Seat Assembly (Economy)", "25", "Repairable", "cabin", "Main cabin", "Triple seat with tray tables, life vest pouch and recline mechanism."],
    ["Seat Recline Actuator", "25", "Expendable", "cabin", "Under seat", "Hydraulic lock that holds the seatback position."],
    ["Seat Belt Assembly", "25", "Expendable", "cabin", "Each seat", "Certified lap belt with metal buckle."],
    ["Overhead Stowage Bin", "25", "Repairable", "cabin", "Cabin ceiling", "Overhead bin with latch and damper."],
    ["Galley Coffee Maker", "25", "Repairable", "galley", "Forward / aft galley", "Plumbed beverage maker, galley insert."],
    ["Galley Oven", "25", "Repairable", "galley", "Forward / aft galley", "Steam or convection oven for meal service."],
    ["Lavatory Vacuum Toilet", "38", "Repairable", "galley", "Lavatory", "Vacuum-flush toilet unit."],
    ["Potable Water Pump", "38", "Rotable", "cabin", "Water service bay", "Pressurises potable water to galleys and lavatories."],
    ["Passenger Oxygen Mask Unit", "35", "Expendable", "cabin", "Above each seat row", "Drop-down masks fed by chemical oxygen generators."],
    ["Crew Oxygen Cylinder", "35", "Repairable", "cockpit", "Forward cargo / avionics bay", "High-pressure oxygen for the flight crew."],
    ["Life Vest", "25", "Consumable", "cabin", "Under each seat", "Inflatable life jacket with light and whistle."],
  ],
  "doors-windows": [
    ["Passenger Door Seal", "52", "Consumable", "doors", "Main entry doors", "Inflatable / lip seal keeping the door pressure-tight."],
    ["Emergency Escape Slide", "25", "Rotable", "doors", "Inside each main door", "Inflatable evacuation slide packed into the door."],
    ["Door Damper Actuator", "52", "Rotable", "doors", "Main entry doors", "Controls door opening speed and powers emergency opening."],
    ["Cargo Door Actuator", "52", "Rotable", "doors", "Forward / aft cargo doors", "Opens and closes the lower cargo doors."],
    ["Overwing Exit Hatch Seal", "52", "Consumable", "doors", "Overwing exits", "Seal for the self-help overwing emergency exits."],
    ["Cockpit Windshield", "56", "Repairable", "cockpit", "Flight deck", "Heated, multi-layer laminated glass windshield."],
    ["Cabin Window Pane", "56", "Repairable", "windows", "Cabin sidewall", "Outer and inner acrylic panes with breather hole."],
    ["Window Shade Assembly", "25", "Expendable", "windows", "Cabin sidewall", "Manual pull-down window blind."],
  ],
  protection: [
    ["Engine Fire Detector Loop", "26", "Rotable", "engine", "Engine nacelle", "Continuous sensing element that detects fire and overheat."],
    ["Fire Extinguisher Bottle", "26", "Rotable", "pylon", "Engine pylon", "Halon / alternative agent bottle discharged into the engine."],
    ["Cargo Smoke Detector", "26", "Rotable", "fuselage", "Cargo compartment ceiling", "Photo-electric detector for cargo hold smoke."],
    ["Portable Fire Extinguisher", "26", "Repairable", "cabin", "Cabin and flight deck", "Hand-held extinguisher for cabin fires."],
    ["Lavatory Smoke Detector", "26", "Rotable", "galley", "Lavatory ceiling", "Detects smoke in lavatories."],
    ["Wing Anti-Ice Valve", "30", "Rotable", "wing", "Wing root", "Opens hot bleed air into the slat leading edges."],
    ["Probe Heat Controller", "30", "Rotable", "probes", "Avionics bay", "Powers and monitors heaters on pitot, AoA and temperature probes."],
    ["Windshield Wiper Motor", "30", "Rotable", "cockpit", "Below windshield", "Drives the windshield wiper arms."],
  ],
  consumables: [
    ["Engine Oil Filter", "79", "Consumable", "engine", "Engine oil system", "Removes debris from engine oil. Checked for metal particles."],
    ["Hydraulic Filter Element", "29", "Consumable", "hydraulic", "Hydraulic manifolds", "Pressure and return line filter elements."],
    ["Fuel Filter Element", "73", "Consumable", "engine", "Engine fuel system", "Protects the fuel metering unit from contamination."],
    ["Cabin HEPA Filter", "21", "Consumable", "packs", "Recirculation system", "Removes particles and microbes from recirculated air."],
    ["Engine Turbine Oil (Quart)", "12", "Consumable", "engine", "Engine oil tank", "Synthetic turbine oil for servicing."],
    ["Phosphate-Ester Hydraulic Fluid", "12", "Consumable", "hydraulic", "Hydraulic reservoirs", "Fire-resistant fluid used in airliner hydraulic systems."],
    ["O-Ring Seal Kit", "20", "Consumable", "fuselage", "Various", "Assorted aviation-grade elastomer seals."],
    ["Safety Wire & Cotter Pin Kit", "20", "Consumable", "fuselage", "Various", "Locking hardware for fasteners."],
    ["Navigation Lamp Replacement", "33", "Consumable", "lights", "Wing tips", "Replacement LED module / lamp for position lights."],
    ["Wheel Bearing Grease", "12", "Consumable", "main-gear", "Wheel bearings", "High-temperature grease for wheel bearings."],
    ["Water Filter Cartridge", "38", "Consumable", "galley", "Galley water line", "Point-of-use potable water filter."],
    ["Windshield Wiper Blade", "30", "Consumable", "cockpit", "Flight deck windshield", "Replaceable rubber wiper blade and arm insert."],
    ["Tyre Valve Core Kit", "32", "Consumable", "main-gear", "Wheel inflation valves", "Valve cores and caps for nitrogen tyre servicing."],
    ["Polysulfide Sealant Cartridge", "51", "Consumable", "fuselage", "Structure and fuel tanks", "Two-part sealant for fuel tanks, fasteners and fairings."],
    ["Hi-Lok Fastener Kit", "51", "Expendable", "fuselage", "Airframe structure", "Titanium pins and collars for structural repairs."],
  ],
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ataCounters = new Map<string, number>();

export const PARTS: Part[] = SYSTEMS.flatMap((sys) =>
  SEEDS[sys.id].map(([name, ata, category, anchor, location, description]) => {
    const id = slug(name);
    const n = (ataCounters.get(ata) ?? 0) + 1;
    ataCounters.set(ata, n);
    return {
      id,
      name,
      ata: `ATA ${ata}`,
      system: sys.id,
      description,
      category,
      location,
      anchor,
      image: `/parts/${id}.webp`,
      compatible: COMPATIBLE_PLACEHOLDER,
      partNumber: `DEMO-${ata.padStart(2, "0")}-${String(n).padStart(3, "0")}`,
    };
  }),
);

export const partById = (id: string) => PARTS.find((p) => p.id === id);
export const systemById = (id: SystemId) => SYSTEMS.find((s) => s.id === id)!;
export const partsBySystem = (id: SystemId) => PARTS.filter((p) => p.system === id);

export const ATA_CHAPTERS = new Set(PARTS.map((p) => p.ata)).size;
export const partsByAnchor = (a: Anchor) => PARTS.filter((p) => p.anchor === a);
