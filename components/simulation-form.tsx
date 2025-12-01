"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SimulationFormProps {
  onSimulate: (params: {
    current_price: number
    volatility: number
    days: number
    num_simulations: number
  }) => void
  loading: boolean
}

export function SimulationForm({ onSimulate, loading }: SimulationFormProps) {
  const [formData, setFormData] = useState({
    current_price: 100,
    volatility: 20,
    days: 30,
    num_simulations: 1000,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: Number.parseFloat(value) || 0,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSimulate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-white mb-2 block">Current Price ($)</Label>
        <Input
          type="number"
          name="current_price"
          value={formData.current_price}
          onChange={handleChange}
          step="0.01"
          min="0.01"
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-white mb-2 block">Volatility (%)</Label>
        <Input
          type="number"
          name="volatility"
          value={formData.volatility}
          onChange={handleChange}
          step="1"
          min="0"
          max="100"
          className="bg-slate-700 border-slate-600 text-white"
        />
        <p className="text-xs text-slate-400 mt-1">Annual volatility. 20% is typical for stocks</p>
      </div>

      <div>
        <Label className="text-white mb-2 block">Days to Project</Label>
        <Input
          type="number"
          name="days"
          value={formData.days}
          onChange={handleChange}
          step="1"
          min="1"
          max="365"
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-white mb-2 block">Number of Simulations</Label>
        <Input
          type="number"
          name="num_simulations"
          value={formData.num_simulations}
          onChange={handleChange}
          step="100"
          min="100"
          max="10000"
          className="bg-slate-700 border-slate-600 text-white"
        />
        <p className="text-xs text-slate-400 mt-1">More simulations = more accurate (slower)</p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold"
      >
        {loading ? "Simulating..." : "Run Simulation"}
      </Button>
    </form>
  )
}
