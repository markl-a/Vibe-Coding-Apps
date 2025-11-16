"""
智能路線規劃系統
使用遺傳算法和貪婪算法優化配送路線
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple, Optional
import numpy as np
import random
from datetime import datetime, timedelta
import math

app = FastAPI(
    title="智能路線規劃系統",
    description="基於啟發式算法的配送路線優化系統",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 請求模型
class Location(BaseModel):
    """位置"""
    id: str
    name: str
    latitude: float
    longitude: float
    demand: float = 0.0  # 需求量
    time_window_start: Optional[str] = None  # 時間窗口開始
    time_window_end: Optional[str] = None  # 時間窗口結束
    service_time: int = 15  # 服務時間(分鐘)

class Vehicle(BaseModel):
    """車輛"""
    id: str
    capacity: float
    cost_per_km: float = 10.0
    max_distance: float = 200.0  # 最大行駛距離(km)

class RouteOptimizationRequest(BaseModel):
    """路線優化請求"""
    depot: Location  # 配送中心
    locations: List[Location]  # 配送點
    vehicles: List[Vehicle]  # 車輛列表
    optimization_goal: str = "distance"  # distance, cost, time

# 路線優化服務
class RouteOptimizationService:
    """路線優化服務"""

    @staticmethod
    def calculate_distance(loc1: Location, loc2: Location) -> float:
        """
        計算兩點之間的距離(使用 Haversine 公式)
        返回距離(公里)
        """
        R = 6371  # 地球半徑(公里)

        lat1_rad = math.radians(loc1.latitude)
        lat2_rad = math.radians(loc2.latitude)
        delta_lat = math.radians(loc2.latitude - loc1.latitude)
        delta_lon = math.radians(loc2.longitude - loc1.longitude)

        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)

        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = R * c
        return round(distance, 2)

    @staticmethod
    def create_distance_matrix(locations: List[Location]) -> np.ndarray:
        """創建距離矩陣"""
        n = len(locations)
        matrix = np.zeros((n, n))

        for i in range(n):
            for j in range(n):
                if i != j:
                    matrix[i][j] = RouteOptimizationService.calculate_distance(
                        locations[i],
                        locations[j]
                    )

        return matrix

    @staticmethod
    def nearest_neighbor(
        depot_idx: int,
        locations: List[Location],
        distance_matrix: np.ndarray
    ) -> Tuple[List[int], float]:
        """
        最近鄰算法(貪婪算法)
        時間複雜度: O(n²)
        """
        n = len(locations)
        unvisited = set(range(n))
        unvisited.remove(depot_idx)

        route = [depot_idx]
        current = depot_idx
        total_distance = 0

        while unvisited:
            nearest = min(unvisited, key=lambda x: distance_matrix[current][x])
            total_distance += distance_matrix[current][nearest]
            current = nearest
            route.append(current)
            unvisited.remove(current)

        # 返回配送中心
        total_distance += distance_matrix[current][depot_idx]
        route.append(depot_idx)

        return route, total_distance

    @staticmethod
    def genetic_algorithm(
        depot_idx: int,
        locations: List[Location],
        distance_matrix: np.ndarray,
        population_size: int = 100,
        generations: int = 500,
        mutation_rate: float = 0.01
    ) -> Tuple[List[int], float]:
        """
        遺傳算法優化路線
        """
        n = len(locations)
        customer_indices = [i for i in range(n) if i != depot_idx]

        def create_individual():
            """創建個體(隨機路線)"""
            route = customer_indices.copy()
            random.shuffle(route)
            return [depot_idx] + route + [depot_idx]

        def calculate_fitness(route):
            """計算適應度(總距離的倒數)"""
            distance = sum(
                distance_matrix[route[i]][route[i + 1]]
                for i in range(len(route) - 1)
            )
            return 1 / distance if distance > 0 else 0

        def crossover(parent1, parent2):
            """交叉(OX交叉)"""
            size = len(parent1) - 2  # 排除起點和終點
            start, end = sorted(random.sample(range(1, size + 1), 2))

            child = [None] * (size + 2)
            child[0] = depot_idx
            child[-1] = depot_idx

            # 複製父代1的片段
            child[start:end] = parent1[start:end]

            # 填充父代2的剩餘元素
            pos = end
            for gene in parent2[1:-1]:
                if gene not in child:
                    if pos >= size + 1:
                        pos = 1
                    child[pos] = gene
                    pos += 1

            return child

        def mutate(route):
            """變異(交換兩個城市)"""
            if random.random() < mutation_rate:
                i, j = random.sample(range(1, len(route) - 1), 2)
                route[i], route[j] = route[j], route[i]
            return route

        # 初始化種群
        population = [create_individual() for _ in range(population_size)]

        # 進化
        for generation in range(generations):
            # 計算適應度
            fitness_scores = [calculate_fitness(ind) for ind in population]

            # 選擇(輪盤賭選擇)
            total_fitness = sum(fitness_scores)
            probabilities = [f / total_fitness for f in fitness_scores]

            new_population = []

            # 精英保留
            elite_count = int(population_size * 0.1)
            elite_indices = sorted(
                range(len(fitness_scores)),
                key=lambda i: fitness_scores[i],
                reverse=True
            )[:elite_count]
            new_population.extend([population[i] for i in elite_indices])

            # 生成新個體
            while len(new_population) < population_size:
                parent1 = random.choices(population, weights=probabilities)[0]
                parent2 = random.choices(population, weights=probabilities)[0]
                child = crossover(parent1, parent2)
                child = mutate(child)
                new_population.append(child)

            population = new_population

        # 返回最優解
        best_individual = max(population, key=calculate_fitness)
        best_distance = sum(
            distance_matrix[best_individual[i]][best_individual[i + 1]]
            for i in range(len(best_individual) - 1)
        )

        return best_individual, best_distance

    @staticmethod
    def optimize_with_capacity(
        depot: Location,
        locations: List[Location],
        vehicles: List[Vehicle],
        distance_matrix: np.ndarray
    ) -> List[dict]:
        """
        考慮車輛容量的多車輛路線優化(簡化版 VRP)
        使用貪婪算法
        """
        all_locations = [depot] + locations
        depot_idx = 0
        unassigned = list(range(1, len(all_locations)))

        routes = []

        for vehicle in vehicles:
            if not unassigned:
                break

            route = [depot_idx]
            current_load = 0
            current_distance = 0
            current_location = depot_idx

            while unassigned:
                # 找到最近的未分配點
                feasible = [
                    idx for idx in unassigned
                    if current_load + all_locations[idx].demand <= vehicle.capacity
                ]

                if not feasible:
                    break

                nearest = min(
                    feasible,
                    key=lambda x: distance_matrix[current_location][x]
                )

                route.append(nearest)
                current_load += all_locations[nearest].demand
                current_distance += distance_matrix[current_location][nearest]
                current_location = nearest
                unassigned.remove(nearest)

            # 返回配送中心
            current_distance += distance_matrix[current_location][depot_idx]
            route.append(depot_idx)

            route_locations = [all_locations[idx] for idx in route]
            routes.append({
                "vehicle_id": vehicle.id,
                "route": route,
                "locations": [loc.dict() for loc in route_locations],
                "total_distance": round(current_distance, 2),
                "total_load": round(current_load, 2),
                "total_cost": round(current_distance * vehicle.cost_per_km, 2),
                "capacity_utilization": round((current_load / vehicle.capacity) * 100, 2)
            })

        # 檢查是否有未分配的點
        if unassigned:
            unassigned_locations = [all_locations[idx] for idx in unassigned]
            routes.append({
                "warning": "部分配送點未分配",
                "unassigned_locations": [loc.dict() for loc in unassigned_locations]
            })

        return routes

# API 路由
@app.get("/")
async def root():
    return {
        "message": "智能路線規劃系統 API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "optimize_tsp": "/api/optimize/tsp",
            "optimize_vrp": "/api/optimize/vrp",
            "distance_matrix": "/api/distance-matrix"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/distance-matrix")
async def calculate_distance_matrix(locations: List[Location]):
    """計算距離矩陣"""
    try:
        service = RouteOptimizationService()
        distance_matrix = service.create_distance_matrix(locations)

        return {
            "status": "success",
            "locations": [loc.dict() for loc in locations],
            "distance_matrix": distance_matrix.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimize/tsp")
async def optimize_tsp(request: RouteOptimizationRequest):
    """
    TSP 優化(單車輛，無容量限制)
    使用遺傳算法
    """
    try:
        service = RouteOptimizationService()

        # 合併配送中心和配送點
        all_locations = [request.depot] + request.locations
        depot_idx = 0

        # 創建距離矩陣
        distance_matrix = service.create_distance_matrix(all_locations)

        # 使用最近鄰算法(快速解)
        nn_route, nn_distance = service.nearest_neighbor(
            depot_idx,
            all_locations,
            distance_matrix
        )

        # 使用遺傳算法(優化解)
        ga_route, ga_distance = service.genetic_algorithm(
            depot_idx,
            all_locations,
            distance_matrix,
            population_size=100,
            generations=500
        )

        # 選擇更好的解
        if ga_distance < nn_distance:
            best_route = ga_route
            best_distance = ga_distance
            algorithm = "遺傳算法"
        else:
            best_route = nn_route
            best_distance = nn_distance
            algorithm = "最近鄰算法"

        # 構建結果
        route_locations = [all_locations[idx] for idx in best_route]

        # 計算預估時間
        avg_speed = 50  # km/h
        travel_time = (best_distance / avg_speed) * 60  # 分鐘
        service_time = sum(loc.service_time for loc in request.locations)
        total_time = travel_time + service_time

        return {
            "status": "success",
            "algorithm": algorithm,
            "route": {
                "sequence": best_route,
                "locations": [loc.dict() for loc in route_locations],
                "total_distance_km": round(best_distance, 2),
                "travel_time_minutes": round(travel_time, 2),
                "service_time_minutes": service_time,
                "total_time_minutes": round(total_time, 2),
                "stops": len(request.locations)
            },
            "comparison": {
                "nearest_neighbor_distance": round(nn_distance, 2),
                "genetic_algorithm_distance": round(ga_distance, 2),
                "improvement_percentage": round(
                    ((nn_distance - ga_distance) / nn_distance) * 100, 2
                )
            },
            "recommendations": [
                f"總行駛距離: {best_distance:.2f} 公里",
                f"預計行駛時間: {travel_time:.0f} 分鐘",
                f"配送點數量: {len(request.locations)}",
                f"使用算法: {algorithm}"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimize/vrp")
async def optimize_vrp(request: RouteOptimizationRequest):
    """
    VRP 優化(多車輛，考慮容量限制)
    """
    try:
        service = RouteOptimizationService()

        # 合併配送中心和配送點
        all_locations = [request.depot] + request.locations

        # 創建距離矩陣
        distance_matrix = service.create_distance_matrix(all_locations)

        # 執行多車輛路線優化
        routes = service.optimize_with_capacity(
            request.depot,
            request.locations,
            request.vehicles,
            distance_matrix
        )

        # 計算總體統計
        total_distance = sum(r.get('total_distance', 0) for r in routes if 'total_distance' in r)
        total_cost = sum(r.get('total_cost', 0) for r in routes if 'total_cost' in r)
        vehicles_used = sum(1 for r in routes if 'total_distance' in r)

        return {
            "status": "success",
            "routes": routes,
            "summary": {
                "total_distance_km": round(total_distance, 2),
                "total_cost": round(total_cost, 2),
                "vehicles_used": vehicles_used,
                "total_locations": len(request.locations),
                "average_distance_per_vehicle": round(
                    total_distance / vehicles_used if vehicles_used > 0 else 0, 2
                )
            },
            "recommendations": [
                f"使用 {vehicles_used} 輛車輛",
                f"總行駛距離: {total_distance:.2f} 公里",
                f"總成本: ${total_cost:.2f}",
                f"平均每輛車行駛: {total_distance/vehicles_used if vehicles_used > 0 else 0:.2f} 公里"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
