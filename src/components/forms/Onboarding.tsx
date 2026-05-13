import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Form, Input, Select, Switch, Button, Upload, Tabs, Typography, Divider
} from "antd";
import {
  PlusOutlined, DeleteOutlined, UploadOutlined,
  SaveOutlined, ArrowLeftOutlined,
} from "@ant-design/icons";
import "../styles/Onboarding.css";
import type { ContactRow, AddressRow, CompanyForm, Country, PhoneInputProps, AddNewSelectProps } from '../types/onboard.form.types';
import { getExampleNumber, isSupportedCountry } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

const { TextArea } = Input;
const { Text } = Typography;

// API
const SUBMIT_URL = "https://grinch-revocable-cornflake.ngrok-free.dev/create_client/";

// Dropdown choices — all data lives here on the frontend
const DEFAULT_CHOICES = {
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

function getDialCode(idd: { root?: string; suffixes?: string[] }) {
  if (!idd?.root) return null;
  const suffixes = idd.suffixes || [];
  return suffixes.length === 1 ? idd.root + suffixes[0] : idd.root;
}

// ─── PhoneInput component ─────────────────────────────────────────────────────

const PhoneInput = React.memo(function PhoneInput({
  phone, phone_code, phone_cca2, countries, onPhoneChange, onCountryChange,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const maxPhoneLength = useMemo(() => {
    try {
      if (!isSupportedCountry(phone_cca2 as any)) return 15;
      const example = getExampleNumber(phone_cca2 as any, examples);
      return example ? example.nationalNumber.length : 15;
    } catch {
      return 15;
    }
  }, [phone_cca2]);

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

  const selectedCountry = useMemo(
    () => countries.find((c) => c.cca2 === phone_cca2),
    [countries, phone_cca2]
  );

  const filtered = useMemo(
    () => countries.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search) ||
        c.cca2.toLowerCase().includes(search.toLowerCase())
    ),
    [countries, search]
  );

  return (
    <div style={{ display: "flex" }}>
      <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setSearch(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 8px",
            border: "1px solid #d9d9d9", borderRight: "none", borderRadius: "6px 0 0 6px",
            background: "#fafafa", cursor: "pointer", fontSize: 14,
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
            width: 300, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden",
          }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
              <input ref={searchRef} type="text" placeholder="Search country or code..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "6px 10px", border: "1px solid #d9d9d9",
                  borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
                }} />
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "12px 16px", color: "#999", fontSize: 13 }}>No results found</div>
              ) : (
                filtered.map((c) => (
                  <div key={c.cca2}
                    onClick={() => { onCountryChange(c.code, c.cca2); onPhoneChange(""); setOpen(false); setSearch(""); }}
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
        type="tel"
        placeholder={`Enter ${maxPhoneLength}-digit number`}
        value={phone}
        maxLength={maxPhoneLength}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, maxPhoneLength);
          onPhoneChange(digits);
        }}
        style={{
          flex: 1, height: 38, padding: "0 8px", border: "1px solid #d9d9d9",
          borderRadius: "0 6px 6px 0", fontSize: 14, outline: "none",
          background: "#fff", color: "#000",
        }}
      />
    </div>
  );
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toOpts = (arr: string[]) => arr.map((s) => ({ value: s, label: s }));

