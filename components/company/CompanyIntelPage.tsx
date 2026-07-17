"use client";
// Company Intelligence — a full dossier on any employer, in the editorial
// ink-and-paper language. Hard facts from Wikipedia/Wikidata, judgement from AI.
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Building2, Users, Calendar, MapPin, Globe, TrendingUp,
  Sparkles, ThumbsUp, ThumbsDown, Target, Scale, Coins, ExternalLink,
  Briefcase, Award, Loader2, X,
} from "lucide-react";
import { api } from "@/lib/api/client";
import CoinCost from "@/components/ui/CoinCost";

interface Intel {
  name: string; logo: string; website: string; wikipedia_url: string; linkedin_url: string;
  summary: string; founded: string; founders: string[]; ceo: string[];
  headquarters: string; employees: number; revenue: number; revenue_currency: string;
  ticker: string; industries: string[]; size_bucket: string;
  what_they_do: string; culture: string; employer_reputation: string;
  interview_process: string; interview_difficulty: string;
  pros: string[]; cons: string[]; who_thrives: string; salary_note: string;
  roles_hired: string[]; employee_rating: number; wlb_rating: number;
  career_growth_rating: number; confidence: string; sources: string[]; cached: boolean;
}

const INK = "#14281E", MUTED = "#8A8474", GREEN = "#0F6E55", GOLD = "#E9C46A";

const SIZE_META: Record<string, { label: string; color: string }> = {
  small: { label: "Small company", color: "#0891b2" },
  mid: { label: "Mid-size company", color: "#7A3E9D" },
  large: { label: "Large enterprise", color: GREEN },
};

const POPULAR = ["Google", "Flipkart", "Razorpay", "Zomato", "Infosys", "Swiggy", "Amazon", "Zoho"];

function fmtRevenue(v: number, cur: string) {
  if (!v) return "";
  const c = /rupee|inr/i.test(cur) ? "₹" : /dollar|usd/i.test(cur) ? "$" : "";
  if (v >= 1e9) return `${c}${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e7) return `${c}${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e6) return `${c}${(v / 1e6).toFixed(1)}M`;
  return `${c}${v.toLocaleString("en-IN")}`;
}

// ── Rating dial ───────────────────────────────────────────────────────────
function Dial({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const color = value >= 4 ? "#10b981" : value >= 3.2 ? GOLD : "#e07a5f";
  const R = 26, C = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ position: "relative", width: "64px", height: "64px" }}>
        <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(20,40,30,0.08)" strokeWidth="5" />
          <motion.circle cx="32" cy="32" r={R} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - (pct / 100) * C }}
            transition={{ duration: 1, ease: "easeOut" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: INK }}>
          {value ? value.toFixed(1) : "—"}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "11.5px", fontWeight: 700, color: INK }}>{label}</div>
        {sub && <div style={{ fontSize: "10px", color: MUTED }}>{sub}</div>}
      </div>
    </div>
  );
}

function Fact({ Icon, label, value }: { Icon: React.ComponentType<{ style?: React.CSSProperties }>; label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid rgba(20,40,30,0.09)", borderRadius: "12px", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
        <Icon style={{ width: "11px", height: "11px", color: MUTED }} />
        <span style={{ fontSize: "10px", fontWeight: 600, color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: "13.5px", fontWeight: 700, color: INK, lineHeight: 1.35 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: INK, margin: 0 }}>{title}</h3>
        <div style={{ flex: 1, height: "1px", background: "rgba(20,40,30,0.1)" }} />
      </div>
      {children}
    </div>
  );
}

