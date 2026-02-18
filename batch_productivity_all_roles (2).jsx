import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

/*
  TIMING DATA BY ROLE (from image):
  Fridge Filler:            avg 34s/order   → Batch 30: 17min | Batch 15: 8.5min | Batch 5: 3min
  Pharmacist Verification:  avg 7.5s/order  → Batch 30: 4min  | Batch 15: 2min   | Batch 5: 1min
  Shippers:                 avg 12.5s/order → Batch 30: 6min  | Batch 15: 3min   | Batch 5: 1min
  Tech Verification:        avg 9s/cooler   → Batch 30: 5min  | Batch 15: 2min   | Batch 5: 1min
*/

const ROLE_CONFIGS = {
  fridge: {
    name: "Fridge Filler",
    icon: "❄️",
    color: "#e05c5c",
    timePerOrder: 34,
    cycles: { 30: 17, 15: 9, 5: 3 },
    depths: { 30: 35, 15: 20, 5: 8 },
  },
  pharma: {
    name: "Pharmacist Verification",
    icon: "💊",
    color: "#e09a3a",
    timePerOrder: 7.5,
    cycles: { 30: 4, 15: 2, 5: 1 },
    depths: { 30: 30, 15: 15, 5: 6 },
  },
  shippers: {
    name: "Shippers",
    icon: "📦",
    color: "#5b9bd5",
    timePerOrder: 12.5,
    cycles: { 30: 6, 15: 3, 5: 1 },
    depths: { 30: 32, 15: 18, 5: 7 },
  },
  tech: {
    name: "Tech Verification",
    icon: "✅",
    color: "#4caf82",
    timePerOrder: 9,
    cycles: { 30: 5, 15: 2, 5: 1 },
    depths: { 30: 31, 15: 16, 5: 6 },
  },
};