function makeContact(): ContactRow {
  return {
    id: Date.now(),
    contact_name: "", contact_phone: "", contact_email: "",
    contact_designation: "", contact_country: "", contact_zipcode: "",
    contact_address_1: "", contact_address_2: "", digital_signature: null,
    contact_phone_code: "+91",
    contact_phone_cca2: "IN",

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

const AddNewSelect = React.memo(function AddNewSelect({
  value, onChange, options, setOptions, placeholder, loading = false, showSearch = false,
}: AddNewSelectProps & { loading?: boolean; showSearch?: boolean }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions([...options, trimmed]);
    }
    if (trimmed) onChange(trimmed);
    setNewValue("");
    setIsAdding(false);
  };

  // Memoize options to avoid re-computing on every render
  const selectOptions = useMemo(() => toOpts(options), [options]);

  if (isAdding) {
    return (
      <Input
        autoFocus
        placeholder="Type and press Enter to save"
        value={newValue}
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
      virtual  // ✅ enables virtual scrolling for large lists (cities/states)
      placeholder={loading ? "Loading…" : placeholder}
      loading={loading}
      allowClear
      showSearch={showSearch}
      filterOption={showSearch
        ? (input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        : undefined
      }
      style={{ width: "100%" }}
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
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
      options={selectOptions}
    />
  );
});

// ─── useLocationData ──────────────────────────────────────────────────────────

function useLocationData() {
  const [countryOpts, setCountryOpts] = useState<string[]>([]);
  const [stateOpts, setStateOpts] = useState<string[]>([]);
  const [cityOpts, setCityOpts] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const allStatesRef = useRef<string[]>([]);
  const allCitiesRef = useRef<string[]>([]);

  useEffect(() => {
    setLoadingCountries(true);
    fetch("https://countriesnow.space/api/v0.1/countries/positions")
      .then((r) => r.json())
      .then((data) => {
        const names: string[] = (data.data || []).map((c: any) => c.name).sort();
        setCountryOpts(names);
      })
      .catch(() => console.warn("Failed to load countries"))
      .finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    setLoadingStates(true);
    fetch("https://countriesnow.space/api/v0.1/countries/states")
      .then((r) => r.json())
      .then((data) => {
        const all: string[] = (data.data || [])
          .flatMap((c: any) => (c.states || []).map((s: any) => s.name))
          .filter(Boolean)
          .sort();
        const unique = [...new Set<string>(all)];
        allStatesRef.current = unique;
        setStateOpts(unique);
      })
      .catch(() => console.warn("Failed to load states"))
      .finally(() => setLoadingStates(false));
  }, []);

  useEffect(() => {
    setLoadingCities(true);
    fetch("https://countriesnow.space/api/v0.1/countries")
      .then((r) => r.json())
      .then((data) => {
        const all: string[] = (data.data || [])
          .flatMap((c: any) => c.cities || [])
          .sort();
        const unique = [...new Set<string>(all)];
        allCitiesRef.current = unique;
        setCityOpts(unique);
      })
      .catch(() => console.warn("Failed to load cities"))
      .finally(() => setLoadingCities(false));
  }, []);

  const fetchCitiesForCountry = useCallback((countryName: string): Promise<string[]> =>
    fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName }),
    })
      .then((r) => r.json())
      .then((data) => (data.data || []).sort())
      .catch(() => []), []);

  const fetchStatesForCountry = useCallback((countryName: string): Promise<string[]> =>
    fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName }),
    })
      .then((r) => r.json())
      .then((data) => (data.data?.states || []).map((s: any) => s.name).sort())
      .catch(() => []), []);

  const fetchCitiesForState = useCallback(async (countryName: string, stateName: string): Promise<string[]> => {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryName, state: stateName }),
      });
      const data = await res.json();
      const cities: string[] = (data.data || []).sort();
      if (cities.length > 0) return cities;
    } catch { }
    if (countryName) {
      const fallback = await fetchCitiesForCountry(countryName);
      if (fallback.length > 0) return fallback;
    }
    return allCitiesRef.current;
  }, [fetchCitiesForCountry]);

  const handleCountryChange = useCallback((
    country: string,
    onStateClear: () => void,
    onCityClear: () => void,
  ) => {
    onStateClear();
    onCityClear();
    if (!country) {
      setStateOpts(allStatesRef.current);
      setCityOpts(allCitiesRef.current);
      return;
    }
    setLoadingStates(true);
    fetchStatesForCountry(country)
      .then((states) => setStateOpts(states.length > 0 ? states : allStatesRef.current))
      .finally(() => setLoadingStates(false));

    setLoadingCities(true);
    fetchCitiesForCountry(country)
      .then((cities) => setCityOpts(cities.length > 0 ? cities : allCitiesRef.current))
      .finally(() => setLoadingCities(false));
  }, [fetchStatesForCountry, fetchCitiesForCountry]);

  const handleStateChange = useCallback((
    state: string,
    country: string,
    onCityClear: () => void,
  ) => {
    onCityClear();
    if (!state) {
      if (country) {
        setLoadingCities(true);
        fetchCitiesForCountry(country)
          .then((cities) => setCityOpts(cities.length > 0 ? cities : allCitiesRef.current))
          .finally(() => setLoadingCities(false));
      } else {
        setCityOpts(allCitiesRef.current);
      }
      return;
    }
    setLoadingCities(true);
    fetchCitiesForState(country, state)
      .then((cities) => setCityOpts(cities))
      .finally(() => setLoadingCities(false));
  }, [fetchCitiesForCountry, fetchCitiesForState]);

  return {
    countryOpts, setCountryOpts,
    stateOpts, setStateOpts,
    cityOpts, setCityOpts,
    loadingCountries, loadingStates, loadingCities,
    handleCountryChange, handleStateChange,
  };
}

