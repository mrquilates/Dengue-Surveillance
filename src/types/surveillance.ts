/**
 * Epidemiological Intelligence & Early Warning System (EIEWS)
 * Data Definitions and Domain Types
 */

export type AgeGroup =
  | '<1'
  | '1-4'
  | '5-9'
  | '10-14'
  | '15-19'
  | '20-29'
  | '30-39'
  | '40-49'
  | '50-59'
  | '60-69'
  | '≥70'
  | 'Unknown';

export const STANDARD_AGE_GROUPS: AgeGroup[] = [
  '<1',
  '1-4',
  '5-9',
  '10-14',
  '15-19',
  '20-29',
  '30-39',
  '40-49',
  '50-59',
  '60-69',
  '≥70',
];

export type CaseClassification = 'Suspect' | 'Probable' | 'Confirmed';
export type OutcomeType = 'Alive' | 'Recovered' | 'Died' | 'Unknown';
export type BinaryStatus = 'Y' | 'N' | 'Unknown';
export type SexType = 'Male' | 'Female' | 'M' | 'F' | 'Unknown';

export type InterventionCategory =
  | 'POLICY'
  | 'VECTOR_CONTROL'
  | 'CLINICAL'
  | 'REPORTING_MILESTONE'
  | 'COMMUNITY';

export interface PolicyInterventionMarker {
  id: string;
  mw: number;
  date?: string;
  title: string;
  category: InterventionCategory;
  description: string;
  impactNote?: string;
  isCustom?: boolean;
}

export type StatisticalSignificanceTier =
  | 'SURGE_CRITICAL'
  | 'SURGE_SIGNIFICANT'
  | 'INCREASE_MODERATE'
  | 'STABLE'
  | 'DECLINE_MODERATE'
  | 'DECLINE_SIGNIFICANT';

export interface ConfidenceIntervalItem {
  id: string;
  name: string;
  unitType: 'MUNICIPALITY' | 'BARANGAY' | 'AGE_GROUP';
  parentLocation?: string;
  population: number;
  previousCases: number;
  currentCases: number;
  absoluteChange: number;
  percentChange: number;
  previousIncidencePer100k: number;
  currentIncidencePer100k: number;
  zScore: number;
  pValue: number;
  significanceTier: StatisticalSignificanceTier;
  isStatisticallySignificant: boolean;
  interpretation: string;
}

export interface WoWComparisonItem extends ConfidenceIntervalItem {}

export interface ParetoDefectItem {
  id: string;
  category: string;
  dimension: 'Completeness' | 'Deduplication' | 'Validity' | 'Timeliness' | 'Consistency';
  count: number;
  percentage: number;
  cumulativeCount: number;
  cumulativePercentage: number;
  isVitalFew: boolean;
  priorityRank: number;
  potentialDqiGain: number;
  rootCause: string;
  recommendation: string;
  responsibleStakeholder: string;
}

export interface SurveillanceRecord {
  id: string;
  diseaseId: string;
  epiId: string;
  age: number | null;
  ageGroup: AgeGroup;
  sex: SexType;
  psgcMunicipality: string;
  municipality: string;
  psgcBarangay: string;
  barangay: string;
  dateOnset: string; // ISO YYYY-MM-DD
  morbidityWeek: number;
  morbidityYear: number;
  dateConsult: string | null;
  consulted: BinaryStatus;
  admitted: BinaryStatus;
  caseClassification: CaseClassification;
  clinicalClassification: string;
  outcome: OutcomeType;
  isValid: boolean;
  validationFlags: string[];
  isDuplicate: boolean;
  duplicateOfId?: string;
  duplicateConfidence?: number;
  duplicateReason?: string;
  rawRowIndex: number;
  dateAdmit?: string | null;
  nameOfDru?: string;
  placeConsulted?: string;
  timelapseOnsetEncode?: number | null;
  timelapseEncodeValidated?: number | null;
  labId?: string;
  labResult?: string;
  labTestType?: string;
}

