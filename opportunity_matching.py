import argparse
import time
from uuid import uuid4

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse


POSITION_ALIASES = {
    "Energy Off-Takers": "Energy Off-takers",
    "Energy Off‑takers": "Energy Off-takers",
    "Research, Innovation & Early‑stage Companies": "Research, Innovation & Early-stage Companies",
}


def normalize_position(position: str) -> str:
    return POSITION_ALIASES.get(position, position)


# Valid ecosystem matching pairs with weights
PAIR_WEIGHTS = {
    ("Research, Innovation & Early-stage Companies", "Project Developers"): 55,
    (
        "Research, Innovation & Early-stage Companies",
        "Technology & Equipment Suppliers",
    ): 51,
    ("Project Developers", "EPC Contractors"): 80,
    ("Project Developers", "Technology & Equipment Suppliers"): 72,
    ("Project Developers", "Storage Suppliers"): 68,
    ("Project Developers", "Project Sponsors & Investors"): 80,
    ("Project Developers", "Energy Off-takers"): 76,
    ("EPC Contractors", "Technology & Equipment Suppliers"): 76,
    ("EPC Contractors", "Project Sponsors & Investors"): 64,
    ("Technology & Equipment Suppliers", "Storage Suppliers"): 68,
    ("Technology & Equipment Suppliers", "Grid & Transmission Operators"): 68,
    ("Storage Suppliers", "Energy Off-takers"): 64,
    ("Grid & Transmission Operators", "Project Developers"): 55,
    ("Project Sponsors & Investors", "Energy Off-takers"): 76,
    (
        "Research, Innovation & Early-stage Companies",
        "Project Sponsors & Investors",
    ): 47,
}

# Geography scoring bonus (max 20)
GEO_SCORES = {
    "Same city": 20,
    "Same country": 10,
    "Cross-country": 0,
}


COMPANIES = [
    {
        "id": "py-client-001",
        "name": "DragonSun Developments",
        "ecosystem_position": "Project Developers",
        "city": "Shanghai",
        "country": "China",
        "rm_id": "rm-001",
    },
    {
        "id": "py-client-002",
        "name": "GreatWall EPC",
        "ecosystem_position": "EPC Contractors",
        "city": "Shanghai",
        "country": "China",
        "rm_id": "rm-002",
    },
    {
        "id": "py-client-003",
        "name": "SinoGrid Networks",
        "ecosystem_position": "Grid & Transmission Operators",
        "city": "Beijing",
        "country": "China",
        "rm_id": "rm-004",
    },
    {
        "id": "py-client-004",
        "name": "RedLeaf Research",
        "ecosystem_position": "Research, Innovation & Early-stage Companies",
        "city": "Beijing",
        "country": "China",
        "rm_id": "rm-003",
    },
    {
        "id": "py-client-005",
        "name": "JadeTech Manufacturing",
        "ecosystem_position": "Technology & Equipment Suppliers",
        "city": "Shenzhen",
        "country": "China",
        "rm_id": "rm-002",
    },
    {
        "id": "py-client-006",
        "name": "PearlRiver Storage",
        "ecosystem_position": "Storage Suppliers",
        "city": "Shenzhen",
        "country": "China",
        "rm_id": "rm-001",
    },
    {
        "id": "py-client-007",
        "name": "Outback Renewables",
        "ecosystem_position": "Project Developers",
        "city": "Sydney",
        "country": "Australia",
        "rm_id": "rm-001",
    },
    {
        "id": "py-client-008",
        "name": "SouthernCross EPC",
        "ecosystem_position": "EPC Contractors",
        "city": "Sydney",
        "country": "Australia",
        "rm_id": "rm-002",
    },
    {
        "id": "py-client-009",
        "name": "AussieGrid Services",
        "ecosystem_position": "Grid & Transmission Operators",
        "city": "Melbourne",
        "country": "Australia",
        "rm_id": "rm-004",
    },
    {
        "id": "py-client-010",
        "name": "BlueGum Energy Buyers",
        "ecosystem_position": "Energy Off-takers",
        "city": "Melbourne",
        "country": "Australia",
        "rm_id": "rm-004",
    },
    {
        "id": "py-client-011",
        "name": "KoalaTech Systems",
        "ecosystem_position": "Technology & Equipment Suppliers",
        "city": "Brisbane",
        "country": "Australia",
        "rm_id": "rm-002",
    },
    {
        "id": "py-client-012",
        "name": "CoralBay Capital",
        "ecosystem_position": "Project Sponsors & Investors",
        "city": "Brisbane",
        "country": "Australia",
        "rm_id": "rm-003",
    },
]


def get_pair_weight(pos1: str, pos2: str):
    p1 = normalize_position(pos1)
    p2 = normalize_position(pos2)
    return PAIR_WEIGHTS.get((p1, p2)) or PAIR_WEIGHTS.get((p2, p1))


def get_geo_score(city1: str, country1: str, city2: str, country2: str):
    if city1 == city2 and country1 == country2:
        return GEO_SCORES["Same city"], "Same city"
    if country1 == country2:
        return GEO_SCORES["Same country"], "Same country"
    return GEO_SCORES["Cross-country"], "Cross-country"