// ─── BillingForm props type ───────────────────────────────────────────────────

interface BillingFormProps {
  company: CompanyForm;
  sf: (k: keyof CompanyForm, v: string | boolean) => void;
  form: ReturnType<typeof Form.useForm>[0];
  taxTypes: string[];
  setTaxTypes: React.Dispatch<React.SetStateAction<string[]>>;
  billingContacts: string[];
  setBillingContacts: React.Dispatch<React.SetStateAction<string[]>>;
}

// ─── BillingForm — OUTSIDE Onboarding ────────────────────────────────────────

const BillingForm = React.memo(function BillingForm({
  company, sf, form, taxTypes, setTaxTypes, billingContacts, setBillingContacts,
}: BillingFormProps) {
  const isPostpaid = company.payment_type === "Postpaid";

  const handlePaymentTypeChange = useCallback((v: string) => {
    sf("payment_type", v ?? "");
    if (v === "Prepaid") {
      sf("payment_terms", "Net 0 day"); sf("credit_period_days", "0");
      form.setFieldsValue({ payment_terms: "Net 0 day", credit_period_days: "0" });
    } else if (v === "Postpaid") {
      sf("payment_terms", ""); sf("credit_period_days", "");
      form.setFieldsValue({ payment_terms: undefined, credit_period_days: "" });
    }
  }, [sf, form]);

  const handlePaymentTermsChange = useCallback((v: string) => {
    sf("payment_terms", v ?? "");
    if (isPostpaid && v) {
      const match = v.match(/\d+/);
      const days = match ? match[0] : "0";
      sf("credit_period_days", days);
      form.setFieldsValue({ credit_period_days: days });
    }
  }, [sf, form, isPostpaid]);

  return (
    <Form form={form} layout="vertical" className="onboarding-form">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">

        <Form.Item label="Payment Type" name="payment_type"
          rules={[{ required: true, message: "Payment type is required" }]}>
          <Select placeholder="Select" allowClear style={{ width: "100%" }}
            value={company.payment_type || undefined}
            onChange={handlePaymentTypeChange}
            options={toOpts(DEFAULT_CHOICES.payment_types)} />
        </Form.Item>

        <Form.Item label="Payment Terms" name="payment_terms"
          rules={[{ required: true, message: "Payment terms is required" }]}>
          <Select
            placeholder={!company.payment_type ? "Select payment type first" : "Select"}
            allowClear style={{ width: "100%" }}
            value={company.payment_terms || undefined}
            onChange={handlePaymentTermsChange}
            disabled={!isPostpaid}
            options={isPostpaid ? toOpts(DEFAULT_CHOICES.payment_terms) : [{ value: "Net 0 day", label: "Net 0 day" }]}
          />
        </Form.Item>

        <Form.Item label="Credit Period (Days)" name="credit_period_days"
          rules={[{ required: true, message: "Credit period is required" }]}>
          <Input type="number" placeholder="Auto-filled" value={company.credit_period_days}
            disabled style={{ backgroundColor: "#f5f5f5", color: "#333", cursor: "not-allowed", fontWeight: 500 }} />
        </Form.Item>

        <Form.Item label="Tax Type" name="tax_type"
          rules={[{ required: true, message: "Tax type is required" }]}>
          <AddNewSelect value={company.tax_type} onChange={(v: any) => sf("tax_type", v)}
            options={taxTypes} setOptions={setTaxTypes} placeholder="Select tax type" />
        </Form.Item>

        <Form.Item label="TDS Applicable" name="tds_applicable"
          rules={[{ required: true, message: "TDS applicable is required" }]}>
          <Select placeholder="Select" allowClear style={{ width: "100%" }}
            value={company.tds_applicable || undefined}
            onChange={(v) => sf("tds_applicable", v ?? "")}
            options={toOpts(DEFAULT_CHOICES.tds_options)} />
        </Form.Item>

        <Form.Item label="TDS Section" name="tds_section"
          rules={[{ required: true, message: "TDS section is required" }]}>
          <Input placeholder="e.g. 194J" value={company.tds_section}
            onChange={(e) => sf("tds_section", e.target.value)} />
        </Form.Item>

        <Form.Item label="Currency">
          <Select style={{ width: "100%" }} value={company.billing_currency}
            onChange={(v) => sf("billing_currency", v)}
            options={DEFAULT_CHOICES.billing_currencies.map((c) => ({
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
          <AddNewSelect value={company.billing_contact} onChange={(v: any) => sf("billing_contact", v)}
            options={billingContacts} setOptions={setBillingContacts} placeholder="Select contact" />
        </Form.Item>

      </div>
    </Form>
  );
});

// ─── ContactsSection props type ───────────────────────────────────────────────

interface ContactsSectionProps {
  contacts: ContactRow[];
  addContact: () => void;
  removeContact: (id: number) => void;
  updateContact: (id: number, k: keyof ContactRow, v: string | File | null) => void;
  countries: Country[];           // ✅ keep — needed for PhoneInput dropdown
  loadingCountries: boolean;
  countryOpts: string[];
  setCountryOpts: React.Dispatch<React.SetStateAction<string[]>>;
}

// ─── ContactsSection — OUTSIDE Onboarding ────────────────────────────────────

const ContactsSection = React.memo(function ContactsSection({
  contacts, addContact, removeContact, updateContact,
  countries, loadingCountries, countryOpts, setCountryOpts,
}: ContactsSectionProps) {
  return (
    <FormCard icon="👤" title="Company Contacts"
      subtitle="Add one or more contacts (first contact submitted to server)"
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
              {idx > 0 && <span className="ml-2 text-amber-500 font-normal normal-case">(client-side only)</span>}
            </span>
            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeContact(c.id)} />
          </div>
          <Form layout="vertical" className="onboarding-form">
            <div className="grid md:grid-cols-4 gap-x-3">
              <Form.Item label="Name" required>
                <Input placeholder="Full name" value={c.contact_name}
                  onChange={(e) => updateContact(c.id, "contact_name", e.target.value)} />
              </Form.Item>
              <Form.Item label="Phone Number" required>
                <PhoneInput
                  phone={c.contact_phone}
                  phone_code={c.contact_phone_code ?? "+91"}
                  phone_cca2={c.contact_phone_cca2 ?? "IN"}
                  countries={countries}
                  onPhoneChange={(v) => updateContact(c.id, "contact_phone", v)}
                  onCountryChange={(code, cca2) => {
                    updateContact(c.id, "contact_phone_code" as keyof ContactRow, code);
                    updateContact(c.id, "contact_phone_cca2" as keyof ContactRow, cca2);
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
                <AddNewSelect
                  placeholder="Select country…"
                  loading={loadingCountries}
                  showSearch
                  value={c.contact_country}
                  onChange={(v) => updateContact(c.id, "contact_country", v ?? "")}
                  options={countryOpts}
                  setOptions={setCountryOpts}
                />
              </Form.Item>
              <Form.Item label="Zip Code" required>
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
});

// ─── AddressesSection props type ──────────────────────────────────────────────

interface AddressesSectionProps {
  addresses: AddressRow[];
  addAddress: () => void;
  removeAddress: (id: number) => void;
  updateAddress: (id: number, k: keyof AddressRow, v: string) => void;
  loadingCountries: boolean;
  countryOpts: string[];
  setCountryOpts: React.Dispatch<React.SetStateAction<string[]>>;
}

// ─── AddressesSection — OUTSIDE Onboarding ───────────────────────────────────

const AddressesSection = React.memo(function AddressesSection({
  addresses, addAddress, removeAddress, updateAddress,
  loadingCountries, countryOpts, setCountryOpts,
}: AddressesSectionProps) {
  return (
    <FormCard icon="📍" title="Company Addresses"
      subtitle="Billing, shipping or registered locations (first address submitted to server)"
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
              {idx > 0 && <span className="ml-2 text-amber-500 font-normal normal-case">(client-side only)</span>}
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
                <AddNewSelect
                  placeholder="Select country…"
                  loading={loadingCountries}
                  showSearch
                  value={a.company_country}
                  onChange={(v) => updateAddress(a.id, "company_country", v ?? "")}
                  options={countryOpts}
                  setOptions={setCountryOpts}
                />
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
});

// ─── FormCard ─────────────────────────────────────────────────────────────────

const FormCard = React.memo(function FormCard({
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
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Onboarding() {
  const [form] = Form.useForm();

  const [activeTab, setActiveTab] = useState("basic");
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
            seen.add(c.cca2); return true;
          })
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
        setCountries(list);
      });
  }, []);

  const {
    countryOpts, setCountryOpts,
    stateOpts, setStateOpts,
    cityOpts, setCityOpts,
    loadingCountries, loadingStates, loadingCities,
    handleCountryChange: _handleCountryChange,
    handleStateChange: _handleStateChange,
  } = useLocationData();

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
    payment_terms: "15 Days", payment_type: "Prepaid", tax_type: "", tds_applicable: "",
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

  // ✅ useCallback so sf reference is stable — prevents child re-renders
  const sf = useCallback(
    (k: keyof CompanyForm, v: string | boolean) =>
      setCompany((p) => ({ ...p, [k]: v })),
    []
  );

  // ✅ useCallback for country/state change handlers
  const onCompanyCountryChange = useCallback((v: string) => {
    sf("country", v ?? "");
    _handleCountryChange(
      v ?? "",
      () => { sf("state", ""); form.setFieldsValue({ state: undefined }); },
      () => { sf("city", ""); form.setFieldsValue({ city: undefined }); },
    );
  }, [sf, _handleCountryChange, form]);

  const onCompanyStateChange = useCallback((v: string) => {
    sf("state", v ?? "");
    _handleStateChange(
      v ?? "",
      company.country,
      () => { sf("city", ""); form.setFieldsValue({ city: undefined }); },
    );
  }, [sf, _handleStateChange, company.country, form]);

  // ✅ useCallback for contacts handlers
  const addContact = useCallback(
    () => setContacts((p) => [...p, { ...makeContact(), id: Date.now() }]),
    []
  );
  const removeContact = useCallback(
    (id: number) => setContacts((p) => p.filter((c) => c.id !== id)),
    []
  );
  const updateContact = useCallback(
    (id: number, k: keyof ContactRow, v: string | File | null) =>
      setContacts((p) => p.map((c) => (c.id === id ? { ...c, [k]: v } : c))),
    []
  );

  // ✅ useCallback for addresses handlers
  const addAddress = useCallback(
    () => setAddresses((p) => [...p, { ...makeAddress(), id: Date.now() }]),
    []
  );
  const removeAddress = useCallback(
    (id: number) => setAddresses((p) => p.filter((a) => a.id !== id)),
    []
  );
  const updateAddress = useCallback(
    (id: number, k: keyof AddressRow, v: string) =>
      setAddresses((p) => p.map((a) => (a.id === id ? { ...a, [k]: v } : a))),
    []
  );

  const buildPayload = useCallback(() => {
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
      advance_amount: company.advance_amount,
      credit_limit: company.credit_limit,
      outstanding_limit: company.outstanding_limit,
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

    const contactsPayload = contacts.map((c) => ({
      name: c.contact_name,
      phone: `${c.contact_phone_code ?? company.phone_code}${c.contact_phone}`,
      email: c.contact_email,
      designation: c.contact_designation,
      country: c.contact_country,
      zipcode: c.contact_zipcode,
      address_line1: c.contact_address_1,
      address_line2: c.contact_address_2,
    }));

    const addressesPayload = addresses.map((a, idx) => ({
      address_line1: a.company_address_line1,
      address_line2: a.company_address_line2,
      country: a.company_country,
      zipcode: a.company_zipcode,
      is_primary: idx === 0,
    }));

    const jsonBody = {
      ...clientFields, billing, ownership, classification,
      contacts: contactsPayload, addresses: addressesPayload,
    };

    const signatureFile = contacts[0]?.digital_signature;
    if (signatureFile) {
      const fd = new FormData();
      fd.append("data", JSON.stringify(jsonBody));
      contacts.forEach((contact, index) => {
        if (contact.digital_signature)
          fd.append(`contact_signature_${index}`, contact.digital_signature);
      });
      return { body: fd, headers: {} as Record<string, string> };
    }

    return {
      body: JSON.stringify(jsonBody),
      headers: { "Content-Type": "application/json" } as Record<string, string>,
    };
  }, [company, contacts, addresses]);

  const handleSubmit = useCallback(async () => {
    try { await form.validateFields(); } catch { return; }
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
  }, [form, buildPayload]);

  const tabItems = useMemo(() => TABS.map((t) => ({
    key: t.id,
    label: <span className="flex items-center gap-1.5 select-none">{t.emoji} {t.label}</span>,
  })), []);

  // ✅ Memoize prop bundles — stable object identity prevents child re-renders
  const billingFormProps = useMemo<BillingFormProps>(() => ({
    company, sf, form, taxTypes, setTaxTypes, billingContacts, setBillingContacts,
  }), [company, sf, form, taxTypes, billingContacts]);

  const contactsSectionProps = useMemo<ContactsSectionProps>(() => ({
    contacts, addContact, removeContact, updateContact, countries,
    loadingCountries, countryOpts, setCountryOpts,
  }), [contacts, company, sf, form, countries, loadingCountries, countryOpts, addContact, removeContact, updateContact]);

  const addressesSectionProps = useMemo<AddressesSectionProps>(() => ({
    addresses, addAddress, removeAddress, updateAddress,
    loadingCountries, countryOpts, setCountryOpts,
  }), [addresses, loadingCountries, countryOpts, addAddress, removeAddress, updateAddress]);

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
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            ✅ Client submitted successfully! Client ID will be auto-assigned by the system.
          </div>
        )}
        {submitStatus === "error" && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            ❌ Submission failed: {errorMessage}
          </div>
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

          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="onboarding-tabs" />

          <div className="p-6 bg-gray-50">

            {/* ── TAB 1: BASIC INFORMATION ── */}
            {activeTab === "basic" && (
              <div className="space-y-5">

                <FormCard icon="🪪" title="Basic Information">
                  <Form form={form} layout="vertical" className="onboarding-form">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">

                      <Form.Item label="Client ID (Auto)">
                        <Input disabled value="Auto-generated" />
                      </Form.Item>

                      <Form.Item label="Reporting ID (Internal)" name="reporting_id"
                        rules={[{ required: true, message: "Reporting ID is required" }]}>
                        <Input placeholder="Enter Reporting ID" value={company.reporting_id}
                          onChange={(e) => sf("reporting_id", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Company Name" name="company_name"
                        rules={[{ required: true, message: "Company name is required" }]}>
                        <Input placeholder="Enter Company Name" value={company.company_name}
                          onChange={(e) => sf("company_name", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Company Type" name="company_type"
                        rules={[{ required: true, message: "Company type is required" }]}>
                        <Input placeholder="Enter Company Type" value={company.company_type}
                          onChange={(e) => sf("company_type", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Agency Type" name="agency_type"
                        rules={[{ required: true, message: "Agency type is required" }]}>
                        <AddNewSelect value={company.agency_type} onChange={(v: any) => sf("agency_type", v)}
                          options={agencyTypes} setOptions={setAgencyTypes} placeholder="Select Agency Type" />
                      </Form.Item>

                      <Form.Item label="Brand / Parent Company">
                        <Input placeholder="Enter Brand / Parent Company" value={company.brand}
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

                      <Form.Item label="Phone Number" name="phone"
                        rules={[{ required: true, message: "Phone number is required" }]}
                        getValueProps={() => ({ value: company.phone })}>
                        <PhoneInput
                          phone={company.phone} phone_code={company.phone_code}
                          phone_cca2={company.phone_cca2} countries={countries}
                          onPhoneChange={(v) => { sf("phone", v); form.setFieldValue("phone", v); }}
                          onCountryChange={(code, cca2) => { sf("phone_code", code); sf("phone_cca2", cca2); }}
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
                          options={DEFAULT_CHOICES.billing_currencies.map((c) => ({
                            value: c, label: c === "INR" ? "INR (₹)" : c,
                          }))} />
                      </Form.Item>

                      <Form.Item label="Address Line 1" name="address_line1" className="md:col-span-2"
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
                        <AddNewSelect
                          placeholder="Select country…"
                          loading={loadingCountries}
                          showSearch
                          value={company.country}
                          onChange={onCompanyCountryChange}
                          options={countryOpts}
                          setOptions={setCountryOpts}
                        />
                      </Form.Item>

                      <Form.Item label="State / Province" name="state"
                        rules={[{ required: true, message: "State is required" }]}>
                        <AddNewSelect
                          placeholder={loadingStates ? "Loading…" : company.country ? "Select state…" : "Select country first…"}
                          loading={loadingStates}
                          showSearch
                          value={company.state}
                          onChange={onCompanyStateChange}
                          options={stateOpts}
                          setOptions={setStateOpts}
                        />
                      </Form.Item>

                      <Form.Item label="City" name="city"
                        rules={[{ required: true, message: "City is required" }]}>
                        <AddNewSelect
                          placeholder={loadingCities ? "Loading…" : company.state ? "Select city…" : "Select state first…"}
                          loading={loadingCities}
                          showSearch
                          value={company.city}
                          onChange={(v) => sf("city", v ?? "")}
                          options={cityOpts}
                          setOptions={setCityOpts}
                        />
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
                        <AddNewSelect value={company.place_of_supply} onChange={(v: any) => sf("place_of_supply", v)}
                          options={placesOfSupply} setOptions={setPlacesOfSupply} placeholder="Select place of supply" />
                      </Form.Item>

                      <Form.Item label="Is Active">
                        <div className="flex items-center gap-2 h-[38px]">
                          <Switch checked={company.is_active} onChange={(checked) => sf("is_active", checked)} />
                          <Text className="text-xs text-gray-500">
                            {company.is_active ? "Active" : "Inactive"}
                          </Text>
                        </div>
                      </Form.Item>

                    </div>
                  </Form>
                </FormCard>

                <FormCard icon="💳" title="Billing & Commercials">
                  <BillingForm {...billingFormProps} />
                </FormCard>

                <ContactsSection {...contactsSectionProps} />
                <AddressesSection {...addressesSectionProps} />

                <FormCard icon="👥" title="Account Ownership">
                  <Form form={form} layout="vertical" className="onboarding-form">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">
                      <Form.Item label="Account Manager" name="account_manager"
                        rules={[{ required: true, message: "Account manager is required" }]}>
                        <AddNewSelect value={company.account_manager} onChange={(v: any) => sf("account_manager", v)}
                          options={accountManagers} setOptions={setAccountManagers} placeholder="Select account manager" />
                      </Form.Item>
                      <Form.Item label="Sales Owner" name="sales_owner"
                        rules={[{ required: true, message: "Sales owner is required" }]}>
                        <AddNewSelect value={company.sales_owner} onChange={(v: any) => sf("sales_owner", v)}
                          options={salesOwners} setOptions={setSalesOwners} placeholder="Select sales owner" />
                      </Form.Item>
                      <Form.Item label="Campaign Manager" name="campaign_manager"
                        rules={[{ required: true, message: "Campaign manager is required" }]}>
                        <AddNewSelect value={company.campaign_manager} onChange={(v: any) => sf("campaign_manager", v)}
                          options={campaignManagers} setOptions={setCampaignManagers} placeholder="Select campaign manager" />
                      </Form.Item>
                      <Form.Item label="Finance Owner" name="finance_owner"
                        rules={[{ required: true, message: "Finance owner is required" }]}>
                        <AddNewSelect value={company.finance_owner} onChange={(v: any) => sf("finance_owner", v)}
                          options={financeOwners} setOptions={setFinanceOwners} placeholder="Select finance owner" />
                      </Form.Item>
                    </div>
                  </Form>
                </FormCard>

                <FormCard icon="🏷️" title="Client Classification & Behavior">
                  <Form form={form} layout="vertical" className="onboarding-form">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">
                      <Form.Item label="Client Type" name="client_type"
                        rules={[{ required: true, message: "Client type is required" }]}>
                        <AddNewSelect value={company.client_type} onChange={(v: any) => sf("client_type", v)}
                          options={clientTypes} setOptions={setClientTypes} placeholder="Select type" />
                      </Form.Item>
                      <Form.Item label="Priority Level" name="priority"
                        rules={[{ required: true, message: "Priority level is required" }]}>
                        <AddNewSelect value={company.priority} onChange={(v: any) => sf("priority", v)}
                          options={priorityLevels} setOptions={setPriorityLevels} placeholder="Select priority" />
                      </Form.Item>
                      <Form.Item label="Risk Level" name="risk_level"
                        rules={[{ required: true, message: "Risk level is required" }]}>
                        <AddNewSelect value={company.risk_level} onChange={(v: any) => sf("risk_level", v)}
                          options={riskLevels} setOptions={setRiskLevels} placeholder="Select risk level" />
                      </Form.Item>
                      <Form.Item label="Payment Behavior" name="payment_behavior"
                        rules={[{ required: true, message: "Payment behavior is required" }]}>
                        <AddNewSelect value={company.payment_behavior} onChange={(v: any) => sf("payment_behavior", v)}
                          options={paymentBehaviors} setOptions={setPaymentBehaviors} placeholder="Select behavior" />
                      </Form.Item>
                      <Form.Item label="Avg Response Time (Days)" name="avg_response_time"
                        rules={[{ required: true, message: "Avg response time is required" }]}>
                        <Input placeholder="Enter average days" value={company.avg_response_time}
                          onChange={(e) => sf("avg_response_time", e.target.value)} />
                      </Form.Item>
                      <Form.Item label="Health Score (Auto)">
                        <Input disabled value="–" />
                      </Form.Item>
                      <Form.Item label="Notes" name="notes" className="md:col-span-2">
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
                      <Form.Item label="Internal Notes" name="additional_internal_notes">
                        <TextArea rows={3} placeholder="Enter internal notes (visible to your team only)"
                          value={company.additional_internal_notes}
                          onChange={(e) => sf("additional_internal_notes", e.target.value)} />
                      </Form.Item>
                      <Form.Item label="Tags" name="additional_tags">
                        <Input placeholder="Type and press enter to add tags" value={company.additional_tags}
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
                  <BillingForm {...billingFormProps} />
                </FormCard>
              </div>
            )}

            {/* ── TAB 3: CONTACTS & ADDRESSES ── */}
            {activeTab === "contacts" && (
              <div className="space-y-5">
                <ContactsSection {...contactsSectionProps} />
                <AddressesSection {...addressesSectionProps} />
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
                        ["State", company.state],
                        ["City", company.city],
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
        </div>
      </div>
    </div>
  );
}