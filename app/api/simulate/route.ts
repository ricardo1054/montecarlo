import { type NextRequest, NextResponse } from "next/server"

// Monte Carlo Simulation using Geometric Brownian Motion
function runMonteCarlo(current_price: number, volatility: number, days: number, num_simulations: number) {
  const dt = 1 / 252 // Trading days per year
  const drift = 0.05 // Expected annual return (5%)
  const sqrt_dt = Math.sqrt(dt)

  const paths: number[][] = []
  const final_prices: number[] = []

  for (let sim = 0; sim < num_simulations; sim++) {
    const path: number[] = [current_price]
    let current = current_price

    for (let day = 0; day < days; day++) {
      // Geometric Brownian Motion: dS = μ*S*dt + σ*S*dW
      const random_normal = boxMullerRandom()
      const drift_component = drift * current * dt
      const volatility_component = (volatility / 100) * current * sqrt_dt * random_normal
      current = current + drift_component + volatility_component
      current = Math.max(current, 0) // Prevent negative prices
      path.push(current)
    }

    paths.push(path)
    final_prices.push(current)
  }

  const mean_final_price = final_prices.reduce((a, b) => a + b) / final_prices.length
  const variance =
    final_prices.reduce((sum, price) => sum + Math.pow(price - mean_final_price, 2), 0) / final_prices.length
  const std_dev = Math.sqrt(variance)

  const sorted_prices = [...final_prices].sort((a, b) => a - b)
  const percentile_5 = sorted_prices[Math.floor((5 / 100) * num_simulations)]
  const percentile_95 = sorted_prices[Math.floor((95 / 100) * num_simulations)]

  const var_95_price = percentile_5
  const var_95_loss = current_price - var_95_price
  const var_95_pct = (var_95_loss / current_price) * 100

  const mean_path: number[] = []
  const percentile_5_path: number[] = []
  const percentile_95_path: number[] = []

  for (let day = 0; day <= days; day++) {
    const day_prices = paths.map((p) => p[day])
    const day_mean = day_prices.reduce((a, b) => a + b) / day_prices.length
    const day_sorted = [...day_prices].sort((a, b) => a - b)
    const day_p5 = day_sorted[Math.floor((5 / 100) * num_simulations)]
    const day_p95 = day_sorted[Math.floor((95 / 100) * num_simulations)]

    mean_path.push(day_mean)
    percentile_5_path.push(day_p5)
    percentile_95_path.push(day_p95)
  }

  const expected_return = ((mean_final_price - current_price) / current_price) * 100

  return {
    paths,
    mean_path,
    percentile_5: percentile_5_path,
    percentile_95: percentile_95_path,
    final_prices,
    statistics: {
      initial_price: current_price,
      mean_final_price: Math.round(mean_final_price * 100) / 100,
      std_dev: Math.round(std_dev * 100) / 100,
      min_price: Math.round(Math.min(...final_prices) * 100) / 100,
      max_price: Math.round(Math.max(...final_prices) * 100) / 100,
      var_95_price: Math.round(var_95_price * 100) / 100,
      var_95_loss: Math.round(var_95_loss * 100) / 100,
      var_95_pct: Math.round(var_95_pct * 100) / 100,
      expected_return: Math.round(expected_return * 100) / 100,
    },
  }
}

// Box-Muller transform for generating normal distribution random numbers
function boxMullerRandom(): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.current_price || !body.volatility || !body.days || !body.num_simulations) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const result = runMonteCarlo(body.current_price, body.volatility, body.days, body.num_simulations)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Simulation failed" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
