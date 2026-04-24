/**
 * Banking Products and Ecosystem Position Mappings
 * Defines all banking products available for cross-ecosystem opportunities
 */

import { BankingProduct, EcosystemPosition } from '../models';

/**
 * All available banking products with their descriptions and applicable position pairs
 */
export const BANKING_PRODUCTS: BankingProduct[] = [
    {
        name: "Project Finance",
        description: "Long-term financing for large-scale renewable energy projects, including construction and operational phases",
        applicablePositionPairs: [
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.TECHNOLOGY_SUPPLIERS],
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.EPC_CONTRACTORS],
            [EcosystemPosition.PROJECT_SPONSORS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.ENERGY_OFFTAKERS, EcosystemPosition.PROJECT_DEVELOPERS]
        ]
    },
    {
        name: "Working Capital",
        description: "Short-term financing to support operational cash flow needs and inventory management",
        applicablePositionPairs: [
            [EcosystemPosition.EPC_CONTRACTORS, EcosystemPosition.TECHNOLOGY_SUPPLIERS],
            [EcosystemPosition.TECHNOLOGY_SUPPLIERS, EcosystemPosition.STORAGE_SUPPLIERS],
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.EPC_CONTRACTORS]
        ]
    },
    {
        name: "Guarantees & Letters of Credit",
        description: "Performance guarantees, bid bonds, and payment assurances for project execution",
        applicablePositionPairs: [
            [EcosystemPosition.EPC_CONTRACTORS, EcosystemPosition.TECHNOLOGY_SUPPLIERS],
            [EcosystemPosition.STORAGE_SUPPLIERS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.ENERGY_OFFTAKERS]
        ]
    },
    {
        name: "Trade Finance",
        description: "Import/export financing for equipment and technology procurement across borders",
        applicablePositionPairs: [
            [EcosystemPosition.TECHNOLOGY_SUPPLIERS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.STORAGE_SUPPLIERS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.TECHNOLOGY_SUPPLIERS, EcosystemPosition.EPC_CONTRACTORS]
        ]
    },
    {
        name: "Debt Advisory",
        description: "Strategic advisory services for capital structure optimization and debt placement",
        applicablePositionPairs: [
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.TECHNOLOGY_SUPPLIERS],
            [EcosystemPosition.PROJECT_SPONSORS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.STORAGE_SUPPLIERS]
        ]
    },
    {
        name: "Green Portfolio Financing",
        description: "Bundled financing solutions for portfolios of renewable energy assets",
        applicablePositionPairs: [
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.STORAGE_SUPPLIERS],
            [EcosystemPosition.PROJECT_SPONSORS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.ENERGY_OFFTAKERS, EcosystemPosition.PROJECT_DEVELOPERS]
        ]
    },
    {
        name: "Capital Raising & Equity Advisory",
        description: "Support for equity fundraising, IPOs, and strategic investor introductions",
        applicablePositionPairs: [
            [EcosystemPosition.PROJECT_SPONSORS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.PROJECT_SPONSORS, EcosystemPosition.RESEARCH_INNOVATION],
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.TECHNOLOGY_SUPPLIERS]
        ]
    },
    {
        name: "Venture Debt",
        description: "Growth financing for early-stage clean technology companies",
        applicablePositionPairs: [
            [EcosystemPosition.RESEARCH_INNOVATION, EcosystemPosition.PROJECT_SPONSORS],
            [EcosystemPosition.RESEARCH_INNOVATION, EcosystemPosition.TECHNOLOGY_SUPPLIERS],
            [EcosystemPosition.RESEARCH_INNOVATION, EcosystemPosition.PROJECT_DEVELOPERS]
        ]
    },
    {
        name: "PPA-Backed Financing",
        description: "Financing secured by long-term power purchase agreements",
        applicablePositionPairs: [
            [EcosystemPosition.ENERGY_OFFTAKERS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.GRID_OPERATORS],
            [EcosystemPosition.ENERGY_OFFTAKERS, EcosystemPosition.STORAGE_SUPPLIERS]
        ]
    },
    {
        name: "Infrastructure Finance",
        description: "Long-term financing for grid infrastructure and transmission projects",
        applicablePositionPairs: [
            [EcosystemPosition.GRID_OPERATORS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.GRID_OPERATORS, EcosystemPosition.TECHNOLOGY_SUPPLIERS],
            [EcosystemPosition.PROJECT_SPONSORS, EcosystemPosition.GRID_OPERATORS]
        ]
    },
    {
        name: "Blended Finance",
        description: "Structured financing combining public and private capital for development impact",
        applicablePositionPairs: [
            [EcosystemPosition.PROJECT_SPONSORS, EcosystemPosition.PROJECT_DEVELOPERS],
            [EcosystemPosition.PROJECT_DEVELOPERS, EcosystemPosition.ENERGY_OFFTAKERS],
            [EcosystemPosition.PROJECT_SPONSORS, EcosystemPosition.RESEARCH_INNOVATION]
        ]
    },
    {
        name: "Supply Chain Finance",
        description: "Financing solutions to optimize supply chain cash flow and payment terms",
        applicablePositionPairs: [
            [EcosystemPosition.TECHNOLOGY_SUPPLIERS, EcosystemPosition.EPC_CONTRACTORS],
            [EcosystemPosition.STORAGE_SUPPLIERS, EcosystemPosition.EPC_CONTRACTORS],
            [EcosystemPosition.TECHNOLOGY_SUPPLIERS, EcosystemPosition.PROJECT_DEVELOPERS]
        ]
    }
];

