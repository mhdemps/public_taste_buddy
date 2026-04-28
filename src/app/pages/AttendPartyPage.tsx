import { useNavigate, useLocation, useParams } from "react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useBuddies } from "../context/BuddiesContext";
import { PARTY_PLANS_STORAGE_BASE, scopedStorageKey } from "../userStorage";
import StickyTopChrome from "../components/StickyTopChrome";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import {
  INFO_PANEL_TEXT,
  PAGE_INTRO_BLURB_TEXT,
  PAGE_SHELL_SCROLL,
} from "../brand";
import imgPartyPlus from "@project-assets/madison-is-pretty.png";
import imgRemoveParty from "@project-assets/party-remove-x.png";
import imgPartyTopBuddy from "@project-assets/vibe-code-bad.png";

const LEGACY_PARTY_PLANS_KEY = "tasteBuddyPartyPlans";

export type PartyPlanEntry = {
  id: string;
  partyName: string;
  partyThemes: string;
  date: string;
  address: string;
  buddyId: string;
  buddyName: string;
  bringing: string;
  savedAt: string;
};

function parsePartyThemes(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizePartyEntry(raw: unknown): PartyPlanEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  const buddyName = typeof o.buddyName === "string" ? o.buddyName : "";
  const legacyName =
    typeof o.partyName === "string" ? o.partyName : buddyName ? `${buddyName}'s party` : "Party";
  return {
    id: o.id,
    partyName: legacyName,
    partyThemes: typeof o.partyThemes === "string" ? o.partyThemes : "",
    date: typeof o.date === "string" ? o.date : "",
    address: typeof o.address === "string" ? o.address : "",
    buddyId: typeof o.buddyId === "string" ? o.buddyId : "",
    buddyName,
    bringing: typeof o.bringing === "string" ? o.bringing : "",
    savedAt: typeof o.savedAt === "string" ? o.savedAt : new Date().toISOString(),
  };
}

function loadPartyPlans(storageKey: string): PartyPlanEntry[] {
  try {
    let raw = localStorage.getItem(storageKey);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_PARTY_PLANS_KEY);
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        raw = legacy;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePartyEntry).filter((e): e is PartyPlanEntry => e !== null);
  } catch {
    return [];
  }
}