export interface IngestionBottleneckAlert {
  id: string;
  facility: string;
  type: 'ENCODE_TIMELAPSE_BARRIER' | 'LAB_CONFIRMATION_GAP' | 'PSGC_HIERARCHY_DEFECT' | 'DUPLICATE_SPIKE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  detectedAt: string;
  affectedCount: number;
  description: string;
  rootCause: string;
  correctiveAction: string;
  status: 'DETECTED' | 'RESOLVING' | 'RESOLVED' | 'AUTO_REMEDIATED';
  resolutionTimestamp?: string;
}

export interface IngestionRemediationLog {
  id: string;
  timestamp: string;
  action: string;
  targetFacility: string;
  recordsAffected: number;
  status: 'SUCCESS' | 'EXECUTED';
  detail: string;
}

export interface SystemHealthCheckResult {
  id: string;
  module: string;
  name: string;
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  latencyMs: number;
  lastChecked: string;
  details: string;
  autoFixAvailable: boolean;
}

export interface AuditLogItem {
  id: string;
  rowIndex: number;
  field: string;
  originalValue: string;
  cleanedValue: string;
  action: 'Standardized' | 'Normalized' | 'Imputed' | 'Flagged' | 'Deduplicated';
  reason: string;
  timestamp: string;
}

export interface DuplicateInspectionItem {
  primaryId: string;
  duplicateId: string;
  primaryEpiId: string;
  duplicateEpiId: string;
  matchType: 'Primary (EPIID)' | 'Secondary (Disease ID)' | 'Fuzzy (Demographics & Spatiotemporal)';
  confidence: number;
  fieldsCompared: {
    age: [number | null, number | null];
    sex: [string, string];
    municipality: [string, string];
    barangay: [string, string];
    dateOnset: [string, string];
  };
}

export interface ValidationReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicatesRemoved: number;
  suspectedDuplicatesCount: number;
  overallDQI: number; // 0-100 Data Quality Index
  completenessScore: number;
  timelinessScore: number;
  duplicateScore: number;
  validityScore: number;
  consistencyScore: number;
  missingFieldCounts: Record<string, { count: number; percentage: number }>;
  detectedColumns: string[];
  missingStandardColumns: string[];
  unexpectedColumns: string[];
  duplicatesList: DuplicateInspectionItem[];
  invalidDateCount: number;
  auditLogs: AuditLogItem[];
  schemaMatchConfidence: number;
  piiSanitized?: boolean;
  strippedPiiColumns?: string[];
  dohCaseClassificationBreakdown?: {
    suspect: number;
    probable: number;
    confirmed: number;
    reclassifiedCount: number;
  };
  pipelinePerformance?: {
    elapsedMs: number;
    throughputRecordsSec: number;
    optimizationStatus: string;
    deadLetterCount: number;
    stages: Array<{ name: string; durationMs: number }>;
  };
  jurisdictionFilter?: {
    targetMunicipality: string; // 'Argao'
    targetProvince: string; // 'Cebu'
    targetRegion: string; // 'Central Visayas (Region VII)'
    targetPSGC: string; // '072205000'
    totalIngested: number;
    acceptedCount: number;
    rejectedCount: number;
    rejectedMunicipalities: string[];
    rejectedRows: Array<{
      rowNumber: number;
      epiId: string;
      municipality: string;
      barangay: string;
      diseaseId: string;
      reason: string;
    }>;
  };
}

export interface EpidemiologicalMetrics {
  totalCases: number;
  newCasesLatestMW: number;
  previousMWCases: number;
  velocityPctChange: number;
  confirmedCases: number;
  suspectCases: number;
  probableCases: number;
  deaths: number;
  recoveries: number;
  activeCases: number;
  cfr: number; // Case Fatality Rate %
  hospitalizationRate: number; // Admission %
  hospitalizedCount: number;
  attackRatePer100k: number;
  totalPopulation: number;
  overallIncidencePer100k: number;
  reportingDelayMeanDays: number;
  reportingDelayMedianDays: number;
  onsetToConsultationDaysMean: number;
  onsetToConsultationDaysMedian: number;
  onsetToAdmissionDaysMean: number;
  onsetToAdmissionDaysMedian: number;
  latestMorbidityWeek: number;
  latestMorbidityYear: number;
}