/**
 * Map of ecosystem position pairs to their applicable banking products
 * Key format: "POSITION1|POSITION2" (alphabetically sorted)
 */
export const POSITION_PAIR_TO_PRODUCTS = new Map<string, BankingProduct[]>();

// Build the position pair to products map
BANKING_PRODUCTS.forEach(product => {
    product.applicablePositionPairs.forEach(([pos1, pos2]) => {
        // Create bidirectional mappings (both orderings)
        const key1 = [pos1, pos2].sort().join('|');
        const key2 = [pos2, pos1].sort().join('|');

        if (!POSITION_PAIR_TO_PRODUCTS.has(key1)) {
            POSITION_PAIR_TO_PRODUCTS.set(key1, []);
        }
        POSITION_PAIR_TO_PRODUCTS.get(key1)!.push(product);

        // Ensure we don't duplicate if key1 === key2
        if (key1 !== key2) {
            if (!POSITION_PAIR_TO_PRODUCTS.has(key2)) {
                POSITION_PAIR_TO_PRODUCTS.set(key2, []);
            }
            POSITION_PAIR_TO_PRODUCTS.get(key2)!.push(product);
        }
    });
});

/**
 * Ecosystem position relationships defining complementary positions
 * Maps each position to positions it commonly works with
 */
export const POSITION_RELATIONSHIPS = new Map<EcosystemPosition, EcosystemPosition[]>([
    [EcosystemPosition.PROJECT_DEVELOPERS, [
        EcosystemPosition.TECHNOLOGY_SUPPLIERS,
        EcosystemPosition.EPC_CONTRACTORS,
        EcosystemPosition.STORAGE_SUPPLIERS,
        EcosystemPosition.PROJECT_SPONSORS,
        EcosystemPosition.ENERGY_OFFTAKERS,
        EcosystemPosition.GRID_OPERATORS
    ]],
    [EcosystemPosition.EPC_CONTRACTORS, [
        EcosystemPosition.TECHNOLOGY_SUPPLIERS,
        EcosystemPosition.PROJECT_DEVELOPERS,
        EcosystemPosition.STORAGE_SUPPLIERS
    ]],
    [EcosystemPosition.TECHNOLOGY_SUPPLIERS, [
        EcosystemPosition.PROJECT_DEVELOPERS,
        EcosystemPosition.EPC_CONTRACTORS,
        EcosystemPosition.STORAGE_SUPPLIERS,
        EcosystemPosition.GRID_OPERATORS,
        EcosystemPosition.RESEARCH_INNOVATION
    ]],
    [EcosystemPosition.STORAGE_SUPPLIERS, [
        EcosystemPosition.PROJECT_DEVELOPERS,
        EcosystemPosition.EPC_CONTRACTORS,
        EcosystemPosition.TECHNOLOGY_SUPPLIERS,
        EcosystemPosition.ENERGY_OFFTAKERS
    ]],
    [EcosystemPosition.GRID_OPERATORS, [
        EcosystemPosition.PROJECT_DEVELOPERS,
        EcosystemPosition.TECHNOLOGY_SUPPLIERS,
        EcosystemPosition.PROJECT_SPONSORS
    ]],
    [EcosystemPosition.PROJECT_SPONSORS, [
        EcosystemPosition.PROJECT_DEVELOPERS,
        EcosystemPosition.RESEARCH_INNOVATION,
        EcosystemPosition.GRID_OPERATORS
    ]],
    [EcosystemPosition.ENERGY_OFFTAKERS, [
        EcosystemPosition.PROJECT_DEVELOPERS,
        EcosystemPosition.STORAGE_SUPPLIERS
    ]],
    [EcosystemPosition.RESEARCH_INNOVATION, [
        EcosystemPosition.PROJECT_SPONSORS,
        EcosystemPosition.TECHNOLOGY_SUPPLIERS,
        EcosystemPosition.PROJECT_DEVELOPERS
    ]]
]);
