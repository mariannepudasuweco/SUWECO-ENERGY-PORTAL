import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  RefreshCw,
  ListFilter,
} from "lucide-react";
import { fetchBOQItems } from "../../apis/boq";

const costFilters = ["All", "Materials", "Labor", "Equipment"];

export default function BillOfQuantities() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [expandedMain, setExpandedMain] = useState<Record<string, boolean>>({});
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({});
  const [expandedSubsection, setExpandedSubsection] = useState<Record<string, boolean>>({});
  const [expandedSubsubsection, setExpandedSubsubsection] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBOQ();
  }, []);

  const loadBOQ = async () => {
    try {
      setLoading(true);
      const data = await fetchBOQItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load BOQ:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        String(item.main || item.category || "").toLowerCase().includes(searchValue) ||
        String(item.section || "").toLowerCase().includes(searchValue) ||
        String(item.subsection || "").toLowerCase().includes(searchValue) ||
        String(item.subsubsection || "").toLowerCase().includes(searchValue) ||
        String(item.sub_category || "").toLowerCase().includes(searchValue) ||
        String(item.item_name || "").toLowerCase().includes(searchValue) ||
        String(item.item_description || "").toLowerCase().includes(searchValue) ||
        String(item.cost_type || "").toLowerCase().includes(searchValue);

      const matchesFilter =
        activeFilter === "All" ||
        String(item.cost_type || "").toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [items, search, activeFilter]);

  const groupedData = useMemo(() => groupBOQItems(filteredItems), [filteredItems]);

  const toggleMain = (key: string) => {
    setExpandedMain((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSubsection = (key: string) => {
    setExpandedSubsection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSubsubsection = (key: string) => {
    setExpandedSubsubsection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-20 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 text-slate-800">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>Bill of Quantities</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your BOQ items and costs</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:bg-[#22272b] dark:border-[#38414a] p-4 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {costFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search item, section, subsection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-[#38414a] dark:bg-slate-800 dark:text-white py-3 pl-10 pr-4 outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border border-slate-200 dark:border-[#38414a] p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Plus className="h-4 w-4" />
          </button>
          <button className="rounded-xl border border-slate-200 dark:border-[#38414a] p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ListFilter className="h-4 w-4" />
          </button>
          <button
            onClick={loadBOQ}
            className="rounded-xl border border-slate-200 dark:border-[#38414a] p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {groupedData.map((mainBlock: any) => {
          const mainItems = flattenAllItemsFromMain(mainBlock);
          const mainTotals = sumAmounts(mainItems);
          const mainKey = mainBlock.main;
          const isMainExpanded = expandedMain[mainKey] ?? true;

          return (
            <div
              key={mainKey}
              className="rounded-2xl border border-slate-200 dark:border-[#38414a] bg-white dark:bg-[#22272b] overflow-hidden"
            >
              <button
                onClick={() => toggleMain(mainKey)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-2">
                  {isMainExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 uppercase">
                    {mainBlock.main}
                  </span>
                </div>

                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Materials: {formatCurrency(mainTotals.materials)} · Labor:{" "}
                  {formatCurrency(mainTotals.labor)} · Equipment:{" "}
                  {formatCurrency(mainTotals.equipment)} · Total:{" "}
                  {formatCurrency(mainTotals.total)}
                </div>
              </button>

              {isMainExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {mainBlock.sections.map((sectionBlock: any) => {
                    const sectionKey = `${mainBlock.main}__${sectionBlock.section}`;
                    const isSectionExpanded = expandedSection[sectionKey] ?? true;
                    const sectionItems = flattenAllItemsFromSection(sectionBlock);
                    const sectionTotals = sumAmounts(sectionItems);

                    return (
                      <div
                        key={sectionKey}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50/40 dark:bg-slate-800/40"
                      >
                        <button
                          onClick={() => toggleSection(sectionKey)}
                          className="w-full flex items-center justify-between px-4 py-4 text-left bg-slate-50 dark:bg-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            {isSectionExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            )}
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase">
                              {sectionBlock.section}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">
                              Materials: {formatCurrency(sectionTotals.materials)} · Labor:{" "}
                              {formatCurrency(sectionTotals.labor)} ·... Total:{" "}
                              {formatCurrency(sectionTotals.total)}
                            </div>

                            <div
                              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-slate-700 dark:text-slate-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="h-4 w-4" />
                            </div>
                          </div>
                        </button>

                        {isSectionExpanded && (
                          <div className="p-3 space-y-3 bg-white dark:bg-[#22272b]">
                            {sectionBlock.subsections.map((subsectionBlock: any) => {
                              const subsectionKey = `${mainBlock.main}__${sectionBlock.section}__${subsectionBlock.subsection}`;
                              const isSubsectionExpanded =
                                expandedSubsection[subsectionKey] ?? true;
                              const subsectionItems = flattenAllItemsFromSubsection(subsectionBlock);
                              const subsectionTotals = sumAmounts(subsectionItems);

                              return (
                                <div
                                  key={subsectionKey}
                                  className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                                >
                                  <button
                                    onClick={() => toggleSubsection(subsectionKey)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-white dark:bg-[#22272b]"
                                  >
                                    <div className="flex items-center gap-2">
                                      {isSubsectionExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-slate-500" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                      )}
                                      <span className="text-base font-bold text-slate-900 dark:text-slate-200 uppercase">
                                        {subsectionBlock.subsection}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <div className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">
                                        Total: {formatCurrency(subsectionTotals.total)}
                                      </div>

                                      <div
                                        className="rounded-xl border border-slate-200 dark:border-slate-600 p-2 text-slate-700 dark:text-slate-300"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </div>
                                    </div>
                                  </button>

                                  {isSubsectionExpanded && (
                                    <div className="p-3 space-y-3 bg-slate-50/30 dark:bg-slate-800/20">
                                      {subsectionBlock.subsubsections.map((subsubBlock: any) => {
                                        const subsubKey = `${mainBlock.main}__${sectionBlock.section}__${subsectionBlock.subsection}__${subsubBlock.subsubsection}`;
                                        const isSubsubExpanded =
                                          expandedSubsubsection[subsubKey] ?? true;
                                        const subsubTotals = sumAmounts(subsubBlock.items);

                                        return (
                                          <div
                                            key={subsubKey}
                                            className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#22272b]"
                                          >
                                            <button
                                              onClick={() => toggleSubsubsection(subsubKey)}
                                              className="w-full flex items-center justify-between px-4 py-3 text-left"
                                            >
                                              <div className="flex items-center gap-2">
                                                {isSubsubExpanded ? (
                                                  <ChevronDown className="h-4 w-4 text-slate-500" />
                                                ) : (
                                                  <ChevronRight className="h-4 w-4 text-slate-500" />
                                                )}
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase">
                                                  {subsubBlock.subsubsection}
                                                </span>
                                              </div>

                                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                                Total: {formatCurrency(subsubTotals.total)}
                                              </div>
                                            </button>

                                            {isSubsubExpanded && (
                                              <BOQTable items={subsubBlock.items} />
                                            )}
                                          </div>
                                        );
                                      })}

                                      {subsectionBlock.directItems.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#22272b]">
                                          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                            Items
                                          </div>
                                          <BOQTable items={subsectionBlock.directItems} />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {sectionBlock.directItems.length > 0 && (
                              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#22272b]">
                                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                  Items
                                </div>
                                <BOQTable items={sectionBlock.directItems} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BOQTable({ items }: { items: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 border-b border-slate-200 dark:border-slate-700">
          <tr className="text-xs uppercase text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3 text-left"></th>
            <th className="px-4 py-3 text-left">Item Description</th>
            <th className="px-4 py-3 text-left">Qty</th>
            <th className="px-4 py-3 text-left">Unit</th>
            <th className="px-4 py-3 text-left">Materials</th>
            <th className="px-4 py-3 text-left">Labor</th>
            <th className="px-4 py-3 text-left">Equipment</th>
            <th className="px-4 py-3 text-left">OCM</th>
            <th className="px-4 py-3 text-left">Profit</th>
            <th className="px-4 py-3 text-left">VAT</th>
            <th className="px-4 py-3 text-left">Unit Cost</th>
            <th className="px-4 py-3 text-left">Total Cost</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={item.id || `${item.item_name}-${index}`} className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="px-4 py-4">
                <input type="checkbox" />
              </td>
              <td className="px-4 py-4 text-sm text-slate-800 dark:text-slate-200">
                {item.item_description || item.item_name || "-"}
              </td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{formatNumber(item.quantity)}</td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{item.unit || "-"}</td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{formatCurrency(item.materials)}</td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{formatCurrency(item.labor)}</td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{formatCurrency(item.equipment)}</td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{formatCurrency(item.ocm)}</td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{formatCurrency(item.profit)}</td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{formatCurrency(item.vat)}</td>
              <td className="px-4 py-4 text-sm dark:text-slate-300">{formatCurrency(item.unit_cost)}</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(item.total_cost)}
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <button className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium dark:text-slate-300 dark:hover:bg-slate-700">
                    Edit
                  </button>
                  <button className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium dark:text-slate-300 dark:hover:bg-slate-700">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function groupBOQItems(items: any[]) {
  const grouped: any = {};

  for (const item of items) {
    const main = item.main || item.category || "Uncategorized";
    const section = item.section || item.sub_category || "General";
    const subsection = item.subsection || null;
    const subsubsection = item.subsubsection || null;

    if (!grouped[main]) {
      grouped[main] = {};
    }

    if (!grouped[main][section]) {
      grouped[main][section] = {
        directItems: [],
        subsections: {},
      };
    }

    if (!subsection) {
      grouped[main][section].directItems.push(item);
      continue;
    }

    if (!grouped[main][section].subsections[subsection]) {
      grouped[main][section].subsections[subsection] = {
        directItems: [],
        subsubsections: {},
      };
    }

    if (!subsubsection) {
      grouped[main][section].subsections[subsection].directItems.push(item);
      continue;
    }

    if (!grouped[main][section].subsections[subsection].subsubsections[subsubsection]) {
      grouped[main][section].subsections[subsection].subsubsections[subsubsection] = [];
    }

    grouped[main][section].subsections[subsection].subsubsections[subsubsection].push(item);
  }

  return Object.entries(grouped).map(([main, sections]: any) => ({
    main,
    sections: Object.entries(sections).map(([section, sectionData]: any) => ({
      section,
      directItems: sectionData.directItems,
      subsections: Object.entries(sectionData.subsections).map(
        ([subsection, subsectionData]: any) => ({
          subsection,
          directItems: subsectionData.directItems,
          subsubsections: Object.entries(subsectionData.subsubsections).map(
            ([subsubsection, items]: any) => ({
              subsubsection,
              items,
            })
          ),
        })
      ),
    })),
  }));
}

function flattenAllItemsFromMain(mainBlock: any) {
  return mainBlock.sections.flatMap((sectionBlock: any) => flattenAllItemsFromSection(sectionBlock));
}

function flattenAllItemsFromSection(sectionBlock: any) {
  return [
    ...sectionBlock.directItems,
    ...sectionBlock.subsections.flatMap((subsectionBlock: any) =>
      flattenAllItemsFromSubsection(subsectionBlock)
    ),
  ];
}

function flattenAllItemsFromSubsection(subsectionBlock: any) {
  return [
    ...subsectionBlock.directItems,
    ...subsectionBlock.subsubsections.flatMap((subsubBlock: any) => subsubBlock.items),
  ];
}

function sumAmounts(items: any[]) {
  return items.reduce(
    (acc, item) => {
      acc.materials += Number(item.materials || 0);
      acc.labor += Number(item.labor || 0);
      acc.equipment += Number(item.equipment || 0);
      acc.total += Number(item.total_cost || 0);
      return acc;
    },
    { materials: 0, labor: 0, equipment: 0, total: 0 }
  );
}

function formatCurrency(value: any) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value: any) {
  return new Intl.NumberFormat("en-PH").format(Number(value || 0));
}
