/**
 * Ecosystem Service
 * Manages ecosystem position relationships and banking product mappings
 */

import { EcosystemPosition, BankingProduct } from '../models';
import {
    BANKING_PRODUCTS,
    POSITION_PAIR_TO_PRODUCTS,
    POSITION_RELATIONSHIPS
} from '../data/bankingProducts';

/**
 * Service for managing ecosystem position relationships and banking products
 */
export class EcosystemService {
    /**
     * Get complementary ecosystem positions for a given position
     * @param position - The ecosystem position to find relationships for
     * @returns Array of complementary ecosystem positions
     */
    getPositionRelationships(position: EcosystemPosition): EcosystemPosition[] {
        return POSITION_RELATIONSHIPS.get(position) || [];
    }

    /**
     * Get banking products applicable to a pair of ecosystem positions
     * @param pos1 - First ecosystem position
     * @param pos2 - Second ecosystem position
     * @returns Array of applicable banking products
     */
    getBankingProductsForPair(pos1: EcosystemPosition, pos2: EcosystemPosition): BankingProduct[] {
        // Create key by sorting positions alphabetically for consistent lookup
        const key = [pos1, pos2].sort().join('|');
        return POSITION_PAIR_TO_PRODUCTS.get(key) || [];
    }

    /**
     * Check if two ecosystem positions are complementary
     * @param pos1 - First ecosystem position
     * @param pos2 - Second ecosystem position
     * @returns True if positions are complementary, false otherwise
     */
    arePositionsComplementary(pos1: EcosystemPosition, pos2: EcosystemPosition): boolean {
        const relationships = this.getPositionRelationships(pos1);
        return relationships.includes(pos2);
    }

    /**
     * Get all banking products
     * @returns Array of all available banking products
     */
    getAllBankingProducts(): BankingProduct[] {
        return [...BANKING_PRODUCTS];
    }

    /**
     * Get all ecosystem positions
     * @returns Array of all ecosystem positions
     */
    getAllPositions(): EcosystemPosition[] {
        return Object.values(EcosystemPosition);
    }

    /**
     * Find banking products by name (case-insensitive partial match)
     * @param searchTerm - Search term to match against product names
     * @returns Array of matching banking products
     */
    findBankingProductsByName(searchTerm: string): BankingProduct[] {
        const lowerSearch = searchTerm.toLowerCase();
        return BANKING_PRODUCTS.filter(product =>
            product.name.toLowerCase().includes(lowerSearch)
        );
    }

    /**
     * Get all position pairs that have banking products available
     * @returns Array of position pairs with at least one banking product
     */
    getAvailablePositionPairs(): [EcosystemPosition, EcosystemPosition][] {
        const pairs: [EcosystemPosition, EcosystemPosition][] = [];
        const seen = new Set<string>();

        BANKING_PRODUCTS.forEach(product => {
            product.applicablePositionPairs.forEach(([pos1, pos2]) => {
                const key = [pos1, pos2].sort().join('|');
                if (!seen.has(key)) {
                    seen.add(key);
                    pairs.push([pos1, pos2]);
                }
            });
        });

        return pairs;
    }
}

// Export singleton instance
export const ecosystemService = new EcosystemService();