export type AlertLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertCategory = 'OUTBREAK_SIGNAL' | 'QUALITY_ALERT' | 'SURVEILLANCE_ALERT';

export interface SurveillanceAlert {
  id: string;
  category: AlertCategory;
  level: AlertLevel;
  title: string;
  description: string;
  location: string;
  justification: string;
  metricTriggered: string;
  actionRequired: string;
  timestamp: string;
}

export interface EndemicChannelWeek {
  mw: number;
  year: number;
  currentCases: number;
  historicalMean: number;
  historicalSD: number;
  alertThreshold: number; // Mean + 1 SD
  epidemicThreshold: number; // Mean + 2 SD
  status: 'Normal' | 'Alert' | 'Epidemic';
}

export interface GeoMunicipalitySummary {
  psgc: string;
  name: string;
  cases: number;
  deaths: number;
  cfr: number;
  population: number;
  incidencePer100k: number;
  pctContribution: number;
  status: 'Epidemic' | 'Alert' | 'Normal';
  barangaysCount: number;
  topBarangay: string;
}

export interface GeoBarangaySummary {
  psgc: string;
  name: string;
  municipality: string;
  cases: number;
  deaths: number;
  cfr: number;
  population: number;
  incidencePer100k: number;
  isHotspot: boolean;
  hotspotType: 'Emerging' | 'Persistent' | 'Controlled' | 'Sporadic';
}

export interface DemographicStats {
  meanAge: number;
  medianAge: number;
  minAge: number;
  maxAge: number;
  iqr: number;
  ageGroups: Array<{
    group: AgeGroup;
    total: number;
    male: number;
    female: number;
    hospitalized: number;
    deaths: number;
    cfr: number;
    maleHospitalized: number;
    femaleHospitalized: number;
    maleDeaths: number;
    femaleDeaths: number;
  }>;
  sexDistribution: {
    male: number;
    female: number;
    unknown: number;
    malePct: number;
    femalePct: number;
  };
}

export interface FilterState {
  disease: string;
  dateStart: string;
  dateEnd: string;
  morbidityWeekRange: [number, number];
  municipality: string;
  barangay: string;
  sex: string;
  ageGroup: string;
  caseClassification: string;
  outcome: string;
  searchQuery: string;
}

export interface HistoricalBatch {
  id: string;
  filename: string;
  uploadDate: string;
  recordCount: number;
  morbidityWeek: number;
  morbidityYear: number;
  dqi: number;
  cleanedRecords: SurveillanceRecord[];
}

// ==========================================
// Multi-Stream Surveillance Models (Argao EWARS Framework)
// Stream 1: Epidemiological Stream (PIDSR + NS1 RDT Days 1-5 Triage)
// Stream 2: Entomological Stream (Physical Inspections: BI, HI, Breeding Sites - No IoT Ovitraps)
// Stream 3: Meteorological Stream (Rainfall, Relative Humidity, Temperature)
// ==========================================

export type BreedingSiteCategory =
  | 'Water Storage Drums'
  | 'Discarded Tires'
  | 'Plant Axils & Bromeliads'
  | 'Unsealed Cisterns'
  | 'Plastic Vessels & Bottles'
  | 'Roof Gutters';

export interface EntomologicalInspectionRecord {
  id: string;
  barangay: string;
  morbidityWeek: number;
  inspectedHouses: number;
  positiveHouses: number;
  inspectedContainers: number;
  positiveContainers: number;
  breteauIndex: number; // (positive containers / 100 inspected houses) - Alert Threshold >= 20%
  houseIndex: number; // (positive houses / inspected houses) * 100 - Alert Threshold >= 5%
  containerReinspectionRate: number; // % follow-up recheck within 7 days (Target >= 85%)
  predominantBreedingSite: BreedingSiteCategory;
  larvalPositiveSitesCount: number;
  larvicideApplied: boolean;
  environmentalSanitationDone: boolean;
  riskStatus: 'Safe' | 'Warning' | 'High-Risk';
}

