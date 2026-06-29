export type WbsChecklistLikeItem = Record<string, any>;

export type WbsNodeLike = {
  id?: string;
  title: string;
  reqs?: string;
  totalReqs?: number;
  totalAcq?: number;
};

export type ChecklistStatusKey =
  | "completed"
  | "inProgress"
  | "pending"
  | "notStarted"
  | "delayed";

export type ChecklistStatusCounts = Record<ChecklistStatusKey, number> & {
  total: number;
};

export type ChecklistNumberingInfo = {
  phaseCode: string;
  motherPermitCode: string;
  parentTaskCode: string;
  itemCode: string;
  phaseIndex: number;
  motherPermitIndex: number;
  parentTaskIndex: number;
  requirementIndex: number;
};

export type ChecklistHierarchyTask = {
  name: string;
  items: WbsChecklistLikeItem[];
  counts: ChecklistStatusCounts;
};

export type ChecklistHierarchyMotherPermit = {
  name: string;
  items: WbsChecklistLikeItem[];
  counts: ChecklistStatusCounts;
  tasks: Record<string, ChecklistHierarchyTask>;
};

export type ChecklistHierarchyPhase = {
  name: string;
  items: WbsChecklistLikeItem[];
  counts: ChecklistStatusCounts;
  motherPermits: Record<string, ChecklistHierarchyMotherPermit>;
};

export type ChecklistHierarchy = {
  phases: Record<string, ChecklistHierarchyPhase>;
  phaseOrder: string[];
  totals: ChecklistStatusCounts & {
    phases: number;
    motherPermits: number;
    parentTasks: number;
  };
};

export type WbsAlignmentIssue = {
  nodeId?: string;
  nodeTitle: string;
  expectedPhase?: string;
  actualPhase?: string;
  actualCount: number;
  completedCount: number;
  configuredCount: number;
  status:
    | "Aligned"
    | "Missing Requirements"
    | "Count Mismatch"
    | "Phase Mismatch"
    | "Completed Count Mismatch";
  message: string;
};

const DEFAULT_PHASE_ORDER = [
  "COMPETITIVE SELECTION PROCESS",
  "PRE-DEV PHASE 1",
  "PRE-DEVELOPMENT PHASE 1",
  "PRE-DEV PHASE 2",
  "PRE-DEVELOPMENT PHASE 2",
  "PRE-DEV PHASE 3",
  "PRE-DEVELOPMENT PHASE 3",
  "DEVELOPMENT PHASE",
  "POST DEVELOPMENT PHASE",
  "POST-DEVELOPMENT PHASE",
  "OTHERS",
];

const emptyCounts = (): ChecklistStatusCounts => ({
  total: 0,
  completed: 0,
  inProgress: 0,
  pending: 0,
  notStarted: 0,
  delayed: 0,
});

const cloneCounts = (counts: ChecklistStatusCounts): ChecklistStatusCounts => ({
  total: counts.total,
  completed: counts.completed,
  inProgress: counts.inProgress,
  pending: counts.pending,
  notStarted: counts.notStarted,
  delayed: counts.delayed,
});

const addCounts = (
  target: ChecklistStatusCounts,
  source: ChecklistStatusCounts
) => {
  target.total += source.total;
  target.completed += source.completed;
  target.inProgress += source.inProgress;
  target.pending += source.pending;
  target.notStarted += source.notStarted;
  target.delayed += source.delayed;
};

export const normalizeText = (value: any) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/pre[-\s]?dev/g, "pre development")
    .replace(/pre-development/g, "pre development")
    .replace(/post[-\s]?dev/g, "post development")
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

  if (normalized === "others" || normalized.includes("other")) {
    return "others";
  }

  return normalized;
}

export function getChecklistPhaseName(item: WbsChecklistLikeItem) {
  return String(
    item.requirement || item.phase || item.phase_name || "Uncategorized Phase"
  ).trim();
}

export function getChecklistMotherPermitName(item: WbsChecklistLikeItem) {
  return String(
    item.section || item.category || item.mother_permit || "General Category"
  ).trim();
}

export function getChecklistParentTaskName(item: WbsChecklistLikeItem) {
  return String(
    item.subsection || item.task || item.parent_task || "General Task"
  ).trim();
}

export function getChecklistItemName(item: WbsChecklistLikeItem) {
  return String(
    item.item ||
      item.title ||
      item.name ||
      item.requirement_name ||
      item.subtask ||
      item.description ||
      item.id ||
      "Unnamed checklist item"
  );
}

