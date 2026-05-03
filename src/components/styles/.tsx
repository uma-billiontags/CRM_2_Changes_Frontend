import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Form, Input, Select, Switch, Button, Upload, Tabs, Spin, Alert, Typography, Divider
} from "antd";
import {
  PlusOutlined, DeleteOutlined, UploadOutlined,
  SaveOutlined, ArrowLeftOutlined,
} from "@ant-design/icons";
import "../styles/Onboarding.css";

const { TextArea } = Input;
const { Text } = Typography;

// API
const BASE_URL = "https://grinch-revocable-cornflake.ngrok-free.dev/";
const SUBMIT_URL = `${BASE_URL}/create_client/`;
const CHOICES_URL = `${BASE_URL}/get_choices/`;

// Fallback choices
const DEFAULT_CHOICES = {
  countries: ["India", "USA", "UK", "China"],
  states: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana", "Gujarat", "Rajasthan"],
  phone_codes: ["+91", "+1", "+44", "+86"],
  billing_currencies: ["INR", "USD"],
  agency_types: ["Digital", "Traditional", "Integrated", "Media Buying", "Creative"],
  industries: ["E-Commerce", "FMCG", "Banking & Finance", "Healthcare", "Automotive", "Technology", "Entertainment", "Real Estate"],
  place_of_supply: ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana", "Gujarat"],
  payment_types: ["Prepaid", "Postpaid"],
  payment_terms: ["Net 0 day", "Net 15 days", "Net 30 days", "Net 45 days", "Net 60 days"],
  tax_types: ["GST", "IGST", "SGST+CGST", "Exempt"],
  tds_options: ["Yes", "No"],
  markets: ["India", "SEA", "MENA", "Europe", "North America"],
  platforms: ["Google", "Meta", "DV360", "The Trade Desk", "Amazon DSP"],
  inventory_types: ["Open Exchange", "PMP", "PG", "Direct"],
  campaign_objectives: ["Brand Awareness", "Lead Generation", "App Install", "Sales Conversion"],
  languages: ["English", "Hindi", "Tamil", "Telugu", "Kannada"],
  ad_formats: ["Display", "Video", "Native", "Audio", "DOOH"],
  timezones: ["IST (UTC+5:30)", "EST (UTC-5)", "PST (UTC-8)", "GMT (UTC+0)"],
  client_types: ["Platinum", "Gold", "Silver", "Standard"],
  priority_levels: ["High", "Medium", "Low"],
  risk_levels: ["Low", "Medium", "High", "Critical"],
  payment_behaviors: ["Always On Time", "Occasional Delay", "Frequent Delay"],
  billing_contacts: ["admin@gmail.com", "campaign_team@gmail.com", "billiontags@gmail.com"],
  account_managers: ["Rahul Sharma", "Priya Mehta", "Arun Kumar", "Sneha Reddy", "Vikram Nair"],
  sales_owners: ["Deepak Joshi", "Anita Sinha", "Manoj Pillai", "Kavita Rao", "Suresh Iyer"],
  campaign_managers: ["Neha Gupta", "Rohit Verma", "Pooja Nair", "Arjun Das", "Divya Menon"],
  finance_owners: ["Sunil Kapoor", "Meera Bose", "Kiran Patel", "Lakshmi Chand", "Rajesh Tiwari"],
};

type Choices = typeof DEFAULT_CHOICES;

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ContactRow {
  id: number;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_designation: string;
  contact_country: string;
  contact_zipcode: string;
  contact_address_1: string;
  contact_address_2: string;
  digital_signature: File | null;
}

interface AddressRow {
  id: number;
  company_address_line1: string;
  company_address_line2: string;
  company_country: string;
  company_zipcode: string;
}

interface CompanyForm {
  reporting_id: string;
  company_name: string;
  company_type: string;
  agency_type: string;
  brand: string;
  website: string;
  phone_code: string;
  phone_cca2: string;
  phone: string;
  email: string;
  billing_currency: string;
  address_line1: string;
  address_line2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  cin_number: string;
  vast_number: string;
  place_of_supply: string;
  is_active: boolean;
  credit_period_days: string;
  payment_terms: string;
  payment_type: string;
  tax_type: string;
  tds_applicable: string;
  tds_section: string;
  advance_amount: string;
  credit_limit: string;
  outstanding_limit: string;
  billing_contact: string;
  default_market: string;
  default_platform: string;
  inventory_type: string;
  campaign_objective: string;
  language: string;
  audience_focus: string;
  ad_formats: string;
  timezone: string;
  account_manager: string;
  sales_owner: string;
  campaign_manager: string;
  finance_owner: string;
  client_type: string;
  priority: string;
  risk_level: string;
  payment_behavior: string;
  avg_response_time: string;
  notes: string;
  additional_internal_notes: string;
  additional_tags: string;
}

// ─── Country type for phone picker ───────────────────────────────────────────

interface Country {
  name: string;
  flagUrl: string;
  code: string;
  cca2: string;
}

function getDialCode(idd: { root?: string; suffixes?: string[] }) {
  if (!idd?.root) return null;
  const suffixes = idd.suffixes || [];
  return suffixes.length === 1 ? idd.root + suffixes[0] : idd.root;
}

// ─── PhoneInput component ─────────────────────────────────────────────────────

interface PhoneInputProps {
  phone: string;
  phone_code: string;
  phone_cca2: string;
  countries: Country[];
  onPhoneChange: (v: string) => void;
  onCountryChange: (code: string, cca2: string) => void;
}

