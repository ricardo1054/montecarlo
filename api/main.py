from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from typing import Dict, List
import math

app = FastAPI(title="Financial Risk Simulator")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class SimulationRequest(BaseModel):
    current_price: float
    volatility: float
    days: int
    num_simulations: int
    risk_free_rate: float = 0.02

class SimulationResponse(BaseModel):
    paths: List[List[float]]
    mean_path: List[float]
    percentile_5: List[float]
    percentile_95: List[float]
    final_prices: List[float]
    statistics: Dict

@app.post("/api/simulate")
async def simulate_risk(request: SimulationRequest) -> SimulationResponse:
    """
    Monte Carlo Simulation for Financial Risk Analysis
    
    The model uses a Geometric Brownian Motion (GBM) to simulate stock prices:
    dS = μ*S*dt + σ*S*dW
    
    Where:
    - μ (mu): drift = risk-free rate
    - σ (sigma): volatility (annual)
    - dW: Wiener process (random walk)
    """
    
    S = request.current_price
    sigma = request.volatility / 100  # Convert percentage to decimal
    mu = request.risk_free_rate
    T = request.days / 252  # Convert days to years (252 trading days)
    dt = T / request.days
    
    # Initialize array for all paths: (num_simulations, days+1)
    paths = np.zeros((request.num_simulations, request.days + 1))
    paths[:, 0] = S
    
    # Generate random numbers for all simulations at once
    # Shape: (num_simulations, days)
    Z = np.random.standard_normal((request.num_simulations, request.days))
    
    # Apply GBM formula for each day and simulation
    for t in range(1, request.days + 1):
        # Vectorized calculation for all simulations
        paths[:, t] = paths[:, t-1] * np.exp(
            (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z[:, t-1]
        )
    
    # Calculate statistics from the paths
    mean_path = np.mean(paths, axis=0).tolist()
    percentile_5 = np.percentile(paths, 5, axis=0).tolist()
    percentile_95 = np.percentile(paths, 95, axis=0).tolist()
    
    # Final prices (last day for all simulations)
    final_prices = paths[:, -1].tolist()
    
    # Calculate VaR and other metrics
    final_sorted = np.sort(final_prices)
    var_95_index = int(len(final_sorted) * 0.05)  # 5th percentile
    var_95_price = final_sorted[var_95_index]
    var_95_loss = S - var_95_price
    var_95_pct = (var_95_loss / S) * 100
    
    # Additional statistics
    mean_final = np.mean(final_prices)
    std_final = np.std(final_prices)
    min_final = np.min(final_prices)
    max_final = np.max(final_prices)
    
    statistics = {
        "initial_price": S,
        "mean_final_price": round(mean_final, 2),
        "std_dev": round(std_final, 2),
        "min_price": round(min_final, 2),
        "max_price": round(max_final, 2),
        "var_95_price": round(var_95_price, 2),
        "var_95_loss": round(var_95_loss, 2),
        "var_95_pct": round(var_95_pct, 2),
        "expected_return": round(((mean_final - S) / S) * 100, 2),
    }
    
    return SimulationResponse(
        paths=paths.tolist(),
        mean_path=mean_path,
        percentile_5=percentile_5,
        percentile_95=percentile_95,
        final_prices=final_prices,
        statistics=statistics
    )

@app.get("/api/health")
async def health():
    return {"status": "ok"}
