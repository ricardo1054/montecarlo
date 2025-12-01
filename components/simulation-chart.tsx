"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { SimulationData } from "./risk-simulator"

interface SimulationChartProps {
  data: SimulationData
}

export function SimulationChart({ data }: SimulationChartProps) {
  const chartData = useMemo(() => {
    const pathCount = data.mean_path.length
    const result = []

    // Sample 50 paths to avoid overwhelming the chart
    const step = Math.max(1, Math.floor(data.paths.length / 50))
    const sampledPaths = data.paths.filter((_, idx) => idx % step === 0)

    for (let i = 0; i < pathCount; i++) {
      const dayData: Record<string, number> = {
        day: i,
        mean: Math.round(data.mean_path[i] * 100) / 100,
        p5: Math.round(data.percentile_5[i] * 100) / 100,
        p95: Math.round(data.percentile_95[i] * 100) / 100,
      }

      // Add each sampled path to the same data point
      sampledPaths.forEach((path, pathIdx) => {
        dayData[`path_${pathIdx}`] = Math.round(path[i] * 100) / 100
      })

      result.push(dayData)
    }

    return result
  }, [data])

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="day" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
          labelStyle={{ color: "#fff" }}
        />
        <Legend />

        {/* Individual simulation paths (faint lines - "spaghetti" effect) */}
        {useMemo(() => {
          const step = Math.max(1, Math.floor(data.paths.length / 50))
          const sampledCount = Math.floor(data.paths.length / step)
          return Array.from({ length: sampledCount }).map((_, idx) => (
            <Line
              key={`path-${idx}`}
              type="monotone"
              dataKey={`path_${idx}`}
              stroke="#475569"
              strokeOpacity={0.1}
              dot={false}
              isAnimationActive={false}
              legendType="none"
            />
          ))
        }, [data.paths.length])}

        {/* Mean path */}
        <Line type="monotone" dataKey="mean" stroke="#06b6d4" strokeWidth={2} dot={false} name="Mean Price" />

        {/* 95% confidence interval */}
        <Line
          type="monotone"
          dataKey="p95"
          stroke="#10b981"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          name="95th Percentile"
        />

        {/* 5% confidence interval */}
        <Line
          type="monotone"
          dataKey="p5"
          stroke="#ef4444"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          name="5th Percentile (VaR)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
