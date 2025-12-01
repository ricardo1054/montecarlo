"use client"

import { useState } from "react"
import { SimulationForm } from "./simulation-form"
import { SimulationChart } from "./simulation-chart"
import { RiskMetrics } from "./risk-metrics"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export interface SimulationData {
  paths: number[][]
  mean_path: number[]
  percentile_5: number[]
  percentile_95: number[]
  final_prices: number[]
  statistics: {
    initial_price: number
    mean_final_price: number
    std_dev: number
    min_price: number
    max_price: number
    var_95_price: number
    var_95_loss: number
    var_95_pct: number
    expected_return: number
  }
}

export function RiskSimulator() {
  const [simData, setSimData] = useState<SimulationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSimulate = async (params: {
    current_price: number
    volatility: number
    days: number
    num_simulations: number
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = `${response.status}: ${errorData.error}`
          }
        } catch {
          const text = await response.text()
          if (text) {
            errorMessage = `${response.status}: ${text}`
          }
        }
        throw new Error(errorMessage)
      }

      const data: SimulationData = await response.json()
      setSimData(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Financial Risk Simulator</h1>
          <p className="text-slate-400">Monte Carlo analysis for asset price predictions</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Simulation Parameters</CardTitle>
              <CardDescription>Configure your risk analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <SimulationForm onSimulate={handleSimulate} loading={loading} />
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Card className="bg-red-950 border-red-800">
                <CardContent className="pt-6">
                  <p className="text-red-200">{error}</p>
                </CardContent>
              </Card>
            )}

            {simData && (
              <>
                {/* Chart */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Price Simulation Paths</CardTitle>
                    <CardDescription>
                      {simData.paths.length} Monte Carlo simulations over {simData.paths[0].length - 1} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SimulationChart data={simData} />
                  </CardContent>
                </Card>

                {/* Risk Metrics */}
                <RiskMetrics stats={simData.statistics} />
              </>
            )}

            {!simData && !loading && (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-slate-400">Run a simulation to see results</p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  </div>
                  <p className="text-slate-400 mt-4">Running simulation...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
