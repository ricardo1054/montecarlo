from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import numpy as np

app = FastAPI(title="Financial Risk Simulator")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

def simulate(request: SimulationRequest) -> dict:
    """
    Monte Carlo Simulation using Geometric Brownian Motion (GBM)
    Formula: dS = μ*S*dt + σ*S*dW
    """
    S = request.current_price
    sigma = request.volatility / 100  # Convert percentage to decimal
    mu = request.risk_free_rate
    T = request.days / 252  # Trading days per year
    dt = T / request.days
    
    # Initialize paths matrix
    paths = np.zeros((request.num_simulations, request.days + 1))
    paths[:, 0] = S
    
    # Generate random numbers (vectorized for performance)
    Z = np.random.standard_normal((request.num_simulations, request.days))
    
    # Apply GBM formula for each time step
    for t in range(1, request.days + 1):
        paths[:, t] = paths[:, t-1] * np.exp(
            (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z[:, t-1]
        )
    
    # Calculate statistics
    mean_path = np.mean(paths, axis=0).tolist()
    percentile_5 = np.percentile(paths, 5, axis=0).tolist()
    percentile_95 = np.percentile(paths, 95, axis=0).tolist()
    
    final_prices = paths[:, -1].tolist()
    final_sorted = np.sort(final_prices)
    
    # VaR (Value at Risk) at 95% confidence
    var_95_index = int(len(final_sorted) * 0.05)
    var_95_price = float(final_sorted[var_95_index])
    var_95_loss = S - var_95_price
    var_95_pct = (var_95_loss / S) * 100
    
    mean_final = float(np.mean(final_prices))
    std_final = float(np.std(final_prices))
    
    statistics = {
        "initial_price": S,
        "mean_final_price": round(mean_final, 2),
        "std_dev": round(std_final, 2),
        "min_price": round(float(np.min(final_prices)), 2),
        "max_price": round(float(np.max(final_prices)), 2),
        "var_95_price": round(var_95_price, 2),
        "var_95_loss": round(var_95_loss, 2),
        "var_95_pct": round(var_95_pct, 2),
        "expected_return": round(((mean_final - S) / S) * 100, 2),
    }
    
    return {
        "paths": paths.tolist(),
        "mean_path": mean_path,
        "percentile_5": percentile_5,
        "percentile_95": percentile_95,
        "final_prices": final_prices,
        "statistics": statistics,
    }

@app.post("/api/simulate")
async def api_simulate(request: SimulationRequest):
    result = simulate(request)
    return result

@app.get("/api/health")
async def health():
    return {"status": "ok"}
