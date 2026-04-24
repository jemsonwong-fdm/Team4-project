/**
 * Core data models for Cross-Ecosystem Opportunity Finder
 */

// Ecosystem Position Enum
export enum EcosystemPosition {
    PROJECT_DEVELOPERS = "Project Developers",
    EPC_CONTRACTORS = "EPC Contractors",
    TECHNOLOGY_SUPPLIERS = "Technology & Equipment Suppliers",
    STORAGE_SUPPLIERS = "Storage Suppliers",
    GRID_OPERATORS = "Grid & Transmission Operators",
    PROJECT_SPONSORS = "Project Sponsors & Investors",
    ENERGY_OFFTAKERS = "Energy Off-takers",
    RESEARCH_INNOVATION = "Research, Innovation & Early-stage Companies"
}

// Client Model
export interface Client {
    id: string;
    companyName: string;
    ecosystemPositions: EcosystemPosition[];
    geography: string;
    revenue: number;
    esgAlignment: string;
    rmId: string;
    createdAt: Date;
    updatedAt: Date;
}

// Banking Product Model
export interface BankingProduct {
    name: string;
    description: string;
    applicablePositionPairs: [EcosystemPosition, EcosystemPosition][];
}

// Opportunity Model
export interface Opportunity {
    id: string;
    title: string;
    client1: Client;
    client2: Client;
    rm1Id: string;
    rm2Id: string;
    trigger: string;
    suggestedBankingProducts: BankingProduct[];
    matchScore: number;
    reasoning: string;
    confidence: 'high' | 'medium' | 'low';
    createdAt: Date;
    flaggedForReview: boolean;
}

// Invitation Model
export interface Invitation {
    id: string;
    opportunityId: string;
    senderRmId: string;
    recipientRmId: string;
    status: 'pending' | 'accepted' | 'declined';
    sentAt: Date;
    respondedAt?: Date;
}

// Audit Log Model
export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    rmId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: Record<string, any>;
}

// LLM Interaction Log Model
export interface LLMInteractionLog {
    id: string;
    timestamp: Date;
    promptType: string;
    systemPrompt: string;
    userPrompt: string;
    response: string;
    model: string;
    tokensUsed: number;
    relatedOpportunityId?: string;
}

// Supporting Types
export interface OpportunityCandidate {
    client1: Client;
    client2: Client;
    ecosystemPositionPair: [EcosystemPosition, EcosystemPosition];
}

export interface MatchResult {
    score: number; // 0-100
    reasoning: string;
    suggestedBankingProducts: BankingProduct[];
    confidence: 'high' | 'medium' | 'low';
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface RM {
    id: string;
    name: string;
    segment: string;
}

// Export validation functions
export {
    validateClient,
    validateOpportunity,
    validateInvitation,
    validateAuditLogEntry,
    validateLLMInteractionLog
} from './validation';