def generate_opportunity(company_a: dict, company_b: dict):
    if company_a["rm_id"] == company_b["rm_id"]:
        return None

    pos_a = normalize_position(company_a["ecosystem_position"])
    pos_b = normalize_position(company_b["ecosystem_position"])

    pair_score = get_pair_weight(pos_a, pos_b)
    if pair_score is None:
        return None

    geo_score, geo_label = get_geo_score(
        company_a["city"],
        company_a["country"],
        company_b["city"],
        company_b["country"],
    )

    total_score = max(0, min(100, pair_score + geo_score))
    confidence = (
        "high" if total_score >= 85 else "medium" if total_score >= 70 else "low"
    )

    pairing = f"{pos_a} + {pos_b}"
    explanation = (
        f"{pairing} is a valid ecosystem pairing. "
        f"Geographic proximity is {geo_label}."
    )

    return {
        "id": str(uuid4()),
        "title": f"{company_a['name']} + {company_b['name']}",
        "rm1Id": company_a["rm_id"],
        "rm2Id": company_b["rm_id"],
        "client1": {
            "id": company_a["id"],
            "companyName": company_a["name"],
            "ecosystemPositions": [pos_a],
            "geography": f"{company_a['city']}, {company_a['country']}",
            "revenue": 0,
            "esgAlignment": "N/A",
            "rmId": company_a["rm_id"],
        },
        "client2": {
            "id": company_b["id"],
            "companyName": company_b["name"],
            "ecosystemPositions": [pos_b],
            "geography": f"{company_b['city']}, {company_b['country']}",
            "revenue": 0,
            "esgAlignment": "N/A",
            "rmId": company_b["rm_id"],
        },
        "pairing": pairing,
        "geographicProximity": geo_label,
        "matchScore": round(total_score, 2),
        "confidence": confidence,
        "reasoning": explanation,
    }


def compute_opportunities(min_score: float = 60.0, limit: int = 100):
    opportunities = []
    for i, a in enumerate(COMPANIES):
        for j, b in enumerate(COMPANIES):
            if i >= j:
                continue
            opportunity = generate_opportunity(a, b)
            if opportunity and opportunity["matchScore"] >= min_score:
                opportunities.append(opportunity)

    opportunities.sort(key=lambda o: o["matchScore"], reverse=True)
    return opportunities[:limit]


def write_brief_files():
    print("Buffering: Finding matching pairs...")
    time.sleep(0.4)

    opportunities = compute_opportunities(min_score=0, limit=10_000)
    print(f"Buffering: Found {len(opportunities)} matching pairs. Assigning scores...")
    time.sleep(0.4)

    with open("opportunity_briefs.txt", "w", encoding="utf-8") as f:
        f.write("Opportunity Briefs\n\n")
        for item in opportunities:
            f.write(f"Opportunity Title: {item['title']}\n")
            f.write("Match & Score:\n")
            f.write(f"  Ecosystem pairing: {item['pairing']}\n")
            f.write(f"  Geographic proximity: {item['geographicProximity']}\n")
            f.write(f"  Match score: {item['matchScore']}\n")
            f.write("Match Explanation:\n")
            f.write(item["reasoning"] + "\n")
            f.write("-" * 60 + "\n")

    if opportunities:
        best = opportunities[0]
        with open("best_matching_pair.txt", "w", encoding="utf-8") as f:
            f.write("Best Matching Pair\n\n")
            f.write(f"Opportunity Title: {best['title']}\n")
            f.write("Match & Score:\n")
            f.write(f"  Ecosystem pairing: {best['pairing']}\n")
            f.write(f"  Geographic proximity: {best['geographicProximity']}\n")
            f.write(f"  Match score: {best['matchScore']}\n")
            f.write("Match Explanation:\n")
            f.write(best["reasoning"] + "\n")

    print("Done: Results written to opportunity_briefs.txt and best_matching_pair.txt")


def build_briefs_text(limit: int = 200) -> str:
    opportunities = compute_opportunities(min_score=0, limit=limit)
    lines = ["Opportunity Briefs", ""]

    for item in opportunities:
        lines.append(f"Opportunity Title: {item['title']}")
        lines.append("Match & Score:")
        lines.append(f"  Ecosystem pairing: {item['pairing']}")
        lines.append(f"  Geographic proximity: {item['geographicProximity']}")
        lines.append(f"  Match score: {item['matchScore']}")
        lines.append("Match Explanation:")
        lines.append(item["reasoning"])
        lines.append("-" * 60)

    return "\n".join(lines)


def build_best_pair_text() -> str:
    opportunities = compute_opportunities(min_score=0, limit=1)
    if not opportunities:
        return "No matching pair found."

    best = opportunities[0]
    lines = [
        "Best Matching Pair",
        "",
        f"Opportunity Title: {best['title']}",
        "Match & Score:",
        f"  Ecosystem pairing: {best['pairing']}",
        f"  Geographic proximity: {best['geographicProximity']}",
        f"  Match score: {best['matchScore']}",
        "Match Explanation:",
        best["reasoning"],
    ]
    return "\n".join(lines)


app = FastAPI(title="Opportunity Matching API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/opportunities")
def get_opportunities(
    min_score: float = Query(60.0, ge=0, le=100),
    limit: int = Query(100, ge=1, le=1000),
):
    opportunities = compute_opportunities(min_score=min_score, limit=limit)
    return {
        "count": len(opportunities),
        "opportunities": opportunities,
    }


@app.get("/briefs/text", response_class=PlainTextResponse)
def get_briefs_text(limit: int = Query(200, ge=1, le=2000)):
    return build_briefs_text(limit=limit)


@app.get("/best/text", response_class=PlainTextResponse)
def get_best_text():
    return build_best_pair_text()


def main():
    parser = argparse.ArgumentParser(description="Opportunity matching utility")
    parser.add_argument(
        "--mode",
        choices=["briefs", "serve"],
        default="briefs",
        help="briefs: write txt files, serve: run FastAPI service",
    )
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()

    if args.mode == "serve":
        import uvicorn

        uvicorn.run(
            "opportunity_matching:app", host=args.host, port=args.port, reload=False
        )
        return

    write_brief_files()


if __name__ == "__main__":
    main()