export function isActualRequirementItem(item: WbsChecklistLikeItem) {
  if (!item) return false;

  const explicitType = normalizeText(
    item.row_type || item.type || item.item_type || item.kind
  );

  if (
    item.is_header === true ||
    item.is_phase_header === true ||
    item.is_parent_header === true ||
    explicitType === "header" ||
    explicitType === "phase" ||
    explicitType === "section" ||
    explicitType === "category" ||
    explicitType === "mother permit" ||
    explicitType === "parent task"
  ) {
    return false;
  }

  return getChecklistItemName(item).trim().length > 0;
}

export function normalizeChecklistStatus(item: WbsChecklistLikeItem) {
  const text = normalizeText(
    `${item?.status || ""} ${item?.remarks || ""} ${item?.checked ? "completed" : ""}`
  );

  if (item?.checked === true || text.includes("done") || text.includes("completed")) {
    return "completed" as ChecklistStatusKey;
  }

  if (
    text.includes("delay") ||
    text.includes("overdue") ||
    text.includes("not met") ||
    text.includes("failed")
  ) {
    return "delayed" as ChecklistStatusKey;
  }

  if (
    text.includes("ongoing") ||
    text.includes("progress") ||
    text.includes("in progress") ||
    text.includes("processing")
  ) {
    return "inProgress" as ChecklistStatusKey;
  }

  if (
    text.includes("pending") ||
    text.includes("authorized") ||
    text.includes("for approval") ||
    text.includes("for release") ||
    text.includes("waiting")
  ) {
    return "pending" as ChecklistStatusKey;
  }

  return "notStarted" as ChecklistStatusKey;
}

export function getChecklistStatusCounts(items: WbsChecklistLikeItem[]) {
  const counts = emptyCounts();

  (items || []).forEach((item) => {
    if (!isActualRequirementItem(item)) return;
    const status = normalizeChecklistStatus(item);
    counts.total += 1;
    counts[status] += 1;
  });

  return counts;
}