function generateData(role, batchSize, variancePct, points = 480) {
  const data = [];
  const baseline = 100;
  const breakTimes = [120, 240, 360];
  const cycle = ROLE_CONFIGS[role].cycles[batchSize];
  const depth = ROLE_CONFIGS[role].depths[batchSize];

  // Variance scales with percentage: probability and depth both increase
  const varianceProb = variancePct / 100;
  const varianceDepthMultiplier = variancePct / 10; // At 10%, multiplier is 1.0

  for (let i = 0; i < points; i++) {
    let productivity = baseline;
    const nearBreak = breakTimes.some((b) => Math.abs(i - b) <= 4);
    if (nearBreak) productivity -= 40;
    productivity -= (i / points) * 8;
    
    // Apply variance based on probability
    const varianceHit = Math.random() < varianceProb;
    if (i % cycle === 0 && !nearBreak && varianceHit) {
      productivity -= depth * (varianceDepthMultiplier / 1.0);
    }
    
    productivity += (Math.random() - 0.5) * 5;
    productivity = Math.max(0, Math.min(100, productivity));
    data.push({ minute: i, productivity: parseFloat(productivity.toFixed(1)) });
  }
  return data;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const hr = Math.floor(label / 60);
    const min = label % 60;
    return (
      <div style={{
        background: "#1a1a2e", border: "1px solid #333",
        borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#fff"
      }}>
        <p style={{ margin: 0, color: "#aaa" }}>
          {hr}h {min > 0 ? `${min}m` : ""} into shift
        </p>
        <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
          Productivity: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [selectedRole, setSelectedRole] = useState("fridge");
  const [selectedBatch, setSelectedBatch] = useState(30);
  const [variancePct, setVariancePct] = useState(8);

  const roleConfig = ROLE_CONFIGS[selectedRole];
  const data = generateData(selectedRole, selectedBatch, variancePct);

  const batchSizes = [30, 15, 5];
  const allData = {
    30: generateData(selectedRole, 30, variancePct),
    15: generateData(selectedRole, 15, variancePct),
    5: generateData(selectedRole, 5, variancePct),
  };

  const totesPerShift = {
    30: Math.floor(420 / roleConfig.cycles[30]),
    15: Math.floor(420 / roleConfig.cycles[15]),
    5: Math.floor(420 / roleConfig.cycles[5]),
  };

  return (
    <div style={{
      background: "#0f0f1a", minHeight: "100vh",
      padding: "36px 24px", fontFamily: "'Georgia', serif", color: "#f0f0f0"
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px", color: "#fff" }}>
          Batch Productivity by Role — 8-Hour Shift
        </h1>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "24px" }}>
          Each role has different processing speeds. Select a role, batch size, and variance level to see how they interact.
        </p>

        {/* Role Selector */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px", fontWeight: 700, letterSpacing: "1px" }}>
            SELECT ROLE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {Object.entries(ROLE_CONFIGS).map(([key, role]) => (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                style={{
                  background: selectedRole === key ? role.color + "22" : "#13132a",
                  border: `2px solid ${selectedRole === key ? role.color : "#222"}`,
                  borderRadius: "10px", padding: "16px 12px",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s", textAlign: "center"
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{role.icon}</div>
                <div style={{
                  fontSize: "12px",
                  fontWeight: selectedRole === key ? 700 : 400,
                  color: selectedRole === key ? role.color : "#888"
                }}>
                  {role.name}
                </div>
                <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>
                  {role.timePerOrder}s per order
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Batch Size Selector */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px", fontWeight: 700, letterSpacing: "1px" }}>
            SELECT BATCH SIZE
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {batchSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedBatch(size)}
                style={{
                  background: selectedBatch === size ? roleConfig.color : "transparent",
                  color: selectedBatch === size ? "#fff" : "#aaa",
                  border: `1px solid ${selectedBatch === size ? roleConfig.color : "#333"}`,
                  borderRadius: "6px", padding: "10px 24px", fontSize: "14px",
                  cursor: "pointer", fontFamily: "inherit",
                  fontWeight: selectedBatch === size ? 700 : 400,
                  transition: "all 0.2s"
                }}
              >
                Batch {size}
              </button>
            ))}
          </div>
        </div>

        {/* Variance Control */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px", fontWeight: 700, letterSpacing: "1px" }}>
            VARIANCE LEVEL
          </div>
          <div style={{
            background: "#13132a",
            border: "1px solid #333",
            borderRadius: "10px",
            padding: "16px 20px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", color: "#aaa" }}>
                Adjust variance event probability and depth
              </div>
              <div style={{
                background: roleConfig.color + "22",
                border: `1px solid ${roleConfig.color}`,
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "20px",
                fontWeight: 700,
                color: roleConfig.color
              }}>
                {variancePct}%
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={variancePct}
              onChange={(e) => setVariancePct(Number(e.target.value))}
              style={{
                width: "100%",
                height: "6px",
                background: `linear-gradient(to right, ${roleConfig.color} 0%, ${roleConfig.color} ${(variancePct - 1) / 19 * 100}%, #333 ${(variancePct - 1) / 19 * 100}%, #333 100%)`,
                borderRadius: "3px",
                outline: "none",
                cursor: "pointer"
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: "#555" }}>
              <span>1% (Low)</span>
              <span>20% (High)</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          <div style={{
            background: "#13132a",
            border: `1px solid ${roleConfig.color}44`,
            borderRadius: "10px",
            padding: "16px"
          }}>
            <div style={{ fontSize: "11px", color: roleConfig.color, fontWeight: 700, marginBottom: "6px" }}>
              CYCLE TIME
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>
              {roleConfig.cycles[selectedBatch]} min
            </div>
            <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>
              per tote completion
            </div>
          </div>

          <div style={{
            background: "#13132a",
            border: `1px solid ${roleConfig.color}44`,
            borderRadius: "10px",
            padding: "16px"
          }}>
            <div style={{ fontSize: "11px", color: roleConfig.color, fontWeight: 700, marginBottom: "6px" }}>
              VARIANCE DIP
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>
              {Math.round(roleConfig.depths[selectedBatch] * (variancePct / 10))}%
            </div>
            <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>
              productivity drop depth
            </div>
          </div>

          <div style={{
            background: "#13132a",
            border: `1px solid ${roleConfig.color}44`,
            borderRadius: "10px",
            padding: "16px"
          }}>
            <div style={{ fontSize: "11px", color: roleConfig.color, fontWeight: 700, marginBottom: "6px" }}>
              TOTES/SHIFT
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>
              ~{totesPerShift[selectedBatch]}
            </div>
            <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>
              estimated completions
            </div>
          </div>

          <div style={{
            background: "#13132a",
            border: `1px solid ${roleConfig.color}44`,
            borderRadius: "10px",
            padding: "16px"
          }}>
            <div style={{ fontSize: "11px", color: roleConfig.color, fontWeight: 700, marginBottom: "6px" }}>
              VARIANCE %
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>
              {variancePct}%
            </div>
            <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>
              event probability
            </div>
          </div>
        </div>

        {/* Individual Chart */}
        <div style={{ background: "#13132a", borderRadius: "12px", padding: "24px 16px 16px", border: "1px solid #222", marginBottom: "32px" }}>
          <h3 style={{ fontSize: "15px", margin: "0 0 16px", color: "#ddd", fontWeight: 700 }}>
            {roleConfig.name} — Batch {selectedBatch}
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f3a" />
              <XAxis
                dataKey="minute"
                tick={{ fill: "#666", fontSize: 11 }}
                tickFormatter={(v) => `${Math.floor(v / 60)}h`}
                interval={59}
                label={{ value: "Time into Shift", position: "insideBottom", offset: -10, fill: "#555", fontSize: 11 }}
              />
              <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={120} stroke="#ffffff33" strokeDasharray="4 4" label={{ value: "Break", fill: "#555", fontSize: 9, position: "top" }} />
              <ReferenceLine x={240} stroke="#ffffff33" strokeDasharray="4 4" label={{ value: "Lunch", fill: "#555", fontSize: 9, position: "top" }} />
              <ReferenceLine x={360} stroke="#ffffff33" strokeDasharray="4 4" label={{ value: "Break", fill: "#555", fontSize: 9, position: "top" }} />
              <Line
                type="monotone"
                dataKey="productivity"
                stroke={roleConfig.color}
                strokeWidth={2.5}
                dot={false}
                animationDuration={400}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Chart */}
        <div>
          <h2 style={{ fontSize: "17px", marginBottom: "6px", color: "#ddd", fontWeight: 700 }}>
            All Batch Sizes — {roleConfig.name}
          </h2>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
            Smaller batches (green) recover faster from variance events across all roles.
          </p>
          <div style={{ background: "#13132a", borderRadius: "12px", padding: "24px 16px 16px", border: "1px solid #222" }}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f3a" />
                <XAxis
                  dataKey="minute"
                  type="number"
                  domain={[0, 479]}
                  allowDuplicatedCategory={false}
                  tickFormatter={(v) => `${Math.floor(v / 60)}h`}
                  interval={59}
                  tick={{ fill: "#666", fontSize: 11 }}
                  label={{ value: "Time into Shift", position: "insideBottom", offset: -10, fill: "#555", fontSize: 11 }}
                />
                <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "#aaa", fontSize: "12px", paddingTop: "10px" }} />
                <ReferenceLine x={120} stroke="#ffffff22" strokeDasharray="4 4" />
                <ReferenceLine x={240} stroke="#ffffff22" strokeDasharray="4 4" />
                <ReferenceLine x={360} stroke="#ffffff22" strokeDasharray="4 4" />
                <Line
                  data={allData[30]}
                  type="monotone"
                  dataKey="productivity"
                  stroke="#e05c5c"
                  strokeWidth={1.5}
                  dot={false}
                  name={`Batch 30 (~${roleConfig.cycles[30]} min/tote)`}
                />
                <Line
                  data={allData[15]}
                  type="monotone"
                  dataKey="productivity"
                  stroke="#e09a3a"
                  strokeWidth={1.5}
                  dot={false}
                  name={`Batch 15 (~${roleConfig.cycles[15]} min/tote)`}
                />
                <Line
                  data={allData[5]}
                  type="monotone"
                  dataKey="productivity"
                  stroke="#4caf82"
                  strokeWidth={2}
                  dot={false}
                  name={`Batch 5 (~${roleConfig.cycles[5]} min/tote)`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p style={{ fontSize: "11px", color: "#333", marginTop: "24px", textAlign: "center" }}>
          Variance % controls both event probability and dip depth. Higher variance = more frequent and deeper productivity drops. Dashed lines = scheduled breaks and lunch.
        </p>
      </div>
    </div>
  );
}