function sortPlansNewestFirst(list: PartyPlanEntry[]) {
  return [...list].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function persistPlans(storageKey: string, list: PartyPlanEntry[]) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderThemePills(planId: string, themes: string[], layout: "collapsed" | "expanded") {
  if (themes.length === 0) return null;
  const wrapClass = layout === "expanded" ? "tb-theme-pills-wrap--expanded" : "tb-theme-pills-wrap--collapsed";
  return (
    <div className={wrapClass}>
      <p className="tb-theme-label share-tech-bold">Themes</p>
      <ul className="tb-allergy-list" aria-label="Party themes">
        {themes.map((tag, ti) => (
          <li key={`${planId}-theme-${ti}`} className="tb-allergy-pill share-tech-bold">
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AttendPartyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { partyId: editPartyId } = useParams<{ partyId?: string }>();
  const isAddView = location.pathname.endsWith("/add");
  const isEditView = Boolean(editPartyId);
  const isFormView = isAddView || isEditView;
  const { user } = useAuth();
  const partyStorageKey = scopedStorageKey(user!.id, PARTY_PLANS_STORAGE_BASE);
  const { buddies } = useBuddies();
  const [savedPlans, setSavedPlans] = useState<PartyPlanEntry[]>(() =>
    sortPlansNewestFirst(loadPartyPlans(partyStorageKey))
  );

  useEffect(() => {
    setSavedPlans(sortPlansNewestFirst(loadPartyPlans(partyStorageKey)));
  }, [partyStorageKey]);

  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const [partyName, setPartyName] = useState("");
  const [partyThemes, setPartyThemes] = useState("");
  const [partyDate, setPartyDate] = useState("");
  const [address, setAddress] = useState("");
  const [buddyId, setBuddyId] = useState("");
  const [bringing, setBringing] = useState("");

  const refreshSavedPlans = useCallback(() => {
    setSavedPlans(sortPlansNewestFirst(loadPartyPlans(partyStorageKey)));
  }, [partyStorageKey]);

  useEffect(() => {
    if (buddies.length === 0) return;
    if (!buddyId || !buddies.some((b) => b.id === buddyId)) {
      setBuddyId(buddies[0]!.id);
    }
  }, [buddies, buddyId]);

  useEffect(() => {
    if (isFormView && buddies.length === 0) {
      navigate("/party", { replace: true });
    }
  }, [isFormView, buddies.length, navigate]);

  useEffect(() => {
    if (isAddView) {
      setPartyName("");
      setPartyThemes("");
      setPartyDate("");
      setAddress("");
      setBringing("");
      return;
    }
    if (!editPartyId) return;
    const found = loadPartyPlans(partyStorageKey).find((p) => p.id === editPartyId);
    if (!found) {
      navigate("/party", { replace: true });
      return;
    }
    setPartyName(found.partyName);
    setPartyThemes(found.partyThemes);
    setPartyDate(found.date);
    setAddress(found.address);
    setBuddyId(found.buddyId || (buddies[0]?.id ?? ""));
    setBringing(found.bringing);
  }, [isAddView, editPartyId, navigate, buddies, partyStorageKey]);

  const selectedBuddy = useMemo(() => buddies.find((b) => b.id === buddyId), [buddies, buddyId]);

  const goToAddParty = () => {
    if (buddies.length === 0) {
      navigate("/add-buddy");
      return;
    }
    navigate("/party/add");
  };

  const handleDeleteParty = (plan: PartyPlanEntry) => {
    if (!confirm(`Are you sure you want to remove "${plan.partyName}" from your saved parties?`)) {
      return;
    }
    persistPlans(partyStorageKey, loadPartyPlans(partyStorageKey).filter((p) => p.id !== plan.id));
    refreshSavedPlans();
    setExpandedPlanId((cur) => (cur === plan.id ? null : cur));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuddy) return;

    if (editPartyId) {
      const list = loadPartyPlans(partyStorageKey);
      const existing = list.find((p) => p.id === editPartyId);
      if (!existing) {
        navigate("/party");
        return;
      }
      const updated: PartyPlanEntry = {
        ...existing,
        partyName: partyName.trim(),
        partyThemes: partyThemes.trim(),
        date: partyDate,
        address: address.trim(),
        buddyId: selectedBuddy.id,
        buddyName: selectedBuddy.name,
        bringing: bringing.trim(),
        savedAt: new Date().toISOString(),
      };
      persistPlans(partyStorageKey, list.map((p) => (p.id === editPartyId ? updated : p)));
      refreshSavedPlans();
      setPartyName("");
      setPartyThemes("");
      setPartyDate("");
      setAddress("");
      setBringing("");
      navigate("/party");
      return;
    }

    const list = loadPartyPlans(partyStorageKey);
    const row: PartyPlanEntry = {
      id: `party-${Date.now()}`,
      partyName: partyName.trim(),
      partyThemes: partyThemes.trim(),
      date: partyDate,
      address: address.trim(),
      buddyId: selectedBuddy.id,
      buddyName: selectedBuddy.name,
      bringing: bringing.trim(),
      savedAt: new Date().toISOString(),
    };
    list.push(row);
    persistPlans(partyStorageKey, list);
    refreshSavedPlans();
    setPartyName("");
    setPartyThemes("");
    setPartyDate("");
    setAddress("");
    setBringing("");
    navigate("/party");
  };

  if (isFormView && buddies.length > 0) {
    return (
      <div className={PAGE_SHELL_SCROLL}>
        <StickyTopChrome />

        <motion.div
          className="tb-main-column"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img
            alt=""
            src={imgPartyTopBuddy}
            draggable={false}
            className="tb-hero-decor-party"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.02 }}
          />

          <motion.h1
            className="tb-page-title tb-page-title--roomy share-tech-bold tb-text-coral"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            {isEditView ? "Edit party" : "Add a party"}
          </motion.h1>

          <motion.section
            className="tb-section-narrow"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            aria-label="Party information"
          >
            <h2 className="tb-section-heading share-tech-bold tb-text-coral">Party info</h2>
            <motion.form
              onSubmit={handleSubmit}
              className="tb-form-stack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <InfoBoxFrame variant={0}>
                <label htmlFor="party-name" className="tb-field-label-bold share-tech-bold">
                  Party name
                </label>
                <input
                  id="party-name"
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="tb-input-plain share-tech-regular"
                  placeholder="e.g. George's summer cookout"
                  required
                />
              </InfoBoxFrame>

              <InfoBoxFrame variant={1}>
                <label htmlFor="party-themes" className="tb-field-label-bold share-tech-bold">
                  Party themes (optional)
                </label>
                <input
                  id="party-themes"
                  type="text"
                  value={partyThemes}
                  onChange={(e) => setPartyThemes(e.target.value)}
                  className="tb-input-plain share-tech-regular"
                  placeholder="e.g. tropical, potluck, costume — comma-separated"
                />
              </InfoBoxFrame>

              <InfoBoxFrame variant={2}>
                <label htmlFor="party-date" className="tb-field-label-bold share-tech-bold">
                  Date
                </label>
                <input
                  id="party-date"
                  type="date"
                  value={partyDate}
                  onChange={(e) => setPartyDate(e.target.value)}
                  className="tb-input-plain share-tech-regular"
                  required
                />
              </InfoBoxFrame>

              <InfoBoxFrame variant={3}>
                <label htmlFor="party-address" className="tb-field-label-bold share-tech-bold">
                  Address
                </label>
                <textarea
                  id="party-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="tb-textarea-plain share-tech-regular"
                  placeholder="Street, city, or place name"
                  rows={3}
                  required
                />
              </InfoBoxFrame>

              <InfoBoxFrame variant={0}>
                <label htmlFor="party-buddy" className="tb-field-label-bold share-tech-bold">
                  Host (community profile)
                </label>
                <select
                  id="party-buddy"
                  value={buddyId}
                  onChange={(e) => setBuddyId(e.target.value)}
                  className="tb-select-plain share-tech-regular"
                  required
                >
                  {buddies.map((b) => (
                    <option key={b.id} value={b.id} className="tb-option-dark">
                      {b.name}
                    </option>
                  ))}
                </select>
              </InfoBoxFrame>

              <InfoBoxFrame variant={1}>
                <label htmlFor="party-bringing" className="tb-field-label-bold share-tech-bold">
                  What are you bringing?
                </label>
                <input
                  id="party-bringing"
                  type="text"
                  value={bringing}
                  onChange={(e) => setBringing(e.target.value)}
                  className="tb-input-plain share-tech-regular"
                  placeholder="Dish, drinks, games…"
                  required
                />
              </InfoBoxFrame>

              <motion.button type="submit" className="tb-submit-wrap" whileTap={{ scale: 0.97 }}>
                <ChalkPillFrame variant={3} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
                  <span className="tb-pill-text-white share-tech-regular">
                    {isEditView ? "Save changes" : "Save party"}
                  </span>
                </ChalkPillFrame>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => navigate("/party")}
                className="tb-link-cancel share-tech-bold tb-text-coral"
                whileHover={{ opacity: 0.7 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </motion.form>
          </motion.section>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={PAGE_SHELL_SCROLL}>
      <StickyTopChrome />

      <motion.div
        className="tb-main-column"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          alt=""
          src={imgPartyTopBuddy}
          draggable={false}
          className="tb-hero-decor-party"
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.02 }}
        />

        <motion.h1
          className="tb-page-title tb-page-title--roomy share-tech-bold tb-text-coral"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          Gatherings
        </motion.h1>

        <motion.section
          className="tb-section-narrow tb-section-narrow--mb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          aria-labelledby="saved-parties-heading"
        >
          <h2 id="saved-parties-heading" className="tb-section-heading share-tech-bold tb-text-coral">
            Your saved parties
          </h2>

          {savedPlans.length === 0 ? (
            <InfoBoxFrame variant={1}>
              <p className="share-tech-regular" style={{ fontSize: "20pt", lineHeight: 1.375 }}>
                Nothing here yet — tap + below to add party details.
              </p>
            </InfoBoxFrame>
          ) : (
            <ul className="tb-saved-list">
              {savedPlans.map((plan, index) => {
                const isExpanded = expandedPlanId === plan.id;
                const themeList = parsePartyThemes(plan.partyThemes);
                return (
                  <li key={plan.id} className="tb-li-relative">
                    <div className="tb-card-relative">
                      <InfoBoxFrame variant={index % 4}>
                        {isExpanded ? (
                          <>
                            <h3 className="tb-recipe-h3 tb-recipe-h3--pad share-tech-bold">{plan.partyName}</h3>
                            {renderThemePills(plan.id, themeList, "expanded")}
                            <p className="tb-party-detail-line">
                              <span className="share-tech-bold tb-text-panel">When · </span>
                              <span className="share-tech-regular">{formatDisplayDate(plan.date)}</span>
                            </p>
                            {plan.address ? (
                              <p className="tb-party-detail-line--wrap">
                                <span className="share-tech-bold tb-text-panel">Where · </span>
                                <span className="share-tech-regular">{plan.address}</span>
                              </p>
                            ) : null}
                            {plan.buddyName ? (
                              <p className="tb-party-detail-line">
                                <span className="share-tech-bold tb-text-panel">Host · </span>
                                <span className="share-tech-regular">{plan.buddyName}</span>
                              </p>
                            ) : null}
                            {plan.bringing ? (
                              <p className="tb-party-detail-line--wrap">
                                <span className="share-tech-bold tb-text-panel">Bringing · </span>
                                <span className="share-tech-regular">{plan.bringing}</span>
                              </p>
                            ) : null}
                            <div className="tb-recipe-actions">
                              <motion.button
                                type="button"
                                className="tb-submit-wrap"
                                onClick={() => navigate(`/party/edit/${plan.id}`)}
                                whileTap={{ scale: 0.97 }}
                              >
                                <ChalkPillFrame
                                  variant={(index + 1) % 4}
                                  fillClassName="tb-pill-fill-coral"
                                  innerClassName="tb-pill-inner tb-pill-inner--md"
                                >
                                  <span className="tb-pill-text-white--sm share-tech-regular">Edit</span>
                                </ChalkPillFrame>
                              </motion.button>
                              <motion.button
                                type="button"
                                onClick={() => handleDeleteParty(plan)}
                                className="tb-icon-btn"
                                aria-label={`Remove ${plan.partyName} from saved parties`}
                                whileHover={{ scale: 1.06, opacity: 0.88 }}
                                whileTap={{ scale: 0.94 }}
                              >
                                <img alt="" src={imgRemoveParty} draggable={false} className="tb-icon-x-img" />
                              </motion.button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="tb-expand-hit"
                            aria-expanded={false}
                            onClick={() => setExpandedPlanId(plan.id)}
                          >
                            <h3 className="tb-recipe-h3 share-tech-bold">{plan.partyName}</h3>
                            {renderThemePills(plan.id, themeList, "collapsed")}
                            <p className="tb-party-collapsed-when">
                              <span className="share-tech-bold tb-text-panel">When · </span>
                              <span className="share-tech-regular tb-opacity-90">{formatDisplayDate(plan.date)}</span>
                            </p>
                            {plan.buddyName ? (
                              <p className="tb-party-collapsed-when">
                                <span className="share-tech-bold tb-text-panel">Host · </span>
                                <span className="share-tech-regular tb-opacity-90">{plan.buddyName}</span>
                              </p>
                            ) : null}
                            <p className="tb-muted-hint share-tech-regular" style={{ color: PAGE_INTRO_BLURB_TEXT }}>
                              Tap to open party
                            </p>
                          </button>
                        )}
                      </InfoBoxFrame>
                      {isExpanded ? (
                        <motion.button
                          type="button"
                          onClick={() => setExpandedPlanId(null)}
                          className="tb-chevron-btn"
                          aria-label="Minimize party"
                          whileHover={{ opacity: 0.75 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden
                            className="tb-shrink-0"
                          >
                            <path
                              d="M6 14l6-6 6 6"
                              stroke={INFO_PANEL_TEXT}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>

        {buddies.length === 0 ? (
          <motion.div
            className="tb-empty-block"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <InfoBoxFrame variant={0}>
              <p className="share-tech-regular" style={{ fontSize: "20pt", lineHeight: 1.375 }}>
                Add someone in Saved buddies first so you can link a gathering to their profile.
              </p>
            </InfoBoxFrame>
            <motion.button
              type="button"
              onClick={() => navigate("/add-buddy")}
              className="tb-link-wide share-tech-bold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Add a taste profile
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            onClick={goToAddParty}
            className="tb-fab-add"
            aria-label="Add a party"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img alt="" className="tb-img-contain-full" src={imgPartyPlus} draggable={false} />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
