/**
 * Ecosystem Position Icons
 * Maps ecosystem positions to lucide-react icons
 */

import {
    Lightbulb,
    Hammer,
    Cpu,
    Battery,
    Zap,
    TrendingUp,
    Building2,
    FlaskConical,
    type LucideIcon
} from "lucide-react";
import { EcosystemPosition } from "@/lib/models";

export const ecosystemIcons: Record<EcosystemPosition, LucideIcon> = {
    [EcosystemPosition.PROJECT_DEVELOPERS]: Lightbulb,
    [EcosystemPosition.EPC_CONTRACTORS]: Hammer,
    [EcosystemPosition.TECHNOLOGY_SUPPLIERS]: Cpu,
    [EcosystemPosition.STORAGE_SUPPLIERS]: Battery,
    [EcosystemPosition.GRID_OPERATORS]: Zap,
    [EcosystemPosition.PROJECT_SPONSORS]: TrendingUp,
    [EcosystemPosition.ENERGY_OFFTAKERS]: Building2,
    [EcosystemPosition.RESEARCH_INNOVATION]: FlaskConical,
};

/**
 * Get icon component for an ecosystem position
 */
export function getEcosystemIcon(position: EcosystemPosition): LucideIcon {
    return ecosystemIcons[position] || Building2;
}
