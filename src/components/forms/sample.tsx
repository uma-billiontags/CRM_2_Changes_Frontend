import { useEffect, useRef, useState } from "react";
import { Form} from "antd";

interface Country {
  name: string;
  flagUrl: string;
  code: string;
  cca2: string;
}

interface CompanyState {
  phone: string;
  phone_code: string;
  phone_cca2: string;
}

function getDialCode(idd: { root?: string; suffixes?: string[] }) {
  if (!idd?.root) return null;
  const suffixes = idd.suffixes || [];
  return suffixes.length === 1 ? idd.root + suffixes[0] : idd.root;
}

export default function SampleForm() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [company, setCompany] = useState<CompanyState>({
    phone: "",
    phone_code: "+91",
    phone_cca2: "IN",
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const sf = (field: keyof CompanyState, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,idd,cca2")
      .then((r) => r.json())
      .then((data) => {
        const seen = new Set<string>();
        const list: Country[] = data
          .map((c: any) => ({
            name: c.name.common,
            cca2: c.cca2,
            flagUrl: c.flags?.png ?? "",
            code: getDialCode(c.idd),
          }))
          .filter((c: Country) => {
            if (!c.code) return false;
            if (seen.has(c.cca2)) return false;
            seen.add(c.cca2);
            return true;
          })
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        setCountries(list);
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const selectedCountry = countries.find((c) => c.cca2 === company.phone_cca2);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search) ||
      c.cca2.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Form layout="vertical" style={{ maxWidth: 420, margin: "40px auto" }}>
      <Form.Item
        label="Phone Number"
        name="phone"
        rules={[{ required: true, message: "Phone number is required" }]}
      >
        <div style={{ display: "flex" }}>
          {/* ── Custom Flag Trigger ── */}
          <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => { setOpen((o) => !o); setSearch(""); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 32,
                padding: "0 10px",
                border: "1px solid #d9d9d9",
                borderRight: "none",
                borderRadius: "6px 0 0 6px",
                background: "#fafafa",
                cursor: "pointer",
                minWidth: 100,
                fontSize: 14,
              }}
            >
              {selectedCountry && (
                <img
                  src={selectedCountry.flagUrl}
                  alt={selectedCountry.name}
                  style={{ width: 22, height: 15, objectFit: "cover", borderRadius: 2 }}
                />
              )}
              <span style={{ fontWeight: 500 }}>{company.phone_code}</span>
              <span style={{ fontSize: 10, color: "#999", marginLeft: 2 }}>▼</span>
            </button>

            {/* ── Dropdown ── */}
            {open && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 9999,
                  width: 300,
                  background: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}
              >
                {/* Search box INSIDE dropdown only */}
                <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search country or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      border: "1px solid #d9d9d9",
                      borderRadius: 6,
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Country list */}
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: "12px 16px", color: "#999", fontSize: 13 }}>
                      No results found
                    </div>
                  ) : (
                    filtered.map((c) => (
                      <div
                        key={c.cca2}
                        onClick={() => {
                          sf("phone_code", c.code);
                          sf("phone_cca2", c.cca2);
                          setOpen(false);
                          setSearch("");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 14px",
                          cursor: "pointer",
                          fontSize: 13,
                          background: c.cca2 === company.phone_cca2 ? "#f0f7ff" : "transparent",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            c.cca2 === company.phone_cca2 ? "#e0f0ff" : "#f5f5f5")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            c.cca2 === company.phone_cca2 ? "#f0f7ff" : "transparent")
                        }
                      >
                        <img
                          src={c.flagUrl}
                          alt={c.name}
                          style={{ width: 22, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                        />
                        <span style={{ flex: 1 }}>{c.name}</span>
                        <span style={{ color: "#888", fontWeight: 500 }}>{c.code}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Phone number input ── */}
          <input
            type="tel"
            placeholder="Enter phone number"
            value={company.phone}
            onChange={(e) => sf("phone", e.target.value)}
            style={{
              flex: 1,
              height: 32,
              padding: "0 12px",
              border: "1px solid #d9d9d9",
              borderRadius: "0 6px 6px 0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>
      </Form.Item>

      <p style={{ fontSize: 13, color: "#888" }}>
        Full number: {company.phone_code} {company.phone}
      </p>
    </Form>
  );
}