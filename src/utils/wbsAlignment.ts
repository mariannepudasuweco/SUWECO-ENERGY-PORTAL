export type WbsChecklistLikeItem = Record<string, any>;

export type WbsNodeLike = {
  id?: string;
  title: string;
  reqs?: string;
  totalReqs?: number;
  totalAcq?: number;
};

export const normalizeText = (value: any) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/pre-dev/g, "pre development")
    .replace(/pre-development/g, "pre development")
    .replace(/post-dev/g, "post development")
    .replace(/post-development/g, "post development")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function normalizePhaseName(value: any) {
  const normalized = normalizeText(value);

  if (!normalized) return "";

  if (
    normalized === "csp" ||
    normalized.includes("competitive selection process")
  ) {
    return "competitive selection process";
  }

  if (
    normalized.includes("post development") ||
    normalized.includes("postdevelopment")
  ) {
    return "post development";
  }

  if (
    normalized.includes("phase 1") ||
    normalized.includes("phase i") ||
    normalized.includes("pre dev phase 1") ||
    normalized.includes("pre development phase 1")
  ) {
    return "phase 1";
  }

  if (
    normalized.includes("phase 2") ||
    normalized.includes("phase ii") ||
    normalized.includes("pre dev phase 2") ||
    normalized.includes("pre development phase 2")
  ) {
    return "phase 2";
  }

  if (
    normalized.includes("phase 3") ||
    normalized.includes("phase iii") ||
    normalized.includes("pre dev phase 3") ||
    normalized.includes("pre development phase 3")
  ) {
    return "phase 3";
  }

  if (
    normalized.includes("phase 4") ||
    normalized.includes("phase iv") ||
    normalized === "development phase" ||
    normalized.includes("development phase 4")
  ) {
    return "phase 4";
  }

  return normalized;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "phase",
  "permit",
  "certificate",
  "clearance",
  "application",
  "requirements",
  "requirement",
]);

const getTokens = (value: string) =>
  normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const tokenCoverage = (source: string, target: string) => {
  const sourceTokens = getTokens(source);
  const targetTokens = new Set(getTokens(target));

  if (!sourceTokens.length || !targetTokens.size) return 0;

  return (
    sourceTokens.filter((token) => targetTokens.has(token)).length /
    sourceTokens.length
  );
};

export function getChecklistItemName(item: WbsChecklistLikeItem) {
  return String(
    item.item ||
      item.title ||
      item.name ||
      item.requirement_name ||
      item.subtask ||
      item.subsection ||
      item.section ||
      item.requirement ||
      item.id ||
      "Unnamed checklist item"
  );
}

function buildSearchableChecklistText(item: WbsChecklistLikeItem) {
  return [
    item.phase,
    item.category,
    item.requirement,
    item.section,
    item.subsection,
    item.item,
    item.title,
    item.name,
    item.task,
    item.task_name,
    item.status,
    item.remarks,
  ]
    .filter(Boolean)
    .join(" ");
}

export function getChecklistItemsForSequenceNode(
  nodeTitle: string,
  checklistItems: WbsChecklistLikeItem[]
) {
  const normalizedNodeTitle = normalizeText(nodeTitle);

  if (!normalizedNodeTitle) return [];

  const nodeTokens = getTokens(nodeTitle);

  const normalizedNodePhase = normalizePhaseName(nodeTitle);

  const isPhaseNode = [
    "competitive selection process",
    "phase 1",
    "phase 2",
    "phase 3",
    "phase 4",
    "post development",
  ].includes(normalizedNodePhase);

  return (checklistItems || []).filter((item) => {
    const phaseText = [item.phase, item.requirement, item.category]
      .filter(Boolean)
      .join(" ");

    const normalizedPhase = normalizePhaseName(phaseText);

    if (isPhaseNode && normalizedPhase === normalizedNodePhase) {
      return true;
    }

    const primaryFields = [
      item.item,
      item.title,
      item.name,
      item.task,
      item.task_name,
      item.subsection,
      item.section,
    ]
      .filter(Boolean)
      .join(" ");

    const normalizedPrimary = normalizeText(primaryFields);
    const normalizedChecklistText = normalizeText(
      buildSearchableChecklistText(item)
    );

    if (!normalizedChecklistText) return false;

    if (normalizedPrimary === normalizedNodeTitle) return true;

    const nodeIsMeaningful =
      normalizedNodeTitle.length >= 8 && nodeTokens.length >= 2;

    if (
      nodeIsMeaningful &&
      normalizedPrimary &&
      (normalizedPrimary.includes(normalizedNodeTitle) ||
        normalizedNodeTitle.includes(normalizedPrimary))
    ) {
      return true;
    }

    const coverageFromNode = tokenCoverage(nodeTitle, normalizedPrimary);
    const coverageFromChecklist = tokenCoverage(normalizedPrimary, nodeTitle);

    if (
      nodeTokens.length >= 2 &&
      coverageFromNode >= 0.75 &&
      coverageFromChecklist >= 0.45
    ) {
      return true;
    }

    return false;
  });
}

export function getFallbackRequirementCount(node: WbsNodeLike) {
  if (typeof node.totalReqs === "number") {
    return node.totalReqs;
  }

  if (node.reqs) {
    return node.reqs
      .split("<br/>")
      .map((req) => req.trim())
      .filter(Boolean).length;
  }

  return 0;
}

export function getActualRequirementCount(
  node: WbsNodeLike,
  checklistItems: WbsChecklistLikeItem[]
) {
  const matchedItems = getChecklistItemsForSequenceNode(
    node.title,
    checklistItems
  );

  if (matchedItems.length > 0) {
    return matchedItems.length;
  }

  return getFallbackRequirementCount(node);
}

export function isChecklistItemCompleted(statusOrRemarks: any) {
  const normalized = String(statusOrRemarks || "").toLowerCase();

  return normalized.includes("done") || normalized.includes("completed");
}

export function isChecklistRowCompleted(item: WbsChecklistLikeItem) {
  return (
    Boolean(item.checked) ||
    isChecklistItemCompleted(`${item.status || ""} ${item.remarks || ""}`)
  );
}

export function getCompletedChecklistCount(
  nodeTitle: string,
  checklistItems: WbsChecklistLikeItem[]
) {
  const matchedItems = getChecklistItemsForSequenceNode(
    nodeTitle,
    checklistItems
  );

  return matchedItems.filter(isChecklistRowCompleted).length;
}