function sortPhases(phaseNames: string[]) {
  return [...phaseNames].sort((a, b) => {
    const normalizedA = normalizePhaseName(a);
    const normalizedB = normalizePhaseName(b);
    const idxA = DEFAULT_PHASE_ORDER.findIndex(
      (phase) => normalizePhaseName(phase) === normalizedA
    );
    const idxB = DEFAULT_PHASE_ORDER.findIndex(
      (phase) => normalizePhaseName(phase) === normalizedB
    );

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function buildChecklistHierarchy(
  items: WbsChecklistLikeItem[]
): ChecklistHierarchy {
  const phases: Record<string, ChecklistHierarchyPhase> = {};

  (items || []).forEach((item) => {
    if (!isActualRequirementItem(item)) return;

    const phaseName = getChecklistPhaseName(item);
    const motherPermitName = getChecklistMotherPermitName(item);
    const parentTaskName = getChecklistParentTaskName(item);

    if (!phases[phaseName]) {
      phases[phaseName] = {
        name: phaseName,
        items: [],
        counts: emptyCounts(),
        motherPermits: {},
      };
    }

    const phase = phases[phaseName];

    if (!phase.motherPermits[motherPermitName]) {
      phase.motherPermits[motherPermitName] = {
        name: motherPermitName,
        items: [],
        counts: emptyCounts(),
        tasks: {},
      };
    }

    const motherPermit = phase.motherPermits[motherPermitName];

    if (!motherPermit.tasks[parentTaskName]) {
      motherPermit.tasks[parentTaskName] = {
        name: parentTaskName,
        items: [],
        counts: emptyCounts(),
      };
    }

    const parentTask = motherPermit.tasks[parentTaskName];
    const itemCounts = emptyCounts();
    itemCounts.total = 1;
    itemCounts[normalizeChecklistStatus(item)] = 1;

    phase.items.push(item);
    motherPermit.items.push(item);
    parentTask.items.push(item);
    addCounts(phase.counts, itemCounts);
    addCounts(motherPermit.counts, itemCounts);
    addCounts(parentTask.counts, itemCounts);
  });

  const phaseOrder = sortPhases(Object.keys(phases));

  const totals = {
    ...getChecklistStatusCounts(items),
    phases: phaseOrder.length,
    motherPermits: 0,
    parentTasks: 0,
  };

  phaseOrder.forEach((phaseName) => {
    const motherPermits = phases[phaseName]?.motherPermits || {};
    totals.motherPermits += Object.keys(motherPermits).length;
    Object.values(motherPermits).forEach((motherPermit) => {
      totals.parentTasks += Object.keys(motherPermit.tasks).length;
    });
  });

  return { phases, phaseOrder, totals };
}

export function buildChecklistNumbering(
  items: WbsChecklistLikeItem[]
): Map<string, ChecklistNumberingInfo> {
  const hierarchy = buildChecklistHierarchy(items);
  const numbering = new Map<string, ChecklistNumberingInfo>();

  hierarchy.phaseOrder.forEach((phaseName, phaseIndex) => {
    const phase = hierarchy.phases[phaseName];
    const motherPermitNames = Object.keys(phase.motherPermits);

    motherPermitNames.forEach((motherPermitName, motherPermitIndex) => {
      const motherPermit = phase.motherPermits[motherPermitName];
      const parentTaskNames = Object.keys(motherPermit.tasks);

      parentTaskNames.forEach((parentTaskName, parentTaskIndex) => {
        const parentTask = motherPermit.tasks[parentTaskName];

        parentTask.items.forEach((item, requirementIndex) => {
          const key = String(item.original_item_id || item.id || item.row || "");
          const phaseCode = `P${phaseIndex + 1}`;
          const motherPermitCode = `${phaseCode}-C${motherPermitIndex + 1}`;
          const parentTaskCode = `${motherPermitCode}.${parentTaskIndex + 1}`;
          const itemCode = `${parentTaskCode}.${requirementIndex + 1}`;

          numbering.set(key, {
            phaseCode,
            motherPermitCode,
            parentTaskCode,
            itemCode,
            phaseIndex: phaseIndex + 1,
            motherPermitIndex: motherPermitIndex + 1,
            parentTaskIndex: parentTaskIndex + 1,
            requirementIndex: requirementIndex + 1,
          });
        });
      });
    });
  });

  return numbering;
}

export function mergeChecklistSourceRows<T extends WbsChecklistLikeItem>(
  baseItems: T[],
  dbItems: WbsChecklistLikeItem[] = [],
  overrides: Record<string, Partial<T>> = {}
): T[] {
  const baseIds = new Set(baseItems.map((item) => String(item.id)));
  const dbByOriginalId = new Map<string, WbsChecklistLikeItem>();

  dbItems.forEach((item) => {
    const key = String(item.original_item_id || item.id);
    dbByOriginalId.set(key, item);
  });

  const mergedBase = baseItems.map((baseItem) => {
    const originalId = String(baseItem.id);
    const savedItem = dbByOriginalId.get(originalId) || {};
    const localOverride = overrides[originalId] || {};

    const hasOverrideChecked = Object.prototype.hasOwnProperty.call(
      localOverride,
      "checked"
    );
    const hasSavedChecked = Object.prototype.hasOwnProperty.call(
      savedItem,
      "checked"
    );

    const checked = hasOverrideChecked
      ? Boolean(localOverride.checked)
      : hasSavedChecked
        ? Boolean(savedItem.checked)
        : Boolean(baseItem.checked);

    const merged: WbsChecklistLikeItem = {
      ...baseItem,
      ...savedItem,
      ...localOverride,
      id: originalId,
      original_item_id: originalId,
      is_manual: false,
      checked,
    };

    merged["status"] = String(
      localOverride.status ||
        savedItem.status ||
        (checked ? "Completed" : baseItem.status || "Not Started")
    );

    if (checked && !isChecklistItemCompleted(merged["status"])) {
      merged["status"] = "Completed";
    }

    return merged as T;
  });

  const manualItems = dbItems
    .filter((item) => {
      const originalId = String(item.original_item_id || item.id);
      return item.is_manual || !baseIds.has(originalId);
    })
    .map((item) => {
      const originalId = String(item.original_item_id || item.id);
      const localOverride = overrides[originalId] || {};
      const checked = Object.prototype.hasOwnProperty.call(localOverride, "checked")
        ? Boolean(localOverride.checked)
        : Boolean(item.checked);

      const merged: WbsChecklistLikeItem = {
        ...item,
        ...localOverride,
        id: originalId,
        original_item_id: originalId,
        checked,
        is_manual: true,
      };

      merged["status"] = String(
        localOverride.status || item.status || (checked ? "Completed" : "Not Started")
      );

      if (checked && !isChecklistItemCompleted(merged["status"])) {
        merged["status"] = "Completed";
      }

      return merged as T;
    });

  return [...mergedBase, ...manualItems];
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
  "documents",
  "document",
  "program",
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

export function getChecklistItemsForPhase(
  phaseName: string,
  checklistItems: WbsChecklistLikeItem[]
) {
  const normalizedPhase = normalizePhaseName(phaseName);

  return (checklistItems || []).filter((item) => {
    if (!isActualRequirementItem(item)) return false;
    return normalizePhaseName(getChecklistPhaseName(item)) === normalizedPhase;
  });
}

export function getChecklistItemsForSequenceNode(
  nodeTitle: string,
  checklistItems: WbsChecklistLikeItem[]
) {
  const normalizedNodeTitle = normalizeText(nodeTitle);

  if (!normalizedNodeTitle) return [];

  const actualItems = (checklistItems || []).filter(isActualRequirementItem);
  const nodeTokens = getTokens(nodeTitle);
  const normalizedNodePhase = normalizePhaseName(nodeTitle);

  const isPhaseNode = [
    "competitive selection process",
    "phase 1",
    "phase 2",
    "phase 3",
    "phase 4",
    "post development",
    "others",
  ].includes(normalizedNodePhase);

  if (isPhaseNode) {
    return actualItems.filter(
      (item) => normalizePhaseName(getChecklistPhaseName(item)) === normalizedNodePhase
    );
  }

  return actualItems.filter((item) => {
    const primaryFields = [
      item.item,
      item.title,
      item.name,
      item.task,
      item.task_name,
      item.subsection,
      item.section,
      item.category,
    ]
      .filter(Boolean)
      .join(" ");

    const normalizedPrimary = normalizeText(primaryFields);
    const normalizedChecklistText = normalizeText(
      buildSearchableChecklistText(item)
    );

    if (!normalizedChecklistText) return false;

    if (normalizedPrimary === normalizedNodeTitle) return true;

    const section = normalizeText(item.section || item.category);
    const subsection = normalizeText(item.subsection || item.task);
    const itemName = normalizeText(getChecklistItemName(item));

    if (section && (section === normalizedNodeTitle || normalizedNodeTitle === section)) {
      return true;
    }

    if (
      subsection &&
      (subsection === normalizedNodeTitle || normalizedNodeTitle === subsection)
    ) {
      return true;
    }

    const nodeIsMeaningful =
      normalizedNodeTitle.length >= 8 && nodeTokens.length >= 2;

    if (
      nodeIsMeaningful &&
      (section.includes(normalizedNodeTitle) || normalizedNodeTitle.includes(section))
    ) {
      return Boolean(section);
    }

    if (
      nodeIsMeaningful &&
      (subsection.includes(normalizedNodeTitle) ||
        normalizedNodeTitle.includes(subsection))
    ) {
      return Boolean(subsection);
    }

    if (
      nodeIsMeaningful &&
      (itemName.includes(normalizedNodeTitle) || normalizedNodeTitle.includes(itemName))
    ) {
      return Boolean(itemName);
    }

    const coverageFromNode = tokenCoverage(nodeTitle, primaryFields);
    const coverageFromChecklist = tokenCoverage(primaryFields, nodeTitle);

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

  if ((checklistItems || []).length > 0) {
    return matchedItems.length;
  }

  return getFallbackRequirementCount(node);
}

export function isChecklistItemCompleted(statusOrRemarks: any) {
  const normalized = normalizeText(statusOrRemarks);

  return normalized.includes("done") || normalized.includes("completed");
}

export function isChecklistRowCompleted(item: WbsChecklistLikeItem) {
  return normalizeChecklistStatus(item) === "completed";
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

export function getSequenceNodeStatusCounts(
  nodeTitle: string,
  checklistItems: WbsChecklistLikeItem[]
) {
  return getChecklistStatusCounts(
    getChecklistItemsForSequenceNode(nodeTitle, checklistItems)
  );
}

export function getPhaseStatusCounts(
  phaseName: string,
  checklistItems: WbsChecklistLikeItem[]
) {
  return getChecklistStatusCounts(getChecklistItemsForPhase(phaseName, checklistItems));
}

export function getAlignmentStatusSummary(issues: WbsAlignmentIssue[]) {
  if (!issues.length) return "Missing Requirements";
  if (issues.every((issue) => issue.status === "Aligned")) return "Aligned";
  if (issues.some((issue) => issue.status === "Phase Mismatch")) return "Phase Mismatch";
  if (issues.some((issue) => issue.status === "Missing Requirements")) {
    return "Missing Requirements";
  }
  if (issues.some((issue) => issue.status === "Completed Count Mismatch")) {
    return "Completed Count Mismatch";
  }
  return "Count Mismatch";
}

export function getWbsAlignmentIssues(
  sequenceNodes: Array<WbsNodeLike & { phaseName?: string }>,
  checklistItems: WbsChecklistLikeItem[]
): WbsAlignmentIssue[] {
  return (sequenceNodes || []).map((node) => {
    const matchedItems = getChecklistItemsForSequenceNode(
      node.title,
      checklistItems
    );
    const actualCount = matchedItems.length;
    const completedCount = matchedItems.filter(isChecklistRowCompleted).length;
    const configuredCount = getFallbackRequirementCount(node);
    const configuredCompleted = Number(node.totalAcq || 0);
    const expectedPhase = node.phaseName || "";
    const normalizedExpectedPhase = normalizePhaseName(expectedPhase);
    const actualPhaseNames = Array.from(
      new Set(matchedItems.map((item) => getChecklistPhaseName(item)).filter(Boolean))
    );
    const actualPhase = actualPhaseNames.join(", ");
    const hasPhaseMismatch =
      Boolean(normalizedExpectedPhase) &&
      matchedItems.some(
        (item) => normalizePhaseName(getChecklistPhaseName(item)) !== normalizedExpectedPhase
      );

    if (actualCount === 0) {
      return {
        nodeId: node.id,
        nodeTitle: node.title,
        expectedPhase,
        actualPhase,
        actualCount,
        completedCount,
        configuredCount,
        status: "Missing Requirements",
        message: "No matching WBS Checklist requirements were found for this WBS Sequence card.",
      };
    }

    if (hasPhaseMismatch) {
      return {
        nodeId: node.id,
        nodeTitle: node.title,
        expectedPhase,
        actualPhase,
        actualCount,
        completedCount,
        configuredCount,
        status: "Phase Mismatch",
        message: "The matched checklist rows belong to a different phase than this WBS Sequence card.",
      };
    }

    if (configuredCount > 0 && configuredCount !== actualCount) {
      return {
        nodeId: node.id,
        nodeTitle: node.title,
        expectedPhase,
        actualPhase,
        actualCount,
        completedCount,
        configuredCount,
        status: "Count Mismatch",
        message: `Old/manual count is ${configuredCount}, but the checklist source of truth has ${actualCount} requirements.`,
      };
    }

    if (configuredCompleted > 0 && configuredCompleted !== completedCount) {
      return {
        nodeId: node.id,
        nodeTitle: node.title,
        expectedPhase,
        actualPhase,
        actualCount,
        completedCount,
        configuredCount,
        status: "Completed Count Mismatch",
        message: `Old/manual completed count is ${configuredCompleted}, but the checklist source of truth has ${completedCount} completed requirements.`,
      };
    }

    return {
      nodeId: node.id,
      nodeTitle: node.title,
      expectedPhase,
      actualPhase,
      actualCount,
      completedCount,
      configuredCount,
      status: "Aligned",
      message: "WBS Sequence count, completion, and phase are aligned with the WBS Checklist.",
    };
  });
}

export function getPhaseDisplayName(phaseName: string) {
  const normalized = normalizePhaseName(phaseName);

  if (normalized === "competitive selection process") {
    return "COMPETITIVE SELECTION PROCESS";
  }
  if (normalized === "phase 1") return "PRE-DEV PHASE 1";
  if (normalized === "phase 2") return "PRE-DEV PHASE 2";
  if (normalized === "phase 3") return "PRE-DEV PHASE 3";
  if (normalized === "phase 4") return "DEVELOPMENT PHASE";
  if (normalized === "post development") return "POST DEVELOPMENT PHASE";
  if (normalized === "others") return "OTHERS";

  return phaseName;
}

export function getOverallChecklistSummary(items: WbsChecklistLikeItem[]) {
  const hierarchy = buildChecklistHierarchy(items);
  return {
    ...hierarchy.totals,
    phaseBreakdown: hierarchy.phaseOrder.map((phaseName) => ({
      phase: phaseName,
      counts: cloneCounts(hierarchy.phases[phaseName].counts),
    })),
  };
}