export interface MeteorologicalRecord {
  morbidityWeek: number;
  year: number;
  rainfallMm: number; // Weekly cumulative rainfall in mm
  relativeHumidityPct: number; // Mean relative humidity %
  temperatureCelsius: number; // Mean ambient temperature °C
  climateSuitabilityIndex: number; // 0 - 100 index for vector propagation
  historicalRainfallAvgMm: number;
  rainfallAnomalyPct: number;
}

export interface MultiStreamDataPoint {
  morbidityWeek: number;
  label: string;
  // Stream 1: Epidemiological
  clinicalCases: number;
  probableCases: number;
  confirmedCases: number;
  ns1EligibleCases: number;
  ns1TestedWithin5Days: number;
  ns1CompliancePct: number; // DOH AO 2016-0043 Days 1-5 adherence
  // Stream 2: Entomological (Physical Inspections)
  breteauIndex: number; // BI (<20% is safe)
  houseIndex: number; // HI (<5% is safe)
  activeBreedingSites: number;
  reinspectionRatePct: number; // Target >= 85%
  // Stream 3: Meteorological
  rainfallMm: number;
  relativeHumidityPct: number;
  temperatureCelsius: number;
  // Correlation & Risk
  multiStreamRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface EnvironmentalHazardAssessment {
  currentRainfallMm: number;
  rainfallTrend: 'Increasing' | 'Stable' | 'Decreasing';
  meanRelativeHumidityPct: number;
  meanTemperatureCelsius: number;
  climateRiskTier: 'Low' | 'Moderate' | 'Favorable' | 'Optimal';
  twoWeekLagRainfallMm: number;
  floodingVulnerabilityScore: number; // 0 - 100
  drainageBlockageRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  postCycloneVulnerabilityScore: number; // e.g. post-cyclone breeding pockets
  environmentalSanitationIndex: number; // 0 - 100
  highRiskZones: Array<{
    zone: string;
    hazardType: 'Stagnant Drainage' | 'Uncollected Solid Waste' | 'Construction Pooling' | 'Low-Lying Waterlogging';
    severity: 'Moderate' | 'High' | 'Critical';
    actionRequired: string;
  }>;
}

export interface LarvalEntomologicalReport {
  averageBreteauIndex: number;
  averageHouseIndex: number;
  averageContainerIndex: number;
  biAlertThresholdExceeded: boolean; // BI >= 20%
  hiAlertThresholdExceeded: boolean; // HI >= 5%
  totalInspectedHouses: number;
  totalPositiveContainers: number;
  overallReinspectionRate: number; // Target >= 85%
  kdrPyrethroidResistanceDetected: boolean; // V1016I, F1534C mutations
  thermalFoggingRestrictionNote: string;
  topBreedingSites: Array<{ category: BreedingSiteCategory; count: number; pct: number }>;
  barangayIndices: EntomologicalInspectionRecord[];
}

export interface EpidemiologicalPIDSRReport {
  totalCases: number;
  suspectedCases: number;
  probableCases: number;
  confirmedCases: number;
  ns1TestedWithin5DaysPct: number;
  reportingDelayDays: number;
  reportingFacilities: Array<{
    name: string;
    type: 'RHU' | 'Hospital' | 'BHC';
    casesReported: number;
    timelyReportingPct: number;
  }>;
}

export interface MultiStreamSummary {
  latestMorbidityWeek: number;
  // Pillar 1: Surveillance - Epidemiological analysis report from online PIDSR system
  surveillance: EpidemiologicalPIDSRReport;
  // Pillar 2: Environment - Hazard Identification and risk assessment report (HIRA)
  environment: EnvironmentalHazardAssessment;
  // Pillar 3: Entomological Confirmation - Larval entomological report
  entomological: LarvalEntomologicalReport;
  // Triangulation Synthesis
  triangulationStatus: {
    surveillanceTriggered: boolean;
    environmentHazardTriggered: boolean;
    larvalConfirmationTriggered: boolean;
    triangulationConfidenceScore: number; // 0 - 100%
    prePeakLeadTimeWeeks: number; // 3 - 5 weeks
    combinedRiskScore: number; // 0 - 100
    overallAlertTier: 'Green' | 'Yellow' | 'Red';
    actionPriority: 'Routine Sanitation' | 'Targeted Pre-Positioning' | 'Emergency Incident Command';
  };
}

// ==========================================
// Building Block 3: The Intelligence Engine Types
// 1. Ingestion (Data Collection)
// 2. Processing (Risk Assessment)
// 3. Output (Response Monitoring - 3-Tier Alert Matrix)
// 4. Networks for Collaboration (M&E Audit Loop & Model Refinement)
// ==========================================

export type IntelligenceEngineStage = 'overview' | 'ingestion' | 'processing' | 'visualize' | 'output' | 'collaboration';

export interface AlertTierProtocol {
  tier: 'Green' | 'Yellow' | 'Red';
  name: string;
  leadTime: string;
  gamCondition: string;
  entoCondition: string;
  clinicalCondition: string;
  isCurrentActive: boolean;
  directives: {
    governance: string[];
    clinicalFacilities: string[];
    vectorControl: string[];
    communityAndSchools: string[];
  };
}

export interface SurveillanceAuditMetric {
  id: string;
  name: string;
  category: 'Process' | 'Impact' | 'Economic';
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'Met' | 'Warning' | 'Breached';
  description: string;
  policyStandard: string;
}

export interface InterLGUIntelligenceFeed {
  municipality: string;
  distanceKm: number;
  currentCasesMW: number;
  pctChangeWoW: number;
  alertStatus: 'Normal' | 'Alert' | 'Epidemic';
  crossBorderRisk: 'Low' | 'Moderate' | 'High';
  lastSynchronized: string;
}

// ==========================================
// Stream 1 PIDSR Webhook & Extraction Types
// ==========================================

export interface PIDSRWebhookConfig {
  endpoint: string; // 'https://pidsr.doh.gov.ph/pidsr/data_extraction'
  secretKey: string;
  hmacSignatureVerified: boolean;
  syncMode: 'automated_push' | 'scheduled_pull' | 'manual_trigger';
  syncIntervalHours: number;
  lastSyncTimestamp: string | null;
  lastSyncStatus: 'IDLE' | 'SUCCESS' | 'SYNCING' | 'ERROR';
  totalExtractedRecords: number;
  autoPurgePII: boolean;
}

export interface PIDSRWebhookPayload {
  extractionId: string;
  sourceUrl: string;
  timestamp: string;
  jurisdiction: {
    region: string;
    province: string;
    municipality: string;
    psgc: string;
  };
  filterParams: {
    disease: string;
    morbidityYear: number;
    morbidityWeekRange: [number, number];
  };
  totalCasesExtracted: number;
  signature: string;
  cases: Record<string, any>[];
}

// ==========================================
// Stream 1 Agent Skills Types
// ==========================================

export interface DataManagementSkillsReport {
  deduplication: {
    exactDuplicateCount: number;
    fuzzyPhoneticDuplicateCount: number;
    uniqueVerifiedCount: number;
    dedupAccuracyPct: number;
  };
  piiSanitization: {
    status: 'ACTIVE_ZERO_PII';
    law: 'RA 10173 (Data Privacy Act of 2012)';
    strippedFields: string[];
    tokenizedIdentifiersCount: number;
    retentionViolationCount: 0;
  };
  schemaHarmonization: {
    detectedStandard: string;
    confidenceScore: number;
    mappedFieldsCount: number;
    unmappedFieldsCount: number;
  };
  stagingAndBackup: {
    stagingState: 'ISOLATED' | 'COMMITTED';
    provenanceHash: string;
    lastBackupTimestamp: string;
    snapshotsCount: number;
  };
}

export interface DataAnalyticsSkillsReport {
  ingestionAberrations: {
    outlierBarangays: {
      barangay: string;
      caseCount: number;
      expectedMean: number;
      zScore: number;
      sigmaLevel: string;
    }[];
    threeSigmaAlertCount: number;
  };
  diagnosticCompleteness: {
    ns1Days1To5CompliancePct: number;
    feverOnsetRecordedPct: number;
    warningSignsDocumentedPct: number;
    labConfirmationRatePct: number;
  };
  reportingDelayDistribution: {
    onsetToConsultMeanDays: number;
    onsetToConsultMedianDays: number;
    consultToMesuMeanHours: number;
    targetSlaCompliancePct: number;
  };
  caseClassificationMix: {
    suspectPct: number;
    probablePct: number;
    confirmedPct: number;
    pediatricProportionPct: number;
    severeProportionPct: number;
  };
}

// ==========================================
// Isidro C. Kintanar Memorial Hospital (DICKMH)
// Bed Capacity & Surge Surveillance Types
// ==========================================

export type HospitalSurgeAlertLevel =
  | 'NORMAL' // < 70% Bed Occupancy Rate
  | 'WARNING' // 70% - 84% Bed Occupancy Rate
  | 'CRITICAL_SURGE' // 85% - 99% Bed Occupancy Rate
  | 'DISASTER_OVERFLOW'; // >= 100% Code Red Hospital Surge

export interface HospitalWardCapacity {
  wardName: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPct: number;
  status: 'Normal' | 'Warning' | 'Full' | 'Overflow';
}

export interface HospitalBedCapacityReport {
  id: string;
  facilityName: string; // 'Dr. Isidro C. Kintanar Memorial Hospital'
  facilityType: 'Level 1 District Hospital' | 'Provincial Hospital' | 'Infirmary';
  psgc: string; // '072205000'
  municipality: string; // 'Argao'
  province: string; // 'Cebu'
  location: string; // 'Barangay Bogo / Poblacion, Argao, Cebu'
  authorizedBedCapacity: number; // 25 licensed beds (DOH baseline)
  operationalBedCapacity: number; // 50 operational beds in expanded facility (surge up to 100)
  totalInpatients: number;
  totalAvailableBeds: number;
  overallBOR: number; // Bed Occupancy Rate %
  surgeAlertLevel: HospitalSurgeAlertLevel;
  surgeStatusText: string;
  
