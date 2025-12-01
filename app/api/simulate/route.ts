import { type NextRequest, NextResponse } from "next/server"

// Monte Carlo Simulation using Geometric Brownian Motion
function boxMullerRandom(): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0
}

function runMonteCarlo(currentPrice: number, volatility: number, days: number, numSimulations: number) {
  const dt = 1 / 252 // Trading days per year
  const drift = 0.05 // Expected annual return (5%)
  const sqrtDt = Math.sqrt(dt)

  const paths: number[][] = []
  const finalPrices: number[] = []

  // Generate Monte Carlo paths
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [currentPrice]
    let current = currentPrice

    for (let day = 0; day < days; day++) {
      // Geometric Brownian Motion: dS = μ*S*dt + σ*S*dW
      const randomNormal = boxMullerRandom()
      const driftComponent = drift * current * dt
      const volatilityComponent = (volatility / 100) * current * sqrtDt * randomNormal
      current = current + driftComponent + volatilityComponent
      current = Math.max(current, 0) // Prevent negative prices
      path.push(current)
    }

    paths.push(path)
    finalPrices.push(current)
  }

  // Calculate statistics
  const meanFinalPrice = finalPrices.reduce((a, b) => a + b) / finalPrices.length
  const variance = finalPrices.reduce((sum, price) => sum + Math.pow(price - meanFinalPrice, 2), 0) / finalPrices.length
  const stdDev = Math.sqrt(variance)

  const sortedPrices = [...finalPrices].sort((a, b) => a - b)
  const percentile5 = sortedPrices[Math.floor((5 / 100) * numSimulations)]
  const percentile95 = sortedPrices[Math.floor((95 / 100) * numSimulations)]

  const var95Price = percentile5
  const var95Loss = currentPrice - var95Price
  const var95Pct = (var95Loss / currentPrice) * 100

  // Calculate paths for mean and percentiles
  const meanPath: number[] = []
  const percentile5Path: number[] = []
  const percentile95Path: number[] = []

  for (let day = 0; day <= days; day++) {
    const dayPrices = paths.map((p) => p[day])
    const dayMean = dayPrices.reduce((a, b) => a + b) / dayPrices.length
    const daySorted = [...dayPrices].sort((a, b) => a - b)
    const dayP5 = daySorted[Math.floor((5 / 100) * numSimulations)]
    const dayP95 = daySorted[Math.floor((95 / 100) * numSimulations)]

    meanPath.push(dayMean)
    percentile5Path.push(dayP5)
    percentile95Path.push(dayP95)
  }

  const expectedReturn = ((meanFinalPrice - currentPrice) / currentPrice) * 100

  return {
    paths,
    mean_path: meanPath,
    percentile_5: percentile5Path,
    percentile_95: percentile95Path,
    final_prices: finalPrices,
    statistics: {
      initial_price: currentPrice,
      mean_final_price: Math.round(meanFinalPrice * 100) / 100,
      std_dev: Math.round(stdDev * 100) / 100,
      min_price: Math.round(Math.min(...finalPrices) * 100) / 100,
      max_price: Math.round(Math.max(...finalPrices) * 100) / 100,
      var_95_price: Math.round(var95Price * 100) / 100,
      var_95_loss: Math.round(var95Loss * 100) / 100,
      var_95_pct: Math.round(var95Pct * 100) / 100,
      expected_return: Math.round(expectedReturn * 100) / 100,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.current_price || !body.volatility || !body.days || !body.num_simulations) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const result = runMonteCarlo(body.current_price, body.volatility, body.days, body.num_simulations)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
