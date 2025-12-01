"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown, AlertTriangle, TrendingUp, Zap } from "lucide-react"

interface RiskMetricsProps {
  stats: {
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

export function RiskMetrics({ stats }: RiskMetricsProps) {
  const metrics = [
    {
      title: "Value at Risk (95%)",
      value: `$${stats.var_95_loss.toFixed(2)}`,
      description: `Maximum loss with 95% confidence`,
      subtitle: `${stats.var_95_pct.toFixed(2)}% of initial`,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-950",
    },
    {
      title: "Expected Final Price",
      value: `$${stats.mean_final_price.toFixed(2)}`,
      description: `Average outcome from all simulations`,
      subtitle: `±$${stats.std_dev.toFixed(2)} std dev`,
      icon: TrendingUp,
      color: "text-cyan-400",
      bgColor: "bg-cyan-950",
    },
    {
      title: "Expected Return",
      value: `${stats.expected_return.toFixed(2)}%`,
      description: `Potential gain/loss percentage`,
      subtitle: `From $${stats.initial_price.toFixed(2)} initial`,
      icon: Zap,
      color: "text-emerald-400",
      bgColor: "bg-emerald-950",
    },
    {
      title: "Price Range",
      value: `$${stats.min_price.toFixed(2)} - $${stats.max_price.toFixed(2)}`,
      description: `Best to worst case scenarios`,
      subtitle: `Spread: $${(stats.max_price - stats.min_price).toFixed(2)}`,
      icon: TrendingDown,
      color: "text-violet-400",
      bgColor: "bg-violet-950",
    },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title} className={`${metric.bgColor} border-0`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-300">{metric.title}</CardTitle>
                <Icon className={`${metric.color} w-5 h-5`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
              <p className="text-xs text-slate-400 mb-1">{metric.description}</p>
              <p className={`text-xs ${metric.color}`}>{metric.subtitle}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