  // Specific critical care & infectious disease wards
  dengueIsolationBeds: HospitalWardCapacity;
  pediatricWardBeds: HospitalWardCapacity;
  generalMedicalBeds: HospitalWardCapacity;
  icuHighDependencyBeds: HospitalWardCapacity;
  
  // Clinical Operations & Resource Readiness
  erTriageBacklogCount: number;
  erFastLaneActive: boolean;
  microhematocritTurnaroundMinutes: number;
  mechanicalVentilatorsAvailable: number;
  mechanicalVentilatorsTotal: number;
  ivFluidSupplyDaysRemaining: number;
  ns1RdtStockAvailable: number;
  
  // Projections & Cross-Surveillance Triangulation
  daysToBedCapacityExhaustion: number; // Calculated using active case velocity
  referralPressureIndex: number; // 0 - 100 index for secondary transfers to Carcar / VSMMC
  
  // Extraction & Provenance Metadata
  extractionSource: 'FACEBOOK_PUBLIC_POST' | 'HIS_REST_WEBHOOK' | 'MANUAL_BULLETIN_AUDIT';
  sourceUrl: string; // 'https://www.facebook.com/share/p/19jG4RfAoc/'
  sourcePostId?: string; // '19jG4RfAoc'
  postTimestamp: string;
  extractedAt: string;
  verifiedBySignature: string;
  piiSanitized: boolean;
  validationStatus: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  bulletinExcerpt?: string;
}