function PhoneInput({
  phone, phone_code, phone_cca2, countries, onPhoneChange, onCountryChange,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const selectedCountry = countries.find((c) => c.cca2 === phone_cca2);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search) ||
      c.cca2.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex" }}>
      <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setSearch(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 38,
            padding: "0 8px", border: "1px solid #d9d9d9", borderRight: "none",
            borderRadius: "6px 0 0 6px", background: "#fafafa", cursor: "pointer", fontSize: 14,
          }}
        >
          {selectedCountry ? (
            <img src={selectedCountry.flagUrl} alt={selectedCountry.name}
              style={{ width: 22, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
          ) : (
            <span style={{ fontSize: 16 }}>🌐</span>
          )}
          <span style={{ fontWeight: 500 }}>{phone_code}</span>
          <span style={{ fontSize: 10, color: "#999", marginLeft: 2 }}>▼</span>
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999,
            width: 300, background: "#fff", border: "1px solid #e0e0e0",
            borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden",
          }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
              <input
                ref={searchRef} type="text" placeholder="Search country or code..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "6px 10px", border: "1px solid #d9d9d9",
                  borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "12px 16px", color: "#999", fontSize: 13 }}>No results found</div>
              ) : (
                filtered.map((c) => (
                  <div
                    key={c.cca2}
                    onClick={() => { onCountryChange(c.code, c.cca2); setOpen(false); setSearch(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                      cursor: "pointer", fontSize: 13,
                      background: c.cca2 === phone_cca2 ? "#f0f7ff" : "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = c.cca2 === phone_cca2 ? "#e0f0ff" : "#f5f5f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = c.cca2 === phone_cca2 ? "#f0f7ff" : "transparent")}
                  >
                    <img src={c.flagUrl} alt={c.name}
                      style={{ width: 22, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: "#888", fontWeight: 500 }}>{c.code}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <input
        type="tel" placeholder="Enter phone number" value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        style={{
          flex: 1, height: 38, padding: "0 8px", border: "1px solid #d9d9d9",
          borderRadius: "0 6px 6px 0", fontSize: 14, outline: "none", background: "#fff", color: "#000",
        }}
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toOpts = (arr: string[]) => arr.map((s) => ({ value: s, label: s }));

function makeContact(): ContactRow {
  return {
    id: Date.now(),
    contact_name: "", contact_phone: "", contact_email: "",
    contact_designation: "", contact_country: "", contact_zipcode: "",
    contact_address_1: "", contact_address_2: "", digital_signature: null,
  };
}

function makeAddress(): AddressRow {
  return {
    id: Date.now(),
    company_address_line1: "", company_address_line2: "",
    company_country: "", company_zipcode: "",
  };
}

const TABS = [
  { id: "basic", label: "Basic Information", emoji: "🪪" },
  { id: "billing", label: "Billing & Commercials", emoji: "💳" },
  { id: "contacts", label: "Contacts & Addresses", emoji: "👤" },
  { id: "review", label: "Review & Summary", emoji: "✅" },
];

// ─── AddNewSelect ─────────────────────────────────────────────────────────────

interface AddNewSelectProps {
  value: string | undefined;
  onChange: (v: string) => void;
  options: string[];
  setOptions: (opts: string[]) => void;
  placeholder?: string;
}

function AddNewSelect({ value, onChange, options, setOptions, placeholder }: AddNewSelectProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions([...options, trimmed]);
      onChange(trimmed);
    }
    setNewValue("");
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <Input
        autoFocus placeholder="Type and press Enter to save" value={newValue}
        suffix={<span style={{ fontSize: 11, color: "#aaa" }}>↵ Enter</span>}
        onChange={(e) => setNewValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") { setNewValue(""); setIsAdding(false); }
        }}
        onBlur={() => { setNewValue(""); setIsAdding(false); }}
      />
    );
  }

  return (
    <Select
      placeholder={placeholder} allowClear style={{ width: "100%" }}
      value={value || undefined} onChange={(v) => onChange(v ?? "")}
      dropdownRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: "4px 0" }} />
          <div
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsAdding(true)}
            style={{
              padding: "8px 12px", cursor: "pointer", color: "#4f46e5",
              fontSize: 13, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <PlusOutlined /> Add new
          </div>
        </>
      )}
      options={toOpts(options)}
    />
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Onboarding() {
  const [form] = Form.useForm();

  const [activeTab, setActiveTab] = useState("basic");
  const [choices, setChoices] = useState<Choices>(DEFAULT_CHOICES);
  const [loadingChoices, setLoadingChoices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,idd,cca2")
      .then((r) => r.json())
      .then((data) => {
        const seen = new Set<string>();
        const list: Country[] = data
          .map((c: any) => ({
            name: c.name.common, cca2: c.cca2,
            flagUrl: c.flags?.png ?? "", code: getDialCode(c.idd),
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

  // ── "Add new" option lists ──
  const [agencyTypes, setAgencyTypes] = useState<string[]>(DEFAULT_CHOICES.agency_types);
  const [placesOfSupply, setPlacesOfSupply] = useState<string[]>(DEFAULT_CHOICES.place_of_supply);
  const [taxTypes, setTaxTypes] = useState<string[]>(DEFAULT_CHOICES.tax_types);
  const [clientTypes, setClientTypes] = useState<string[]>(DEFAULT_CHOICES.client_types);
  const [priorityLevels, setPriorityLevels] = useState<string[]>(DEFAULT_CHOICES.priority_levels);
  const [riskLevels, setRiskLevels] = useState<string[]>(DEFAULT_CHOICES.risk_levels);
  const [paymentBehaviors, setPaymentBehaviors] = useState<string[]>(DEFAULT_CHOICES.payment_behaviors);
  const [billingContacts, setBillingContacts] = useState<string[]>(DEFAULT_CHOICES.billing_contacts);
  const [accountManagers, setAccountManagers] = useState<string[]>(DEFAULT_CHOICES.account_managers);
  const [salesOwners, setSalesOwners] = useState<string[]>(DEFAULT_CHOICES.sales_owners);
  const [campaignManagers, setCampaignManagers] = useState<string[]>(DEFAULT_CHOICES.campaign_managers);
  const [financeOwners, setFinanceOwners] = useState<string[]>(DEFAULT_CHOICES.finance_owners);

  const [company, setCompany] = useState<CompanyForm>({
    reporting_id: "", company_name: "", company_type: "", agency_type: "",
    brand: "", website: "", phone_code: "+91", phone_cca2: "IN", phone: "", email: "",
    billing_currency: "INR", address_line1: "", address_line2: "",
    country: "", state: "", city: "", zipcode: "", cin_number: "", vast_number: "",
    place_of_supply: "", is_active: true,
    credit_period_days: "",
    payment_terms: "Net 0 day", payment_type: "Prepaid", tax_type: "", tds_applicable: "",
    tds_section: "", advance_amount: "", credit_limit: "", outstanding_limit: "",
    billing_contact: "",
    default_market: "", default_platform: "", inventory_type: "",
    campaign_objective: "", language: "", audience_focus: "", ad_formats: "", timezone: "",
    account_manager: "", sales_owner: "", campaign_manager: "", finance_owner: "",
    client_type: "", priority: "", risk_level: "", payment_behavior: "",
    avg_response_time: "", notes: "", additional_internal_notes: "", additional_tags: "",
  });

  const [contacts, setContacts] = useState<ContactRow[]>([makeContact()]);
  const [addresses, setAddresses] = useState<AddressRow[]>([makeAddress()]);

  useEffect(() => {
    fetch(CHOICES_URL)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Partial<Choices>) => {
        setChoices((p) => ({ ...p, ...data }));
        if (data.agency_types) setAgencyTypes(data.agency_types);
        if (data.place_of_supply) setPlacesOfSupply(data.place_of_supply);
        if (data.tax_types) setTaxTypes(data.tax_types);
        if (data.client_types) setClientTypes(data.client_types);
        if (data.priority_levels) setPriorityLevels(data.priority_levels);
        if (data.risk_levels) setRiskLevels(data.risk_levels);
        if (data.payment_behaviors) setPaymentBehaviors(data.payment_behaviors);
        if (data.billing_contacts) setBillingContacts(data.billing_contacts);
        if (data.account_managers) setAccountManagers(data.account_managers);
        if (data.sales_owners) setSalesOwners(data.sales_owners);
        if (data.campaign_managers) setCampaignManagers(data.campaign_managers);
        if (data.finance_owners) setFinanceOwners(data.finance_owners);
      })
      .catch(() => console.warn("Choices API unreachable — using defaults."))
      .finally(() => setLoadingChoices(false));
  }, []);

  const sf = (k: keyof CompanyForm, v: string | boolean) =>
    setCompany((p) => ({ ...p, [k]: v }));

  const addContact = () => setContacts((p) => [...p, { ...makeContact(), id: Date.now() }]);
  const removeContact = (id: number) => setContacts((p) => p.filter((c) => c.id !== id));
  const updateContact = (id: number, k: keyof ContactRow, v: string | File | null) =>
    setContacts((p) => p.map((c) => (c.id === id ? { ...c, [k]: v } : c)));

  const addAddress = () => setAddresses((p) => [...p, { ...makeAddress(), id: Date.now() }]);
  const removeAddress = (id: number) => setAddresses((p) => p.filter((a) => a.id !== id));
  const updateAddress = (id: number, k: keyof AddressRow, v: string) =>
    setAddresses((p) => p.map((a) => (a.id === id ? { ...a, [k]: v } : a)));

  // ✅ FIXED: buildPayload — contacts & addresses sent as arrays, no naming conflict
  const buildPayload = () => {
    const clientFields = {
      reporting_id: company.reporting_id,
      name: company.company_name,
      company_type: company.company_type,
      agency_type: company.agency_type,
      brand: company.brand,
      website: company.website,
      phone: company.phone,
      email: company.email,
      billing_currency: company.billing_currency,
      address_line1: company.address_line1,
      address_line2: company.address_line2,
      country: company.country,
      state: company.state,
      city: company.city,
      zipcode: company.zipcode,
      cin_number: company.cin_number,
      vast_number: company.vast_number,
      place_of_supply: company.place_of_supply,
      is_active: company.is_active,
    };

    const billing = {
      credit_period_days: parseInt(company.credit_period_days) || 0,
      payment_terms: company.payment_terms,
      payment_type: company.payment_type,
      tax_type: company.tax_type,
      tds_applicable: company.tds_applicable === "Yes",
      tds_section: company.tds_section,
      billing_currency: company.billing_currency,
      advance_amount: parseFloat(company.advance_amount) || null,
      credit_limit: parseFloat(company.credit_limit) || null,
      outstanding_limit: parseFloat(company.outstanding_limit) || null,
      billing_contact: company.billing_contact,
    };

    const ownership = {
      account_manager: company.account_manager,
      sales_owner: company.sales_owner,
      campaign_manager: company.campaign_manager,
      finance_owner: company.finance_owner,
    };

    const classification = {
      client_type: company.client_type,
      priority: company.priority,
      risk_level: company.risk_level,
      payment_behavior: company.payment_behavior,
      avg_response_time: company.avg_response_time ? parseInt(company.avg_response_time) : null,
      notes: company.notes,
      additional_internal_notes: company.additional_internal_notes,
      additional_tags: company.additional_tags,
    };

    // ✅ FIX 1: Renamed to contactsPayload to avoid clash with state variable
    const contactsPayload = contacts.map((c) => ({
      name: c.contact_name,
      phone: c.contact_phone,
      email: c.contact_email,
      designation: c.contact_designation,
      country: c.contact_country,
      zipcode: c.contact_zipcode,
      address_line1: c.contact_address_1,
      address_line2: c.contact_address_2,
    }));

    // ✅ FIX 2: Renamed to addressesPayload to avoid clash with state variable
    const addressesPayload = addresses.map((a, idx) => ({
      address_line1: a.company_address_line1,
      address_line2: a.company_address_line2,
      country: a.company_country,
      zipcode: a.company_zipcode,
      is_primary: idx === 0, // ✅ first address is primary
    }));

    const jsonBody = {
      ...clientFields,
      billing,
      ownership,
      classification,
      contacts: contactsPayload,   // ✅ FIX 3: sent as array
      addresses: addressesPayload, // ✅ FIX 4: sent as array
    };

    // ✅ FIX 5: Read digital_signature from contacts state (not from contactsPayload)
    const signatureFile = contacts[0]?.digital_signature;
    if (signatureFile) {
      const fd = new FormData();
      fd.append("data", JSON.stringify(jsonBody));
      fd.append("digital", signatureFile);
      return { body: fd, headers: {} as Record<string, string> };
    }

    return {
      body: JSON.stringify(jsonBody),
      headers: { "Content-Type": "application/json" } as Record<string, string>,
    };
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    setSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");
    try {
      const { body, headers } = buildPayload();
      const res = await fetch(SUBMIT_URL, { method: "POST", headers, body });
      if (res.ok) {
        setSubmitStatus("success");
      } else {
        let errMsg = `Server error ${res.status}`;
        try { const json = await res.json(); errMsg = JSON.stringify(json); }
        catch { errMsg = (await res.text()) || errMsg; }
        setSubmitStatus("error");
        setErrorMessage(errMsg);
      }
    } catch (err: unknown) {
      setSubmitStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = TABS.map((t) => ({
    key: t.id,
    label: <span className="flex items-center gap-1.5 select-none">{t.emoji} {t.label}</span>,
  }));

  // ─── Sub-sections ──────────────────────────────────────────────────────────

  const BillingForm = () => {
    const isPostpaid = company.payment_type === "Postpaid";

    const handlePaymentTypeChange = (v: string) => {
      sf("payment_type", v ?? "");
      if (v === "Prepaid") {
        sf("payment_terms", "Net 0 day");
        sf("credit_period_days", "0");
        form.setFieldsValue({ payment_terms: "Net 0 day", credit_period_days: "0" });
      } else if (v === "Postpaid") {
        sf("payment_terms", "");
        sf("credit_period_days", "");
        form.setFieldsValue({ payment_terms: undefined, credit_period_days: "" });
      }
    };

    const handlePaymentTermsChange = (v: string) => {
      sf("payment_terms", v ?? "");
      if (isPostpaid && v) {
        const match = v.match(/\d+/);
        const days = match ? match[0] : "0";
        sf("credit_period_days", days);
        form.setFieldsValue({ credit_period_days: days });
      }
    };

    return (
      <Form form={form} layout="vertical" className="onboarding-form">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">

          <Form.Item label="Payment Type" name="payment_type"
            rules={[{ required: true, message: "Payment type is required" }]}>
            <Select placeholder="Select" allowClear style={{ width: "100%" }}
              value={company.payment_type || undefined}
              onChange={handlePaymentTypeChange}
              options={toOpts(choices.payment_types)} />
          </Form.Item>

          <Form.Item label="Payment Terms" name="payment_terms"
            rules={[{ required: true, message: "Payment terms is required" }]}>
            <Select
              placeholder={!company.payment_type ? "Select payment type first" : "Select"}
              allowClear style={{ width: "100%" }}
              value={company.payment_terms || undefined}
              onChange={handlePaymentTermsChange}
              disabled={!isPostpaid}
              options={isPostpaid ? toOpts(choices.payment_terms) : [{ value: "Net 0 day", label: "Net 0 day" }]}
            />
          </Form.Item>

          <Form.Item label="Credit Period (Days)" name="credit_period_days"
            rules={[{ required: true, message: "Credit period is required" }]}>
            <Input type="number" placeholder="Auto-filled"
              value={company.credit_period_days} disabled={true}
              style={{ backgroundColor: "#f5f5f5", color: "#333", cursor: "not-allowed", fontWeight: 500 }} />
          </Form.Item>

          <Form.Item label="Tax Type" name="tax_type"
            rules={[{ required: true, message: "Tax type is required" }]}>
            <AddNewSelect value={company.tax_type} onChange={(v) => sf("tax_type", v)}
              options={taxTypes} setOptions={setTaxTypes} placeholder="Select tax type" />
          </Form.Item>

          <Form.Item label="TDS Applicable" name="tds_applicable"
            rules={[{ required: true, message: "TDS applicable is required" }]}>
            <Select placeholder="Select" allowClear style={{ width: "100%" }}
              value={company.tds_applicable || undefined}
              onChange={(v) => sf("tds_applicable", v ?? "")}
              options={toOpts(choices.tds_options)} />
          </Form.Item>

          <Form.Item label="TDS Section" name="tds_section"
            rules={[{ required: true, message: "TDS section is required" }]}>
            <Input placeholder="e.g. 194J" value={company.tds_section}
              onChange={(e) => sf("tds_section", e.target.value)} />
          </Form.Item>

          <Form.Item label="Currency">
            <Select style={{ width: "100%" }} value={company.billing_currency}
              onChange={(v) => sf("billing_currency", v)}
              options={choices.billing_currencies.map((c) => ({
                value: c, label: c === "INR" ? "INR (₹)" : c,
              }))} />
          </Form.Item>

          <Form.Item label="Advance / Security Deposit" name="advance_amount"
            rules={[{ required: true, message: "Advance amount is required" }]}>
            <Input type="number" placeholder="Enter amount" value={company.advance_amount}
              onChange={(e) => sf("advance_amount", e.target.value)} />
          </Form.Item>

          <Form.Item label="Credit Limit" name="credit_limit"
            rules={[{ required: true, message: "Credit limit is required" }]}>
            <Input type="number" placeholder="Enter credit limit" value={company.credit_limit}
              onChange={(e) => sf("credit_limit", e.target.value)} />
          </Form.Item>

          <Form.Item label="Outstanding Limit Allowed" name="outstanding_limit"
            rules={[{ required: true, message: "Outstanding limit is required" }]}>
            <Input type="number" placeholder="Enter outstanding limit" value={company.outstanding_limit}
              onChange={(e) => sf("outstanding_limit", e.target.value)} />
          </Form.Item>

          <Form.Item label="Billing Contact (Finance)" name="billing_contact"
            rules={[{ required: true, message: "Billing contact is required" }]}>
            <AddNewSelect value={company.billing_contact} onChange={(v) => sf("billing_contact", v)}
              options={billingContacts} setOptions={setBillingContacts} placeholder="Select contact" />
          </Form.Item>

        </div>
      </Form>
    );
  };

  const ContactsSection = () => (
    <FormCard icon="👤" title="Company Contacts"
      subtitle="Add one or more contacts (all contacts submitted to server)"
      action={
        <Button type="primary" icon={<PlusOutlined />} onClick={addContact}
          className="ob-btn-default text-indigo-600 border-indigo-300"
          style={{ paddingTop: "8px", paddingBottom: "8px" }}>
          Add Contact
        </Button>
      }>
      {contacts.length === 0 ? (
        <div className="text-sm text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
          No contacts added yet.
        </div>
      ) : contacts.map((c, idx) => (
        <div key={c.id} className="rounded-lg border border-gray-200 p-4 mb-3 last:mb-0 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Contact #{idx + 1}
              {idx === 0 && <span className="ml-2 text-green-500 font-normal normal-case">(Primary)</span>}
            </span>
            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeContact(c.id)} />
          </div>
          <Form layout="vertical" className="onboarding-form">
            <div className="grid md:grid-cols-4 gap-x-3">
              <Form.Item label="Name" required>
                <Input placeholder="Full name" value={c.contact_name}
                  onChange={(e) => updateContact(c.id, "contact_name", e.target.value)} />
              </Form.Item>

              {/* ✅ FIX: Contact phone bound to contact state, not company state */}
              <Form.Item label="Phone Number" required>
                <PhoneInput
                  phone={c.contact_phone}
                  phone_code={company.phone_code}
                  phone_cca2={company.phone_cca2}
                  countries={countries}
                  onPhoneChange={(v) => updateContact(c.id, "contact_phone", v)}
                  onCountryChange={(code, cca2) => {
                    sf("phone_code", code);
                    sf("phone_cca2", cca2);
                  }}
                />
              </Form.Item>

              <Form.Item label="Email" required>
                <Input placeholder="email@company.com" value={c.contact_email}
                  onChange={(e) => updateContact(c.id, "contact_email", e.target.value)} />
              </Form.Item>
              <Form.Item label="Designation" required>
                <Input placeholder="Finance Director" value={c.contact_designation}
                  onChange={(e) => updateContact(c.id, "contact_designation", e.target.value)} />
              </Form.Item>
              <Form.Item label="Address Line 1" required>
                <Input placeholder="350 Mission St" value={c.contact_address_1}
                  onChange={(e) => updateContact(c.id, "contact_address_1", e.target.value)} />
              </Form.Item>
              <Form.Item label="Address Line 2">
                <Input placeholder="Suite 100" value={c.contact_address_2}
                  onChange={(e) => updateContact(c.id, "contact_address_2", e.target.value)} />
              </Form.Item>
              <Form.Item label="Country" required>
                <Select placeholder="Select…" allowClear style={{ width: "100%" }}
                  value={c.contact_country || undefined}
                  onChange={(v) => updateContact(c.id, "contact_country", v ?? "")}
                  options={toOpts(choices.countries)} />
              </Form.Item>
              <Form.Item label="Zipcode" required>
                <Input placeholder="560001" value={c.contact_zipcode}
                  onChange={(e) => updateContact(c.id, "contact_zipcode", e.target.value)} />
              </Form.Item>
              <Form.Item label="Digital Signature">
                <Upload maxCount={1} accept="image/*,.pdf"
                  beforeUpload={(file) => { updateContact(c.id, "digital_signature", file); return false; }}
                  onRemove={() => updateContact(c.id, "digital_signature", null)}
                  showUploadList={{ showRemoveIcon: true }}>
                  <Button icon={<UploadOutlined />} block>
                    {c.digital_signature ? (c.digital_signature as File).name : "Upload Signature"}
                  </Button>
                </Upload>
              </Form.Item>
            </div>
          </Form>
        </div>
      ))}
    </FormCard>
  );

  const AddressesSection = () => (
    <FormCard icon="📍" title="Company Addresses"
      subtitle="Billing, shipping or registered locations (all addresses submitted to server)"
      action={
        <Button type="primary" icon={<PlusOutlined />} onClick={addAddress}
          className="ob-btn-default text-indigo-600 border-indigo-300"
          style={{ paddingTop: "8px", paddingBottom: "8px" }}>
          Add Address
        </Button>
      }>
      {addresses.length === 0 ? (
        <div className="text-sm text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
          No addresses added yet.
        </div>
      ) : addresses.map((a, idx) => (
        <div key={a.id} className="rounded-lg border border-gray-200 p-4 mb-3 last:mb-0 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Address #{idx + 1} · Registered
              {idx === 0 && <span className="ml-2 text-green-500 font-normal normal-case">(Primary)</span>}
            </span>
            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeAddress(a.id)} />
          </div>
          <Form layout="vertical" className="onboarding-form">
            <div className="grid md:grid-cols-4 gap-x-3">
              <Form.Item label="Address Line 1" className="md:col-span-2" required>
                <Input placeholder="350 Mission Street" value={a.company_address_line1}
                  onChange={(e) => updateAddress(a.id, "company_address_line1", e.target.value)} />
              </Form.Item>
              <Form.Item label="Address Line 2" className="md:col-span-2">
                <Input placeholder="Suite 1200" value={a.company_address_line2}
                  onChange={(e) => updateAddress(a.id, "company_address_line2", e.target.value)} />
              </Form.Item>
              <Form.Item label="Country" required>
                <Select placeholder="Select…" allowClear style={{ width: "100%" }}
                  value={a.company_country || undefined}
                  onChange={(v) => updateAddress(a.id, "company_country", v ?? "")}
                  options={toOpts(choices.countries)} />
              </Form.Item>
              <Form.Item label="Zipcode" required>
                <Input placeholder="560001" value={a.company_zipcode}
                  onChange={(e) => updateAddress(a.id, "company_zipcode", e.target.value)} />
              </Form.Item>
            </div>
          </Form>
        </div>
      ))}
    </FormCard>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">

      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-40 shadow-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="font-semibold tracking-tight text-gray-800">
            Billion <span className="text-indigo-600">Tags</span>
          </span>
        </Link>
        <span className="text-xs text-gray-400 ml-2">/ New Client Onboarding</span>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-6 pb-14">

        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Onboard a new client</h1>
          <p className="text-sm text-gray-500 mt-1.5">Complete all sections. All critical fields route through admin approval.</p>
        </div>

        {submitStatus === "success" && (
          <Alert type="success" showIcon closable className="mb-4 rounded-lg"
            message="Client submitted successfully! Client ID will be auto-assigned by the system." />
        )}
        {submitStatus === "error" && (
          <Alert type="error" showIcon closable className="mb-4 rounded-lg"
            message={`Submission failed: ${errorMessage}`} />
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Link to="/" className="w-8 h-8 grid place-items-center rounded-md text-gray-400 hover:bg-gray-100">
                <ArrowLeftOutlined />
              </Link>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Add New Client</p>
                <p className="text-xs text-gray-400 mt-0.5">Create a new client profile with all required details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button className="ob-btn-default">Cancel</Button>
              </Link>
              <Button type="primary" icon={<SaveOutlined />} loading={submitting}
                onClick={handleSubmit} className="ob-btn-primary">
                {submitting ? "Saving…" : "Save Client"}
              </Button>
            </div>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab}
            items={tabItems} className="onboarding-tabs" />

          <Spin spinning={loadingChoices} tip="Loading options…">
            <div className="p-6 bg-gray-50">

              {/* ── TAB 1: BASIC INFORMATION ── */}
              {activeTab === "basic" && (
                <div className="space-y-5">

                  <FormCard icon="🪪" title="Basic Information">
                    <Form form={form} layout="vertical" className="onboarding-form">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">

                        <Form.Item label="Client ID (Auto)">
                          <Input disabled value="CLT-2026-00001" />
                        </Form.Item>

                        <Form.Item label="Reporting ID (Internal)" name="reporting_id"
                          rules={[{ required: true, message: "Reporting ID is required" }]}>
                          <Input placeholder="Enter reporting ID" value={company.reporting_id}
                            onChange={(e) => sf("reporting_id", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Company Name" name="company_name"
                          rules={[{ required: true, message: "Company name is required" }]}>
                          <Input placeholder="Enter company name" value={company.company_name}
                            onChange={(e) => sf("company_name", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Company Type" name="company_type"
                          rules={[{ required: true, message: "Company type is required" }]}>
                          <Input placeholder="Enter company type" value={company.company_type}
                            onChange={(e) => sf("company_type", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Agency Type" name="agency_type"
                          rules={[{ required: true, message: "Agency type is required" }]}>
                          <AddNewSelect value={company.agency_type} onChange={(v) => sf("agency_type", v)}
                            options={agencyTypes} setOptions={setAgencyTypes} placeholder="Select agency type" />
                        </Form.Item>

                        <Form.Item label="Brand / Parent Company">
                          <Input placeholder="Enter brand / parent company" value={company.brand}
                            onChange={(e) => sf("brand", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Website" name="website"
                          rules={[
                            { required: true, message: "Website is required" },
                            {
                              pattern: /^(https?:\/\/)(localhost|\d{1,3}(\.\d{1,3}){3}|[\w\-]+(\.[\w\-]+)+)(:\d+)?(\/[^\s]*)?$/,
                              message: "Enter a valid URL starting with http:// or https://",
                            },
                          ]}>
                          <Input placeholder="https://" value={company.website}
                            onChange={(e) => sf("website", e.target.value)} />
                        </Form.Item>

                        {/* ✅ FIX: form.setFieldValue syncs AntD form state so validation clears */}
                        <Form.Item label="Phone Number" name="phone"
                          rules={[{ required: true, message: "Phone number is required" }]}>
                          <PhoneInput
                            phone={company.phone}
                            phone_code={company.phone_code}
                            phone_cca2={company.phone_cca2}
                            countries={countries}
                            onPhoneChange={(v) => {
                              sf("phone", v);
                              form.setFieldValue("phone", v); // ✅ syncs AntD validation
                            }}
                            onCountryChange={(code, cca2) => {
                              sf("phone_code", code);
                              sf("phone_cca2", cca2);
                            }}
                          />
                        </Form.Item>

                        <Form.Item label="Email" name="email"
                          rules={[
                            { required: true, message: "Email is required" },
                            { type: "email", message: "Enter a valid email address" },
                          ]}>
                          <Input placeholder="Enter email address" value={company.email}
                            onChange={(e) => sf("email", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Billing Currency">
                          <Select style={{ width: "100%" }} value={company.billing_currency}
                            onChange={(v) => sf("billing_currency", v)}
                            options={choices.billing_currencies.map((c) => ({
                              value: c, label: c === "INR" ? "INR (₹)" : c,
                            }))} />
                        </Form.Item>

                        <Form.Item label="Address Line 1" name="address_line1"
                          className="md:col-span-2"
                          rules={[{ required: true, message: "Address line 1 is required" }]}>
                          <Input placeholder="Enter address line 1" value={company.address_line1}
                            onChange={(e) => sf("address_line1", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Address Line 2" className="md:col-span-2">
                          <Input placeholder="Enter address line 2" value={company.address_line2}
                            onChange={(e) => sf("address_line2", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Country" name="country"
                          rules={[{ required: true, message: "Country is required" }]}>
                          <Select placeholder="Select country" allowClear style={{ width: "100%" }}
                            value={company.country || undefined}
                            onChange={(v) => sf("country", v ?? "")}
                            options={toOpts(choices.countries)} />
                        </Form.Item>

                        <Form.Item label="State / Province" name="state"
                          rules={[{ required: true, message: "State is required" }]}>
                          <Select placeholder="Select state" allowClear style={{ width: "100%" }}
                            value={company.state || undefined}
                            onChange={(v) => sf("state", v ?? "")}
                            options={toOpts(choices.states)} />
                        </Form.Item>

                        <Form.Item label="City" name="city"
                          rules={[{ required: true, message: "City is required" }]}>
                          <Input placeholder="Enter city" value={company.city}
                            onChange={(e) => sf("city", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Zip Code" name="zipcode"
                          rules={[{ required: true, message: "Zip code is required" }]}>
                          <Input type="number" placeholder="Enter pin / zip code" value={company.zipcode}
                            onChange={(e) => sf("zipcode", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="CIN Number" name="cin_number"
                          rules={[{ required: true, message: "CIN number is required" }]}>
                          <Input placeholder="Enter CIN number" value={company.cin_number}
                            onChange={(e) => sf("cin_number", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Vast Number" name="vast_number"
                          rules={[{ required: true, message: "Vast number is required" }]}>
                          <Input placeholder="Enter vast number" value={company.vast_number}
                            onChange={(e) => sf("vast_number", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Place of Supply" name="place_of_supply"
                          rules={[{ required: true, message: "Place of supply is required" }]}>
                          <AddNewSelect value={company.place_of_supply}
                            onChange={(v) => sf("place_of_supply", v)}
                            options={placesOfSupply} setOptions={setPlacesOfSupply}
                            placeholder="Select place of supply" />
                        </Form.Item>

                        <Form.Item label="Is Active">
                          <div className="flex items-center gap-2 h-[38px]">
                            <Switch checked={company.is_active}
                              onChange={(checked) => sf("is_active", checked)} />
                            <Text className="text-xs text-gray-500">
                              {company.is_active ? "Active" : "Inactive"}
                            </Text>
                          </div>
                        </Form.Item>

                      </div>
                    </Form>
                  </FormCard>

                  <FormCard icon="💳" title="Billing & Commercials">
                    <BillingForm />
                  </FormCard>

                  <ContactsSection />
                  <AddressesSection />

                  <FormCard icon="👥" title="Account Ownership">
                    <Form form={form} layout="vertical" className="onboarding-form">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">

                        <Form.Item label="Account Manager" name="account_manager"
                          rules={[{ required: true, message: "Account manager is required" }]}>
                          <AddNewSelect value={company.account_manager}
                            onChange={(v) => sf("account_manager", v)}
                            options={accountManagers} setOptions={setAccountManagers}
                            placeholder="Select account manager" />
                        </Form.Item>

                        <Form.Item label="Sales Owner" name="sales_owner"
                          rules={[{ required: true, message: "Sales owner is required" }]}>
                          <AddNewSelect value={company.sales_owner}
                            onChange={(v) => sf("sales_owner", v)}
                            options={salesOwners} setOptions={setSalesOwners}
                            placeholder="Select sales owner" />
                        </Form.Item>

                        <Form.Item label="Campaign Manager" name="campaign_manager"
                          rules={[{ required: true, message: "Campaign manager is required" }]}>
                          <AddNewSelect value={company.campaign_manager}
                            onChange={(v) => sf("campaign_manager", v)}
                            options={campaignManagers} setOptions={setCampaignManagers}
                            placeholder="Select campaign manager" />
                        </Form.Item>

                        <Form.Item label="Finance Owner" name="finance_owner"
                          rules={[{ required: true, message: "Finance owner is required" }]}>
                          <AddNewSelect value={company.finance_owner}
                            onChange={(v) => sf("finance_owner", v)}
                            options={financeOwners} setOptions={setFinanceOwners}
                            placeholder="Select finance owner" />
                        </Form.Item>

                      </div>
                    </Form>
                  </FormCard>

                  <FormCard icon="🏷️" title="Client Classification & Behavior">
                    <Form form={form} layout="vertical" className="onboarding-form">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">

                        <Form.Item label="Client Type" name="client_type"
                          rules={[{ required: true, message: "Client type is required" }]}>
                          <AddNewSelect value={company.client_type}
                            onChange={(v) => sf("client_type", v)}
                            options={clientTypes} setOptions={setClientTypes}
                            placeholder="Select type" />
                        </Form.Item>

                        <Form.Item label="Priority Level" name="priority"
                          rules={[{ required: true, message: "Priority level is required" }]}>
                          <AddNewSelect value={company.priority}
                            onChange={(v) => sf("priority", v)}
                            options={priorityLevels} setOptions={setPriorityLevels}
                            placeholder="Select priority" />
                        </Form.Item>

                        <Form.Item label="Risk Level" name="risk_level"
                          rules={[{ required: true, message: "Risk level is required" }]}>
                          <AddNewSelect value={company.risk_level}
                            onChange={(v) => sf("risk_level", v)}
                            options={riskLevels} setOptions={setRiskLevels}
                            placeholder="Select risk level" />
                        </Form.Item>

                        <Form.Item label="Payment Behavior" name="payment_behavior"
                          rules={[{ required: true, message: "Payment behavior is required" }]}>
                          <AddNewSelect value={company.payment_behavior}
                            onChange={(v) => sf("payment_behavior", v)}
                            options={paymentBehaviors} setOptions={setPaymentBehaviors}
                            placeholder="Select behavior" />
                        </Form.Item>

                        <Form.Item label="Avg Response Time (Days)" name="avg_response_time"
                          rules={[{ required: true, message: "Avg response time is required" }]}>
                          <Input placeholder="Enter average days" value={company.avg_response_time}
                            onChange={(e) => sf("avg_response_time", e.target.value)} />
                        </Form.Item>

                        <Form.Item label="Health Score (Auto)">
                          <Input disabled value="–" />
                        </Form.Item>

                        <Form.Item label="Notes" name="notes"
                          className="md:col-span-2"
                          rules={[{ required: true, message: "Notes is required" }]}>
                          <Input placeholder="Enter notes about client" value={company.notes}
                            onChange={(e) => sf("notes", e.target.value)} />
                        </Form.Item>

                      </div>
                    </Form>
                  </FormCard>

                  <div className="grid md:grid-cols-2 gap-5">
                    <FormCard icon="📊" title="Client Lifetime Summary" badge="Auto">
                      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                        {[
                          ["Total Revenue (Lifetime)", "₹0.00"],
                          ["Total Spend Managed", "₹0.00"],
                          ["Total Campaigns Run", "0"],
                          ["First Campaign Date", "–"],
                          ["Last Campaign Date", "–"],
                          ["Client Since", "–"],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <div className="text-[11px] text-gray-400 leading-tight mb-1">{label}</div>
                            <div className="text-sm font-semibold text-gray-800">{value}</div>
                          </div>
                        ))}
                      </div>
                    </FormCard>
                    <FormCard icon="💰" title="Payment Snapshot" badge="Auto">
                      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                        {[
                          { label: "Total Billed (To Date)", value: "₹0.00", red: false },
                          { label: "Total Received (To Date)", value: "₹0.00", red: false },
                          { label: "Outstanding Amount", value: "₹0.00", red: true },
                          { label: "Overdue Amount", value: "₹0.00", red: true },
                          { label: "Overdue Invoices", value: "0", red: false },
                          { label: "Collection Efficiency", value: "0%", red: false },
                        ].map((s) => (
                          <div key={s.label}>
                            <div className="text-[11px] text-gray-400 leading-tight mb-1">{s.label}</div>
                            <div className={`text-sm font-semibold ${s.red ? "text-red-500" : "text-gray-800"}`}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </FormCard>
                  </div>

                  <FormCard icon="📝" title="Additional Notes">
                    <Form form={form} layout="vertical" className="onboarding-form">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Form.Item label="Internal Notes" name="additional_internal_notes"
                          rules={[{ required: true, message: "Internal notes is required" }]}>
                          <TextArea rows={3} placeholder="Enter internal notes (visible to your team only)"
                            value={company.additional_internal_notes}
                            onChange={(e) => sf("additional_internal_notes", e.target.value)} />
                        </Form.Item>
                        <Form.Item label="Tags" name="additional_tags"
                          rules={[{ required: true, message: "Tags is required" }]}>
                          <Input placeholder="Type and press enter to add tags"
                            value={company.additional_tags}
                            onChange={(e) => sf("additional_tags", e.target.value)} />
                        </Form.Item>
                      </div>
                    </Form>
                  </FormCard>

                </div>
              )}

              {/* ── TAB 2: BILLING & COMMERCIALS ── */}
              {activeTab === "billing" && (
                <div className="space-y-5">
                  <FormCard icon="💳" title="Billing & Commercials">
                    <BillingForm />
                  </FormCard>
                </div>
              )}

              {/* ── TAB 3: CONTACTS & ADDRESSES ── */}
              {activeTab === "contacts" && (
                <div className="space-y-5">
                  <ContactsSection />
                  <AddressesSection />
                </div>
              )}

              {/* ── TAB 4: REVIEW & SUMMARY ── */}
              {activeTab === "review" && (
                <div className="space-y-5">
                  <FormCard icon="✅" title="Review & Summary" subtitle="Confirm all details before final submission">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Company Details</p>
                        {[
                          ["Company Name", company.company_name],
                          ["Reporting ID", company.reporting_id],
                          ["Company Type", company.company_type],
                          ["Email", company.email],
                          ["Phone", `${company.phone_code} ${company.phone}`],
                          ["Country", company.country],
                          ["CIN Number", company.cin_number],
                          ["Vast Number", company.vast_number],
                          ["Status", company.is_active ? "Active" : "Inactive"],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                            <span className="text-gray-400">{label}</span>
                            <span className="font-medium text-gray-800 max-w-[55%] truncate text-right">{value || "–"}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Billing Details</p>
                        {[
                          ["Billing Currency", company.billing_currency],
                          ["Payment Type", company.payment_type],
                          ["Payment Terms", company.payment_terms],
                          ["Tax Type", company.tax_type],
                          ["Credit Limit", company.credit_limit],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                            <span className="text-gray-400">{label}</span>
                            <span className="font-medium text-gray-800">{value || "–"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {contacts[0]?.contact_name && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Primary Contact</p>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          {[
                            ["Name", contacts[0].contact_name],
                            ["Email", contacts[0].contact_email],
                            ["Phone", contacts[0].contact_phone],
                            ["Designation", contacts[0].contact_designation],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                              <div className="font-medium text-gray-800">{value || "–"}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </FormCard>
                  <div className="flex justify-end">
                    <Button type="primary" size="large" icon={<SaveOutlined />}
                      loading={submitting} onClick={handleSubmit} className="ob-btn-primary px-8">
                      {submitting ? "Submitting…" : "Submit for Approval"}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </Spin>
        </div>
      </div>
    </div>
  );
}

// ─── FormCard ─────────────────────────────────────────────────────────────────
function FormCard({
  icon, title, subtitle, action, badge, children,
}: {
  icon: string; title: string; subtitle?: string;
  action?: React.ReactNode; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl mb-4 leading-none">{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
              {badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}