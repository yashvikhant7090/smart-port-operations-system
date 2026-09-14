import { pgTable, serial, text, varchar, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("Operator"), // Admin, Port Supervisor, Operator
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const ports = pgTable("ports", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  total_berths: integer("total_berths").notNull().default(10),
  total_cranes: integer("total_cranes").notNull().default(16),
  yard_capacity_teu: integer("yard_capacity_teu").notNull().default(120000),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const berths = pgTable("berths", {
  id: serial("id").primaryKey(),
  port_id: integer("port_id").notNull(),
  berth_code: varchar("berth_code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  capacity: integer("capacity").notNull(), // Max TEU capacity or vessel length
  max_draft: numeric("max_draft", { precision: 4, scale: 1 }).notNull().default("16.0"),
  current_utilisation: integer("current_utilisation").notNull().default(0), // 0 - 100%
  status: varchar("status", { length: 50 }).notNull().default("Available"), // Available, Occupied, Maintenance, High Congestion
  current_vessel_id: integer("current_vessel_id"),
  available_cranes: integer("available_cranes").notNull().default(2),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const vessels = pgTable("vessels", {
  id: serial("id").primaryKey(),
  port_id: integer("port_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  imo_number: varchar("50").notNull().unique(),
  eta: timestamp("eta").notNull(),
  etd: timestamp("etd").notNull(),
  container_volume: integer("container_volume").notNull(), // TEU
  vessel_size: varchar("vessel_size", { length: 50 }).notNull(), // Feeder, Panamax, Post-Panamax, Ultra Large
  priority: varchar("priority", { length: 50 }).notNull().default("Medium"), // Low, Medium, High, Critical
  status: varchar("status", { length: 50 }).notNull().default("Scheduled"), // Scheduled, Arrived, Waiting, Loading, Unloading, Completed, Delayed
  assigned_berth_id: integer("assigned_berth_id"),
  destination: varchar("destination", { length: 255 }).notNull(),
  origin: varchar("origin", { length: 255 }).notNull().default("Shanghai Port"),
  draft: numeric("draft", { precision: 4, scale: 1 }).notNull().default("14.5"),
  waiting_time_hours: numeric("waiting_time_hours", { precision: 5, scale: 1 }).notNull().default("0.0"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const cranes = pgTable("cranes", {
  id: serial("id").primaryKey(),
  port_id: integer("port_id").notNull(),
  crane_code: varchar("crane_code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 100 }).notNull(), // STS Super Post-Panamax, STS Post-Panamax, Mobile Harbour Crane, RTG
  capacity: integer("capacity").notNull().default(40), // moves per hour
  status: varchar("status", { length: 50 }).notNull().default("Available"), // Available, Working, Maintenance, Offline
  maintenance_status: varchar("maintenance_status", { length: 50 }).notNull().default("Operational"), // Operational, Scheduled Inspection, Overhaul Needed, In Repair
  current_vessel_id: integer("current_vessel_id"),
  assigned_berth_id: integer("assigned_berth_id"),
  utilisation: integer("utilisation").notNull().default(0), // 0 - 100%
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const yards = pgTable("yards", {
  id: serial("id").primaryKey(),
  port_id: integer("port_id").notNull(),
  yard_code: varchar("yard_code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  capacity: integer("capacity").notNull(), // TEU capacity
  current_occupancy: integer("current_occupancy").notNull(), // TEU occupied
  status: varchar("status", { length: 50 }).notNull().default("Normal"), // Normal, Near Capacity, Critical, Maintenance
  zone_type: varchar("zone_type", { length: 50 }).notNull().default("Import Staging"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const vesselSchedules = pgTable("vessel_schedules", {
  id: serial("id").primaryKey(),
  vessel_id: integer("vessel_id").notNull(),
  berth_id: integer("berth_id"),
  scheduled_arrival: timestamp("scheduled_arrival").notNull(),
  scheduled_departure: timestamp("scheduled_departure").notNull(),
  actual_arrival: timestamp("actual_arrival"),
  actual_departure: timestamp("actual_departure"),
  status: varchar("status", { length: 50 }).notNull().default("On-Time"),
  delay_hours: numeric("delay_hours", { precision: 5, scale: 1 }).default("0.0"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const containerMovements = pgTable("container_movements", {
  id: serial("id").primaryKey(),
  vessel_id: integer("vessel_id"),
  berth_id: integer("berth_id"),
  crane_id: integer("crane_id"),
  yard_id: integer("yard_id"),
  movement_type: varchar("movement_type", { length: 50 }).notNull(), // Discharge, Loading, Gate-In, Gate-Out, Yard Transfer
  teu_count: integer("teu_count").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const congestionPredictions = pgTable("congestion_predictions", {
  id: serial("id").primaryKey(),
  port_id: integer("port_id").notNull(),
  prediction_time: timestamp("prediction_time").defaultNow().notNull(),
  forecast_period: varchar("forecast_period", { length: 50 }).notNull().default("24h"), // 24h, 48h, 72h
  congestion_score: integer("congestion_score").notNull(), // 0 - 100
  risk_level: varchar("risk_level", { length: 50 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  affected_berth: varchar("affected_berth", { length: 255 }).notNull(),
  expected_waiting_time: numeric("expected_waiting_time", { precision: 5, scale: 1 }).notNull(),
  reason: text("reason").notNull(),
  details_json: text("details_json").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const routingRecommendations = pgTable("routing_recommendations", {
  id: serial("id").primaryKey(),
  vessel_id: integer("vessel_id").notNull(),
  port_id: integer("port_id").notNull(),
  current_berth_id: integer("current_berth_id"),
  recommended_berth_id: integer("recommended_berth_id").notNull(),
  current_expected_wait: numeric("current_expected_wait", { precision: 5, scale: 1 }).notNull(),
  wait_after_rerouting: numeric("wait_after_rerouting", { precision: 5, scale: 1 }).notNull(),
  congestion_reduction_pct: numeric("congestion_reduction_pct", { precision: 5, scale: 1 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"), // Pending, Applied, Rejected
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const berthAssignments = pgTable("berth_assignments", {
  id: serial("id").primaryKey(),
  vessel_id: integer("vessel_id").notNull(),
  berth_id: integer("berth_id").notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Planned"), // Planned, Active, Completed, Cancelled
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const craneAssignments = pgTable("crane_assignments", {
  id: serial("id").primaryKey(),
  crane_id: integer("crane_id").notNull(),
  vessel_id: integer("vessel_id").notNull(),
  berth_id: integer("berth_id").notNull(),
  shift: varchar("shift", { length: 50 }).notNull().default("Day Shift"),
  assigned_from: timestamp("assigned_from").notNull(),
  assigned_to: timestamp("assigned_to").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Assigned"), // Assigned, Active, Released
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const operationPlans = pgTable("operation_plans", {
  id: serial("id").primaryKey(),
  port_id: integer("port_id").notNull(),
  plan_title: varchar("plan_title", { length: 255 }).notNull(),
  day_label: varchar("day_label", { length: 50 }).notNull(), // TODAY, TOMORROW, DAY 3
  time_slot: varchar("time_slot", { length: 50 }).notNull(), // 08:00, 10:00, 12:00, etc.
  event_type: varchar("event_type", { length: 50 }).notNull(), // Berth Allocation, Crane Allocation, Vessel Rerouting, Yard Redistribution, Maintenance
  vessel_name: varchar("vessel_name", { length: 255 }),
  berth_code: varchar("berth_code", { length: 50 }),
  details: text("details").notNull(),
  priority: varchar("priority", { length: 50 }).notNull().default("Normal"), // Normal, High, Critical
  status: varchar("status", { length: 50 }).notNull().default("Approved"), // Draft, Approved, In Progress, Completed
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  port_id: integer("port_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  severity: varchar("severity", { length: 50 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  category: varchar("category", { length: 100 }).notNull(), // HIGH CONGESTION WARNING, VESSEL DELAY, BERTH OVERLOAD, CRANE SHORTAGE, YARD CAPACITY WARNING, ALTERNATE ROUTE RECOMMENDED, MAINTENANCE WARNING
  is_read: boolean("is_read").notNull().default(false),
  related_vessel_id: integer("related_vessel_id"),
  related_berth_id: integer("related_berth_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