export default function CompanyIntelPage() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string; logo: string; hint: string }[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [intel, setIntel] = useState<Intel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Free typeahead (Wikipedia-backed, cached)
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 2) { setSuggestions([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/company/suggest", { params: { q: q.trim() } });
        setSuggestions(data.results || []);
      } catch { setSuggestions([]); }
    }, 280);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [q]);

  const lookup = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setShowSug(false); setLoading(true); setError(""); setIntel(null);
    try {
      const { data } = await api.get("/company/intel", { params: { name: name.trim() } });
      setIntel(data);
    } catch (e: any) {
      setError(e?.response?.status === 402
        ? "You're out of credits — top up to research more companies."
        : "Couldn't find that company. Try the full legal name.");
    } finally { setLoading(false); }
  }, []);

  const size = intel ? SIZE_META[intel.size_bucket] : null;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "28px 24px 56px" }}>
      <div style={{ maxWidth: "940px", margin: "0 auto" }}>

        {/* ── Search hero ─────────────────────────────────────────────── */}
        {!intel && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", paddingTop: "24px", marginBottom: "28px" }}>
            <h1 style={{ fontSize: "clamp(26px,3.6vw,36px)", fontWeight: 600, color: INK, marginBottom: "8px" }}>
              Know them before they know you.
            </h1>
            <p style={{ fontSize: "14px", color: MUTED, fontStyle: "italic", maxWidth: "480px", margin: "0 auto" }}>
              Founders, culture, pay, interview process and the honest pros and cons —
              for any company in the world.
            </p>
          </motion.div>
        )}

        {/* ── Search box ──────────────────────────────────────────────── */}
        <div style={{ position: "relative", marginBottom: "24px", zIndex: 20 }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#FFFFFF", border: "1px solid rgba(20,40,30,0.14)", borderRadius: "12px", padding: "12px 14px" }}>
                <Search style={{ width: "16px", height: "16px", color: MUTED, flexShrink: 0 }} />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setShowSug(true); }}
                  onFocus={() => setShowSug(true)}
                  onKeyDown={(e) => e.key === "Enter" && lookup(q)}
                  placeholder="Search any company — Google, Flipkart, a startup you're interviewing at…"
                  style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", color: INK, fontFamily: "inherit", background: "transparent" }}
                />
                {q && <button onClick={() => { setQ(""); setSuggestions([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X style={{ width: "14px", height: "14px" }} /></button>}
              </div>

              {/* Typeahead */}
              <AnimatePresence>
                {showSug && suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid rgba(20,40,30,0.12)", borderRadius: "12px", boxShadow: "0 12px 40px rgba(12,34,27,0.12)", overflow: "hidden" }}>
                    {suggestions.map((s) => (
                      <button key={s.name} onClick={() => { setQ(s.name); lookup(s.name); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid rgba(20,40,30,0.05)", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,110,85,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                        <img src={s.logo} alt="" style={{ width: "22px", height: "22px", borderRadius: "5px", objectFit: "contain", flexShrink: 0 }}
                          onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: INK }}>{s.name}</div>
                          {s.hint && <div style={{ fontSize: "11px", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.hint}</div>}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => lookup(q)} disabled={loading || !q.trim()}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 22px", background: `linear-gradient(135deg,${GREEN},#0A523F)`, border: "none", borderRadius: "12px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: loading || !q.trim() ? "not-allowed" : "pointer", opacity: loading || !q.trim() ? 0.6 : 1, flexShrink: 0 }}>
              {loading ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Sparkles style={{ width: "14px", height: "14px" }} />}
              Research <CoinCost n={2} onDark />
            </button>
          </div>

          {/* Popular chips */}
          {!intel && !loading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "12px", justifyContent: "center" }}>
              {POPULAR.map((c) => (
                <button key={c} onClick={() => { setQ(c); lookup(c); }}
                  style={{ fontSize: "12px", padding: "6px 13px", borderRadius: "20px", border: "1px solid rgba(20,40,30,0.12)", background: "#fff", color: "#555", cursor: "pointer" }}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(224,122,95,0.08)", border: "1px solid rgba(224,122,95,0.3)", color: "#b45309", fontSize: "13px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: "34px", height: "34px", borderRadius: "50%", border: `3px solid rgba(15,110,85,0.15)`, borderTopColor: GREEN, margin: "0 auto 14px" }} />
            <p style={{ fontSize: "13.5px", color: MUTED }}>Reading everything public about <strong style={{ color: INK }}>{q}</strong>…</p>
            <p style={{ fontSize: "11.5px", color: "#C9C2B2", marginTop: "4px" }}>Wikipedia · Wikidata · Mithra analysis</p>
          </div>
        )}

        {/* ── Dossier ─────────────────────────────────────────────────── */}
        {intel && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

            {/* Header — ink panel */}
            <div style={{ background: "linear-gradient(178deg,#0C221B,#0A1D17)", borderRadius: "18px", padding: "24px", marginBottom: "18px" }}>
              <div style={{ display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ width: "62px", height: "62px", borderRadius: "14px", background: "rgba(255,255,255,0.94)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  <img src={intel.logo} alt="" style={{ width: "44px", height: "44px", objectFit: "contain" }}
                    onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; (t.parentElement as HTMLElement).innerHTML = `<span style="font-size:24px;font-weight:800;color:#0C221B">${intel.name[0]}</span>`; }} />
                </div>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#F5F1E6", margin: 0 }}>{intel.name}</h2>
                    {size && (
                      <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: "rgba(233,196,106,0.15)", color: GOLD, border: "1px solid rgba(233,196,106,0.3)" }}>
                        {size.label}
                      </span>
                    )}
                    {intel.ticker && (
                      <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", color: "rgba(245,241,230,0.8)" }}>
                        {intel.ticker}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "13px", color: "rgba(245,241,230,0.6)", margin: "8px 0 0", lineHeight: 1.6 }}>
                    {intel.what_they_do || intel.summary?.slice(0, 200)}
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                    {intel.website && <a href={intel.website} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: GOLD, textDecoration: "none", padding: "5px 10px", borderRadius: "8px", background: "rgba(233,196,106,0.1)" }}><Globe style={{ width: "11px", height: "11px" }} /> Website</a>}
                    {intel.linkedin_url && <a href={intel.linkedin_url} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "rgba(245,241,230,0.75)", textDecoration: "none", padding: "5px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.07)" }}><ExternalLink style={{ width: "11px", height: "11px" }} /> LinkedIn</a>}
                    {intel.wikipedia_url && <a href={intel.wikipedia_url} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "rgba(245,241,230,0.75)", textDecoration: "none", padding: "5px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.07)" }}><ExternalLink style={{ width: "11px", height: "11px" }} /> Wikipedia</a>}
                  </div>
                </div>

                {/* Ratings */}
                {(intel.employee_rating > 0) && (
                  <div style={{ display: "flex", gap: "14px", background: "rgba(255,255,255,0.05)", padding: "14px 16px", borderRadius: "14px" }}>
                    <Dial value={intel.employee_rating} label="Overall" />
                    <Dial value={intel.wlb_rating} label="Work-life" />
                    <Dial value={intel.career_growth_rating} label="Growth" />
                  </div>
                )}
              </div>
            </div>

            {/* Facts grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px", marginBottom: "24px" }}>
              <Fact Icon={Calendar} label="Founded" value={intel.founded} />
              <Fact Icon={Users} label="Founders" value={intel.founders?.join(", ")} />
              <Fact Icon={Award} label="CEO" value={intel.ceo?.join(", ")} />
              <Fact Icon={MapPin} label="Headquarters" value={intel.headquarters} />
              <Fact Icon={Building2} label="Employees" value={intel.employees ? intel.employees.toLocaleString("en-IN") : ""} />
              <Fact Icon={TrendingUp} label="Revenue" value={fmtRevenue(intel.revenue, intel.revenue_currency)} />
              <Fact Icon={Briefcase} label="Industry" value={intel.industries?.join(", ")} />
            </div>

            {/* Pros / Cons */}
            {(intel.pros?.length > 0 || intel.cons?.length > 0) && (
              <Section title="The honest picture">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "12px" }}>
                  <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.22)", borderRadius: "14px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                      <ThumbsUp style={{ width: "14px", height: "14px", color: "#059669" }} />
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#059669" }}>What people love</span>
                    </div>
                    {intel.pros?.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "12.5px", color: "#374151", lineHeight: 1.55 }}>
                        <span style={{ color: "#059669", flexShrink: 0 }}>+</span><span>{p}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(224,122,95,0.05)", border: "1px solid rgba(224,122,95,0.22)", borderRadius: "14px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                      <ThumbsDown style={{ width: "14px", height: "14px", color: "#c2410c" }} />
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#c2410c" }}>What to watch for</span>
                    </div>
                    {intel.cons?.map((c, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "12.5px", color: "#374151", lineHeight: 1.55 }}>
                        <span style={{ color: "#c2410c", flexShrink: 0 }}>−</span><span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {/* Culture + reputation */}
            {(intel.culture || intel.employer_reputation) && (
              <Section title="Culture & reputation">
                <div style={{ background: "#fff", border: "1px solid rgba(20,40,30,0.09)", borderRadius: "14px", padding: "18px" }}>
                  {intel.culture && <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: 1.7, margin: "0 0 12px" }}>{intel.culture}</p>}
                  {intel.employer_reputation && <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: 1.7, margin: 0 }}>{intel.employer_reputation}</p>}
                  {intel.who_thrives && (
                    <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "10px", background: "rgba(233,196,106,0.09)", borderLeft: `3px solid ${GOLD}` }}>
                      <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#8A5A00", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>Who thrives here</div>
                      <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, margin: 0 }}>{intel.who_thrives}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Interview + salary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "12px", marginBottom: "22px" }}>
              {intel.interview_process && (
                <div style={{ background: "#fff", border: "1px solid rgba(20,40,30,0.09)", borderRadius: "14px", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                    <Target style={{ width: "14px", height: "14px", color: GREEN }} />
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: INK }}>Interview process</span>
                    {intel.interview_difficulty && (
                      <span style={{ marginLeft: "auto", fontSize: "10.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
                        background: intel.interview_difficulty === "Hard" ? "rgba(224,122,95,0.12)" : intel.interview_difficulty === "Easy" ? "rgba(16,185,129,0.12)" : "rgba(233,196,106,0.16)",
                        color: intel.interview_difficulty === "Hard" ? "#c2410c" : intel.interview_difficulty === "Easy" ? "#059669" : "#8A5A00" }}>
                        {intel.interview_difficulty}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.65, margin: 0 }}>{intel.interview_process}</p>
                </div>
              )}
              {intel.salary_note && (
                <div style={{ background: "#fff", border: "1px solid rgba(20,40,30,0.09)", borderRadius: "14px", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                    <Scale style={{ width: "14px", height: "14px", color: GREEN }} />
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: INK }}>Pay & positioning</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.65, margin: 0 }}>{intel.salary_note}</p>
                </div>
              )}
            </div>

            {/* Roles hired */}
            {intel.roles_hired?.length > 0 && (
              <Section title="Who they hire">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {intel.roles_hired.map((r) => (
                    <a key={r} href={`/job-finder?q=${encodeURIComponent(r)}&company=${encodeURIComponent(intel.name)}`}
                      style={{ fontSize: "12px", padding: "7px 13px", borderRadius: "20px", background: "rgba(15,110,85,0.07)", border: "1px solid rgba(15,110,85,0.2)", color: GREEN, textDecoration: "none", fontWeight: 500 }}>
                      {r}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* Sources + trust note */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "14px 16px", borderRadius: "12px", background: "rgba(20,40,30,0.03)", border: "1px dashed rgba(20,40,30,0.14)" }}>
              <span style={{ fontSize: "11px", color: MUTED }}>Sources:</span>
              {intel.sources?.map((s) => (
                <span key={s} style={{ fontSize: "10.5px", padding: "3px 9px", borderRadius: "20px", background: "#fff", border: "1px solid rgba(20,40,30,0.1)", color: "#555" }}>{s}</span>
              ))}
              <span style={{ fontSize: "11px", color: MUTED, marginLeft: "auto" }}>
                Ratings are AI estimates, not live Glassdoor scores · confidence: <strong>{intel.confidence}</strong>
                {intel.cached && " · cached"}
              </span>
            </div>
          </motion.div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
