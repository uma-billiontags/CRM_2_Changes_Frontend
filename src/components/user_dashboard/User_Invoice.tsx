import React, { useEffect, useRef, useState } from "react";
import { Button, Modal, Spin, Tag, Input, Empty } from "antd";
import {
    EyeOutlined,
    DownloadOutlined,
    SearchOutlined,
    FileTextOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import Sidebar from "../shared/Sidebar";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
    line_item_id: string;
    line_item_name?: string;
    start_date?: string;
    end_date?: string;
    ad_format?: string;
    impressions?: string;
    units?: string;
    unit_cost?: string;
    unit_value?: string;
    ethnicity?: string[];
    ctr?: string;
    viewability?: string;
    vcr?: string;
}

interface Campaign {
    id: number;
    campaign_id: string;
    approval_status: string;
    campaign_name: string;
    client_name: string;
    client?: string | number;
    advertiser?: string;
    website_url?: string;
    campaign_type?: string;
    buying_type?: string;
    objective?: string;
    notes?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
    age?: string;
    gender?: string;
    platforms?: string;
    frequency_cap?: string;
    brand_safety?: string;
    viewability_goal?: string;
    geo_targeting?: string;
    line_items?: LineItem[];
    client_campaign_ID?: string;
    purchase_order_ID?: string;
    new_cpm?: string | number;
    new_price?: string | number;
}

interface ClientDetail {
    client_id?: string;           // ← Add this
    name?: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipcode?: string;
    cin_number?: string;
    vast_number?: string;
    billing?: {
        payment_terms?: string;
        billing_contact?: string;
        billing_currency?: string;
    };
    ownership?: {
        account_manager?: string;
    };
    contacts?: Array<{
        name?: string;
        email?: string;
        phone?: string;
        designation?: string;
    }>;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
    bg: "#F8FAFC",
    white: "#FFFFFF",
    slate: "#0F172A",
    slate700: "#334155",
    slate500: "#64748B",
    slate300: "#CBD5E1",
    slate100: "#F1F5F9",
    border: "#E2E8F0",
    blue: "#2563EB",
    blueLight: "#EFF6FF",
    blueMid: "#BFDBFE",
    green: "#16A34A",
    greenLight: "#F0FDF4",
    amber: "#D97706",
    amberLight: "#FFFBEB",
    purple: "#7C3AED",
    purpleLight: "#F5F3FF",
    red: "#DC2626",
    redLight: "#FEF2F2",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function fmtDateLong(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

// Generate invoice number from campaign
function generateInvoiceNumber(campaign: Campaign): string {
    return `BTU${campaign.id.toString().padStart(6, "0")}`;
}

// Calculate total amount from line items
function calculateTotal(lineItems: LineItem[]): { subtotal: number; discount: number; total: number } {
    let subtotal = 0;
    lineItems.forEach((li) => {
        const cost = li.unit_cost ? parseFloat(li.unit_cost.replace(/[^0-9.]/g, "")) : 0;
        const impressions = parseInt(li.impressions || "0") || 0;
        if (!isNaN(cost) && cost > 0) {
            subtotal += cost;
        } else if (li.unit_value) {
            subtotal += parseFloat(li.unit_value) || 0;
        }
    });
    const discount = subtotal * 0.2; // 20% discount as shown in invoice PDF
    const total = subtotal - discount;
    return { subtotal, discount, total };
}

// ── Invoice HTML Generator ────────────────────────────────────────────────────

function generateInvoiceHtml(campaign: Campaign, client: ClientDetail | null): string {
    const lineItems = campaign.line_items || [];
    const invoiceNumber = generateInvoiceNumber(campaign);
    const bookingIOId = `BI${campaign.id.toString().padStart(5, "0")}`;

    const today = new Date();
    const invoiceDate = fmtDateLong(today.toISOString());
    const dueDate = fmtDateLong(today.toISOString());

    // Period: campaign dates
    const periodStart = campaign.start_date
        ? new Date(campaign.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—";
    const periodEnd = campaign.end_date
        ? new Date(campaign.end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—";

    const contact = client?.contacts?.[0];
    // ←←← IMPROVED CURRENCY HANDLING
    const currencyCode = client?.billing?.billing_currency || "USD";
    const currencySymbol = currencyCode === "INR" ? "₹"
                        : currencyCode === "NZD" ? "$"
                        : currencyCode === "AED" ? "د.إ"
                        : "$";   // default fallback    
    const paymentTerms = client?.billing?.payment_terms || "NET 0 Days";

    const { subtotal, discount, total } = calculateTotal(lineItems);

    // Build booking rows for page 2
    const bookingRows = lineItems
        .map(
            (li, i) => {
                const costNum = li.unit_cost ? parseFloat(li.unit_cost.replace(/[^0-9.]/g, "")) : (li.unit_value ? parseFloat(li.unit_value) : 0);
                const vol = li.impressions ? Number(li.impressions).toLocaleString("en-IN") : "0";
                const amount = isNaN(costNum) ? "0.00" : costNum.toFixed(2);

                // ←←← UPDATED LINE HERE
                const clientIdDisplay = client?.client_id
                    ? client.client_id
                    : (client ? "CL" + campaign.id.toString().padStart(5, "0") : "—");

                return `
        <tr style="border-bottom:1px solid #e5e7eb;${i % 2 === 1 ? "background:#f9fafb;" : ""}">
          <td style="padding:10px 12px;font-size:12px;color:#374151;vertical-align:top;line-height:1.6;">
            <div style="font-weight:600;color:#111827;margin-bottom:2px;">
              Advertiser: ${campaign.advertiser || client?.name || "—"} | ID: ${clientIdDisplay}
            </div>
            <div style="color:#6b7280;">Campaign: ${campaign.campaign_name} | ID: ${campaign.campaign_id}</div>
            <div style="color:#6b7280;">Insertion Order ID: ${bookingIOId}</div>
            <div style="color:#4f46e5;font-weight:500;">Line Item: ${li.line_item_name || "—"} | ID: ${li.line_item_id}</div>
          </td>
          <td style="padding:10px 12px;font-size:12px;text-align:center;white-space:nowrap;">
            <div style="font-size:10px;color:#6b7280;font-weight:600;">CLIENT</div>
            <div style="font-weight:700;color:#111827;font-family:monospace;">${campaign.campaign_id}</div>
          </td>
          <td style="padding:10px 12px;font-size:12px;text-align:center;white-space:nowrap;">
            <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:#eef2ff;color:#4f46e5;font-weight:700;font-size:11px;">
              ${li.units || "CPM"}
            </span>
          </td>
          <td style="padding:10px 12px;font-size:12px;text-align:right;white-space:nowrap;font-weight:600;color:#111827;">
            ${currencySymbol}${costNum.toFixed(2)}
          </td>
          <td style="padding:10px 12px;font-size:12px;text-align:right;white-space:nowrap;color:#374151;">
            ${vol}
          </td>
          <td style="padding:10px 12px;font-size:12px;text-align:right;white-space:nowrap;font-weight:700;color:#111827;">
            ${currencySymbol}${amount}
          </td>
        </tr>`;
            }
        )
        .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; font-size: 13px; }
    .page { width: 900px; margin: 0 auto; padding: 32px 40px; }

    /* Header */
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .inv-logo img { height: 44px; }
    .inv-logo-text { font-size: 26px; font-weight: 900; color: #111827; letter-spacing:-1px; }
    .inv-logo-text span { color: #f59e0b; }
    .inv-logo-sub { font-size: 10px; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }
    .inv-title-block { text-align: right; }
    .inv-title { font-size: 22px; font-weight: 900; color: #111827; letter-spacing: -0.5px; }
    .inv-num { font-size: 13px; color: #6b7280; margin-top: 2px; font-family: monospace; }

    /* Billing company address */
    .inv-seller { margin-bottom: 20px; }
    .inv-seller-name { font-size: 13px; font-weight: 700; color: #111827; }
    .inv-seller-addr { font-size: 12px; color: #6b7280; line-height: 1.7; }

    /* Two column top area */
    .inv-top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }

    .bill-to-box { }
    .bill-to-label { font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; border-bottom: 2px solid #111827; padding-bottom: 4px; }
    .bill-to-name { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 3px; }
    .bill-to-line { font-size: 12px; color: #6b7280; line-height: 1.65; }

    .inv-details-box { }
    .inv-detail-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
    .inv-detail-label { color: #6b7280; }
    .inv-detail-val { font-weight: 600; color: #111827; }

    /* Amount due box */
    .amount-due-box { background: #0f172a; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .amount-due-label { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
    .amount-due-val { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -1px; }
    .amount-due-due { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
    .amount-due-currency { font-size: 11px; color: #f59e0b; font-weight: 700; letter-spacing: 0.08em; }

    /* Summary box */
    .summary-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .summary-title { font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; }
    .summary-row.total { font-weight: 800; font-size: 14px; color: #111827; border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 8px; }
    .summary-row.discount { color: #dc2626; }

    /* Bank details */
    .section-label { font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #111827; padding-bottom: 4px; margin: 20px 0 10px; }
    .bank-table { width: 100%; font-size: 12px; border-collapse: collapse; }
    .bank-table td { padding: 4px 8px; }
    .bank-table td:first-child { color: #6b7280; font-weight: 600; width: 140px; }
    .bank-table td:last-child { color: #111827; }

    /* Remittance */
    .remittance-label { font-size: 12px; font-weight: 700; color: #111827; margin: 16px 0 8px; }
    .remittance-list { padding-left: 18px; font-size: 12px; color: #374151; line-height: 1.9; }

    /* Footer */
    .inv-footer { font-size: 11px; color: #9ca3af; text-align: center; margin-top: 28px; padding-top: 14px; border-top: 1px solid #f3f4f6; }

    /* PAGE 2 — Booking Details */
    .page2 { width: 900px; margin: 0 auto; padding: 32px 40px; }
    .booking-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    .booking-table th { padding: 9px 12px; background: #111827; color: #fff; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid #374151; text-align: left; }
    .booking-table th.right { text-align: right; }
    .booking-table th.center { text-align: center; }
    .booking-table td { border: 1px solid #e5e7eb; }
    .booking-total-row td { background: #f9fafb !important; border-top: 2px solid #111827 !important; font-weight: 800; font-size: 13px; padding: 9px 12px; }

    /* PAGE 3 — Signature */
    .page3 { width: 900px; margin: 0 auto; padding: 32px 40px; }
    .sig-section { display: flex; justify-content: flex-end; margin-top: 48px; }
    .sig-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; width: 320px; }
    .sig-title { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 12px; }
    .sig-name-row { font-size: 13px; color: #111827; margin-bottom: 8px; }
    .sig-name-row strong { font-weight: 700; }
    .sig-line { border-bottom: 1px solid #9ca3af; margin: 32px 0 8px; }
    .sig-label { font-size: 11px; color: #6b7280; }

    /* Stamp circle (decorative) */
    .stamp { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #6b7280; display: flex; align-items: center; justify-content: center; margin: 16px auto 0; }
    .stamp-inner { text-align: center; font-size: 7px; font-weight: 700; color: #374151; line-height: 1.4; letter-spacing: 0.05em; }

    @media print {
      @page { margin: 0; size: A4; }
      body { margin: 16px; }
      .page, .page2, .page3 { width: 100%; padding: 20px 24px; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

<!-- ══════════════════════════════ PAGE 1 ══════════════════════════════ -->
<div class="page">

  <!-- Header -->
  <div class="inv-header">
    <div>
      <div class="inv-logo-text">Billion<span>tags</span></div>
    </div>
    <div class="inv-title-block">
      <div class="inv-title">Tax Invoice</div>
      <div class="inv-num">Invoice number: ${invoiceNumber}</div>
    </div>
  </div>

  <!-- Seller Address -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
    <div class="inv-seller-addr" style="text-align:right;">
      <div class="inv-seller-name">Billiontags Enterprises - FZCO</div>
      IFZA Business Park, DDP,<br/>
      Building A2, Premises No: 30485 - 001,<br/>
      Dubai, United Arab Emirates, Pin code: 341041.<br/>
      TRN No: 104101902500003<br/>
      License No: 30485
    </div>
  </div>

  <!-- Bill To + Details -->
  <div class="inv-top-grid">
    <div class="bill-to-box">
      <div class="bill-to-label">Bill To</div>
      <div class="bill-to-line">
        <div class="inv-detail-row"><strong><span class="inv-detail-label">Contact Person Name</span></strong><span class="inv-detail-val">${contact?.name || client?.name || "NILL"}</span></div>
        <div class="inv-detail-row"><strong><span class="inv-detail-label">Company Name</span></strong><span class="inv-detail-val">${client?.name || "Company Name"}</span></div>
        <div class="inv-detail-row"><strong><span class="inv-detail-label">Address</span></strong><span class="inv-detail-val">${client?.address_line1 || "Company Address"}</span></div>
        <div class="inv-detail-row"><strong><span class="inv-detail-label">Location</span></strong><span class="inv-detail-val">${client?.city ? client.city + ", " : ""}${client?.country || "Country Name"}</span></div>
        <div class="inv-detail-row"><strong><span class="inv-detail-label">VAST No</span></strong><span class="inv-detail-val">${client?.vast_number || "VAST NO"}</span></div>
        <div class="inv-detail-row"><strong><span class="inv-detail-label">CIN No</span></strong><span class="inv-detail-val">${client?.cin_number || "CIN No"}</span></div>
      </div>
    </div>
    <div class="inv-details-box">
      <div class="bill-to-label">Details</div>
      <div class="inv-detail-row"><span class="inv-detail-label">Invoice number</span><span class="inv-detail-val">${invoiceNumber}</span></div>
      <div class="inv-detail-row"><span class="inv-detail-label">Invoice date</span><span class="inv-detail-val">${invoiceDate}</span></div>
      <div class="inv-detail-row"><span class="inv-detail-label">Payment terms</span><span class="inv-detail-val">${paymentTerms}</span></div>
      <div class="inv-detail-row"><span class="inv-detail-label">Due date</span><span class="inv-detail-val">${dueDate}</span></div>
    </div>
  </div>

  <!-- Amount Due Box -->
  <div class="amount-due-box">
    <div>
      <div class="amount-due-currency">Pay in ${currencyCode}</div>
      <div class="amount-due-label">Total amount due</div>
      <div class="amount-due-due">Due ${dueDate}</div>
    </div>
    <div class="amount-due-val">${currencySymbol}${total.toFixed(1)}</div>
  </div>

  <!-- Summary -->
  <div class="summary-box">
    <div class="summary-title">Summary for ${periodStart} - ${periodEnd}</div>
    <div class="summary-row"><span>Pay in ${currencyCode}</span><span></span></div>
    <div class="summary-row"><span>Sub Total</span><span>${currencySymbol} ${subtotal.toFixed(1)}</span></div>
    <div class="summary-row"><span>VAT (0%)</span><span>${currencySymbol}0.0</span></div>
    <div class="summary-row discount"><span>Discount (20.0%)</span><span>- ${currencySymbol}${discount.toFixed(0)}</span></div>
    <div class="summary-row total"><span>Total amount due in ${currencyCode}</span><span>${currencySymbol}${total.toFixed(1)}</span></div>
  </div>

  <!-- Bank Account Details -->
  <div class="section-label">Bank Account Details</div>
  <table class="bank-table">
    <tr><td>Name</td><td>Billiontags Enterprises FZCO</td></tr>
    <tr><td>Account Number</td><td>1000000000001</td></tr>
    <tr><td>Bank</td><td>Emirates Bank</td></tr>
    <tr><td>Swift Code</td><td>EBUAAEAD</td></tr>
    <tr><td>IBAN No</td><td>AE321021000101500019001</td></tr>
    <tr><td>Bank Address</td><td>Emirates Bank PJSC. P.O. Box: 777, Dubai, UAE</td></tr>
  </table>

  <!-- Remittance -->
  <div class="remittance-label">Remittance instructions:</div>
  <ul class="remittance-list">
    <li>To ensure that we correctly match your payment, always reference invoice numbers when making your payment.</li>
    <li>If paying for multiple invoices, send an email to finance@billiontags.com with your company name and total payment amount in the subject line, and list the invoice numbers and respective amounts in the email</li>
    <li>Please send your payments only to the bank account listed below on this official Billiontags invoice.</li>
  </ul>

</div>

<!-- ══════════════════════════════ PAGE 2 — Booking Details ══════════════════════════════ -->
<div class="page-break"></div>
<div class="page2">

  <!-- Logo -->
  <div class="inv-header" style="margin-bottom:20px;">
    <div>
      <div class="inv-logo-text">Billion<span>tags</span></div>
      <div class="inv-logo-sub">Enterprises - FZCO</div>
    </div>
    <div class="inv-title-block">
      <div class="inv-title">Tax Invoice</div>
      <div class="inv-num">Invoice number: ${invoiceNumber}</div>
    </div>
  </div>

  <div class="section-label">Booking Details</div>

  <table class="booking-table">
    <thead>
      <tr>
        <th style="width:42%;">Description</th>
        <th class="center" style="width:13%;">Client<br/>Campaign Id</th>
        <th class="center" style="width:8%;">Metrics</th>
        <th class="right" style="width:10%;">Unit Cost</th>
        <th class="right" style="width:10%;">Volume</th>
        <th class="right" style="width:12%;">Amount ${currencySymbol}</th>
      </tr>
    </thead>
    <tbody>
      ${bookingRows || `<tr><td colspan="6" style="padding:20px;text-align:center;color:#9ca3af;font-style:italic;">No line items found</td></tr>`}
      <tr class="booking-total-row">
        <td colspan="3" style="text-align:right;">Subtotal in ${currencyCode}</td>
        <td></td>
        <td style="text-align:right;">${lineItems.reduce((s, li) => s + (parseInt(li.impressions || "0") || 0), 0).toLocaleString("en-IN")}</td>
        <td style="text-align:right;">${currencySymbol}${subtotal.toFixed(1)}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td colspan="5" style="padding:6px 12px;border:1px solid #e5e7eb;text-align:right;font-size:12px;color:#6b7280;">VAT (0%)</td>
        <td style="padding:6px 12px;border:1px solid #e5e7eb;text-align:right;font-size:12px;color:#6b7280;">$0.0</td>
      </tr>
      <tr style="background:#0f172a;">
        <td colspan="5" style="padding:10px 12px;border:1px solid #374151;text-align:right;font-weight:800;font-size:13px;color:#fff;">Total amount due in ${currencyCode}</td>
        <td style="padding:10px 12px;border:1px solid #374151;text-align:right;font-weight:900;font-size:15px;color:#fff;">${currencySymbol}${total.toFixed(1)}</td>
      </tr>
    </tbody>
  </table>

</div>

<!-- ══════════════════════════════ PAGE 3 — Bank + Signature ══════════════════════════════ -->
<div class="page-break"></div>
<div class="page3">

  <!-- Logo -->
  <div class="inv-header" style="margin-bottom:20px;">
    <div>
      <div class="inv-logo-text">Billion<span>tags</span></div>
      <div class="inv-logo-sub">Enterprises - FZCO</div>
    </div>
    <div class="inv-title-block">
      <div class="inv-title">Tax Invoice</div>
      <div class="inv-num">Invoice number: ${invoiceNumber}</div>
    </div>
  </div>

  <!-- Bank Account Details -->
  <div class="section-label">Bank Account Details</div>
  <table class="bank-table">
    <tr><td>Name</td><td>Billiontags Enterprises FZCO</td></tr>
    <tr><td>Account Number</td><td>1000000000001</td></tr>
    <tr><td>Bank</td><td>Emirates Bank</td></tr>
    <tr><td>Swift Code</td><td>EBUAAEAD</td></tr>
    <tr><td>IBAN No</td><td>AE321021000101500019001</td></tr>
    <tr><td>Bank Address</td><td>Emirates Bank PJSC. P.O. Box: 777, Dubai, UAE</td></tr>
  </table>

  <!-- Remittance -->
  <div class="remittance-label">Remittance instructions:</div>
  <ul class="remittance-list">
    <li>To ensure that we correctly match your payment, always reference invoice numbers when making your payment.</li>
    <li>If paying for multiple invoices, send an email to finance@billiontags.com with your company name and total payment amount in the subject line, and list the invoice numbers and respective amounts in the email</li>
    <li>Please send your payments only to the bank account listed below on this official Billiontags invoice.</li>
  </ul>

  <!-- Signature -->
  <div class="sig-section">
    <div class="sig-box">
      <div class="sig-title">Duly Authorized on behalf of the Billiontags Enterprises - FZCO by:</div>
      <div class="sig-name-row">Name: <strong>Praveen Kumar</strong></div>
      <div class="sig-name-row" style="color:#6b7280;font-size:12px;">Designation: Director</div>
      <div style="display:flex;align-items:flex-end;gap:16px;margin-top:8px;">
        <!-- Decorative signature -->
        <svg width="80" height="40" viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 30 Q15 10 25 20 Q35 30 45 15 Q55 5 65 20 Q70 27 75 25" stroke="#374151" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
        <!-- Stamp circle -->
        <div style="width:64px;height:64px;border-radius:50%;border:2.5px solid #6b7280;display:flex;align-items:center;justify-content:center;flex-direction:column;">
          <div style="font-size:6px;font-weight:800;color:#374151;letter-spacing:0.08em;text-align:center;line-height:1.5;text-transform:uppercase;">
            Billiontags<br/>Enterprises<br/>FZCO<br/>Dubai-UAE
          </div>
        </div>
      </div>
      <div class="sig-line"></div>
      <div class="sig-label">Signature</div>
    </div>
  </div>

</div>

</body>
</html>`;
}

// ── Invoice Preview Modal ─────────────────────────────────────────────────────

function InvoicePreviewModal({
    open,
    campaign,
    client,
    onClose,
    onDownload,
    downloading,
}: {
    open: boolean;
    campaign: Campaign | null;
    client: ClientDetail | null;
    onClose: () => void;
    onDownload: () => void;
    downloading: boolean;
}) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (open && campaign && iframeRef.current) {
            const html = generateInvoiceHtml(campaign, client);
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(html);
                doc.close();
            }
        }
    }, [open, campaign, client]);

    if (!campaign) return null;

    const invoiceNumber = generateInvoiceNumber(campaign);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={980}
            centered
            destroyOnClose
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 16, overflow: "hidden" }}
        >
            {/* Header */}
            <div
                style={{
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "rgba(245,158,11,0.2)",
                            border: "1.5px solid rgba(245,158,11,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                        }}
                    >
                        🧾
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                            Tax Invoice Preview
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                            {campaign.campaign_name} —{" "}
                            <span style={{ fontFamily: "monospace", color: "#93C5FD" }}>
                                {invoiceNumber}
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={downloading}
                    onClick={onDownload}
                    style={{
                        background: C.green,
                        borderColor: C.green,
                        fontWeight: 700,
                        fontSize: 13,
                        height: 38,
                        borderRadius: 8,
                    }}
                >
                    {downloading ? "Generating PDF…" : "Download PDF"}
                </Button>
            </div>

            {/* iframe */}
            <div
                style={{
                    height: "72vh",
                    overflow: "hidden",
                    background: "#f1f5f9",
                    padding: "16px",
                }}
            >
                <iframe
                    ref={iframeRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        borderRadius: 8,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                        background: "#fff",
                    }}
                    title="Invoice Preview"
                />
            </div>
        </Modal>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function User_Invoice() {
    const [collapsed, setCollapsed] = useState(false);
    const sideWidth = collapsed ? 64 : 240;

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
    const [previewClient, setPreviewClient] = useState<ClientDetail | null>(null);
    const [loadingClient, setLoadingClient] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const clientId = localStorage.getItem("client_id");
    const clientName = localStorage.getItem("client_name") ?? "";

    // ── Fetch approved campaigns ──────────────────────────────────────────────
    const fetchCampaigns = () => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns_by_client/${clientId}/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((data) => {
                const list: Campaign[] = Array.isArray(data) ? data : [];
                // Only approved campaigns have invoices
                setCampaigns(list.filter((c) => c.approval_status === "approved" && c.campaign_id));
            })
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCampaigns();
    }, [clientId]);

    // ── Fetch client details for preview ─────────────────────────────────────
    const handlePreview = async (campaign: Campaign) => {
        setPreviewCampaign(campaign);
        setPreviewClient(null);
        setLoadingClient(true);
        try {
            const res = await fetch(`${BASE_URL}/get_client/${clientId}/`, {
                headers: { "ngrok-skip-browser-warning": "1" },
            });
            if (res.ok) {
                const data = await res.json();
                setPreviewClient(data);
            }
        } catch {
            // proceed with null client
        } finally {
            setLoadingClient(false);
        }
    };

    // ── Download via print ────────────────────────────────────────────────────
    const handleDownload = async () => {
        if (!previewCampaign) return;
        setDownloading(true);
        try {
            const html = generateInvoiceHtml(previewCampaign, previewClient);
            const printWindow = window.open("", "_blank", "width=1000,height=800");
            if (!printWindow) {
                alert("Please allow popups to download the PDF.");
                setDownloading(false);
                return;
            }
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                setTimeout(() => {
                    printWindow.close();
                    setDownloading(false);
                }, 2000);
            }, 800);
        } catch {
            setDownloading(false);
        }
    };

    // ── Direct download (no preview) ─────────────────────────────────────────
    const handleDirectDownload = async (campaign: Campaign) => {
        setPreviewCampaign(campaign);
        setDownloading(true);
        let clientData: ClientDetail | null = null;
        try {
            const res = await fetch(`${BASE_URL}/get_client/${clientId}/`, {
                headers: { "ngrok-skip-browser-warning": "1" },
            });
            if (res.ok) clientData = await res.json();
        } catch { /* ignore */ }

        const html = generateInvoiceHtml(campaign, clientData);
        const printWindow = window.open("", "_blank", "width=1000,height=800");
        if (!printWindow) {
            alert("Please allow popups to download the PDF.");
            setDownloading(false);
            return;
        }
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            setTimeout(() => {
                printWindow.close();
                setDownloading(false);
            }, 2000);
        }, 800);
    };

    // ── Filter ────────────────────────────────────────────────────────────────
    const filtered = campaigns.filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [c.campaign_id, c.campaign_name, c.advertiser, c.client_campaign_ID]
            .some((f) => f?.toLowerCase().includes(q));
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    const thisMonthCount = campaigns.filter((c) => {
        const d = new Date(c.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const activeCount = campaigns.filter((c) => {
        if (!c.start_date || !c.end_date) return false;
        const now = new Date();
        return now >= new Date(c.start_date) && now <= new Date(c.end_date);
    }).length;

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: C.bg,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
        >
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

            <div
                style={{
                    marginLeft: sideWidth,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)",
                    minWidth: 0,
                }}
            >
                {/* ── Topbar ── */}
                <header
                    style={{
                        background: C.white,
                        borderBottom: `1px solid ${C.slate300}`,
                        padding: "0 28px",
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 50,
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: C.slate,
                                letterSpacing: "-0.4px",
                            }}
                        >
                            Invoices
                        </h1>
                        <p
                            style={{
                                fontSize: 11,
                                color: C.slate500,
                                marginTop: 1,
                                letterSpacing: "0.04em",
                                fontWeight: 500,
                            }}
                        >
                            VIEW & DOWNLOAD TAX INVOICES FOR YOUR CAMPAIGNS
                        </p>
                    </div>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: C.blue,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.white,
                            fontSize: 12,
                            fontWeight: 800,
                        }}
                    >
                        {clientName ? clientName.charAt(0).toUpperCase() : "U"}
                    </div>
                </header>

                <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>

                    {/* ── Info Banner ── */}
                    <div
                        style={{
                            background: C.amberLight,
                            border: `1px solid #FDE68A`,
                            borderRadius: 12,
                            padding: "12px 18px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 20,
                            fontSize: 13,
                            color: C.amber,
                        }}
                    >
                        <DollarOutlined style={{ fontSize: 16, flexShrink: 0 }} />
                        <span>
                            Tax Invoices are auto-generated for{" "}
                            <strong>approved campaigns</strong>. Each invoice includes booking details, bank account information, and signature.
                        </span>
                    </div>

                    {/* ── Stats Row ── */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 14,
                            marginBottom: 20,
                        }}
                    >
                        {[
                            {
                                label: "Total Invoices",
                                value: campaigns.length,
                                icon: "🧾",
                                color: C.purple,
                                bg: C.purpleLight,
                            },
                            {
                                label: "This Month",
                                value: thisMonthCount,
                                icon: "📅",
                                color: C.green,
                                bg: C.greenLight,
                            },
                            {
                                label: "Active Campaigns",
                                value: activeCount,
                                icon: "🟢",
                                color: C.amber,
                                bg: C.amberLight,
                            },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                style={{
                                    background: C.white,
                                    borderRadius: 12,
                                    padding: "18px 20px",
                                    border: `1px solid ${C.border}`,
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                }}
                            >
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 10,
                                        background: stat.bg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 20,
                                        flexShrink: 0,
                                    }}
                                >
                                    {stat.icon}
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: 28,
                                            fontWeight: 800,
                                            color: stat.color,
                                            lineHeight: 1,
                                            letterSpacing: "-1px",
                                        }}
                                    >
                                        {stat.value}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: C.slate500,
                                            fontWeight: 600,
                                            marginTop: 3,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Search + Refresh ── */}
                    <div
                        style={{
                            background: C.white,
                            borderRadius: 12,
                            padding: "12px 16px",
                            border: `1px solid ${C.border}`,
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Input
                            placeholder="Search by Campaign ID, Name, Advertiser…"
                            prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            allowClear
                            style={{ flex: 1, height: 36 }}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchCampaigns}
                            style={{
                                height: 36,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                color: C.slate500,
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            Refresh
                        </Button>
                        <span style={{ fontSize: 12, color: C.slate500, whiteSpace: "nowrap" }}>
                            {filtered.length} of {campaigns.length} Invoices
                        </span>
                    </div>

                    {/* ── Table ── */}
                    <div
                        style={{
                            background: C.white,
                            borderRadius: 14,
                            border: `1px solid ${C.border}`,
                            overflow: "hidden",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                    >
                        {/* Table Header */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "150px 120px 1fr 150px 120px 120px 190px",
                                padding: "10px 20px",
                                background: C.slate100,
                                borderBottom: `1px solid ${C.border}`,
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.slate500,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                gap: 12,
                            }}
                        >
                            <div>Campaign ID</div>
                            <div>Invoice #</div>
                            <div>Campaign Name</div>
                            <div>Advertiser</div>
                            <div>Start Date</div>
                            <div>End Date</div>
                            <div>Actions</div>
                        </div>

                        {/* Rows */}
                        {loading ? (
                            <div style={{ padding: "48px", textAlign: "center", color: C.slate500 }}>
                                <Spin size="large" />
                                <div style={{ marginTop: 12, fontSize: 13 }}>Loading Invoices…</div>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: "48px 24px", textAlign: "center" }}>
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: C.slate,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {campaigns.length === 0
                                                    ? "No approved campaigns yet"
                                                    : "No results found"}
                                            </div>
                                            <div style={{ fontSize: 12, color: C.slate500 }}>
                                                {campaigns.length === 0
                                                    ? "Invoices will appear here once your campaigns are approved by the admin."
                                                    : "Try adjusting your search query."}
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        ) : (
                            filtered.map((campaign, idx) => {
                                const invoiceNumber = generateInvoiceNumber(campaign);
                                const lineItemCount = campaign.line_items?.length ?? 0;
                                const { total } = calculateTotal(campaign.line_items || []);

                                return (
                                    <div
                                        key={campaign.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "150px 120px 1fr 150px 120px 120px 190px",
                                            padding: "14px 20px",
                                            borderBottom:
                                                idx < filtered.length - 1
                                                    ? `1px solid ${C.border}`
                                                    : "none",
                                            alignItems: "center",
                                            gap: 12,
                                            background: idx % 2 === 0 ? C.white : "#FAFBFC",
                                            transition: "background 0.12s",
                                        }}
                                        onMouseEnter={(e) =>
                                            ((e.currentTarget as HTMLDivElement).style.background = C.slate100)
                                        }
                                        onMouseLeave={(e) =>
                                        ((e.currentTarget as HTMLDivElement).style.background =
                                            idx % 2 === 0 ? C.white : "#FAFBFC")
                                        }
                                    >
                                        {/* Campaign ID */}
                                        <div>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: C.blue,
                                                    background: C.blueLight,
                                                    padding: "3px 8px",
                                                    borderRadius: 6,
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                {campaign.campaign_id}
                                            </span>
                                        </div>

                                        {/* Invoice # */}
                                        <div>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: C.purple,
                                                    background: C.purpleLight,
                                                    padding: "3px 7px",
                                                    borderRadius: 5,
                                                    fontFamily: "monospace",
                                                    border: `1px solid #DDD6FE`,
                                                }}
                                            >
                                                {invoiceNumber}
                                            </span>
                                        </div>

                                        {/* Campaign Name */}
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: C.slate,
                                                    marginBottom: 3,
                                                }}
                                            >
                                                {campaign.campaign_name}
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                {campaign.campaign_type && (
                                                    <Tag
                                                        color="blue"
                                                        style={{ fontSize: 10, margin: 0, lineHeight: "18px" }}
                                                    >
                                                        {campaign.campaign_type}
                                                    </Tag>
                                                )}
                                                <Tag
                                                    color="purple"
                                                    style={{ fontSize: 10, margin: 0, lineHeight: "18px" }}
                                                >
                                                    {lineItemCount} line item{lineItemCount !== 1 ? "s" : ""}
                                                </Tag>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 3,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: C.green,
                                                        background: C.greenLight,
                                                        padding: "1px 6px",
                                                        borderRadius: 4,
                                                        border: "1px solid #BBF7D0",
                                                    }}
                                                >
                                                    <CheckCircleOutlined style={{ fontSize: 9 }} />
                                                    Approved
                                                </span>
                                                {total > 0 && (
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            color: C.amber,
                                                            background: C.amberLight,
                                                            padding: "1px 6px",
                                                            borderRadius: 4,
                                                            border: "1px solid #FDE68A",
                                                        }}
                                                    >
                                                        ${total.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Advertiser */}
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: C.slate700,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {campaign.advertiser || "—"}
                                        </div>

                                        {/* Start Date */}
                                        <div style={{ fontSize: 12, color: C.slate }}>
                                            {fmtDate(campaign.start_date)}
                                        </div>

                                        {/* End Date */}
                                        <div style={{ fontSize: 12, color: C.slate }}>
                                            {fmtDate(campaign.end_date)}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <Button
                                                size="small"
                                                icon={<EyeOutlined />}
                                                onClick={() => handlePreview(campaign)}
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: C.blue,
                                                    background: C.blueLight,
                                                    border: `1px solid ${C.blueMid}`,
                                                    borderRadius: 6,
                                                    height: 30,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                Preview
                                            </Button>
                                            <Button
                                                size="small"
                                                icon={<DownloadOutlined />}
                                                onClick={() => handleDirectDownload(campaign)}
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: C.green,
                                                    background: C.greenLight,
                                                    border: "1px solid #BBF7D0",
                                                    borderRadius: 6,
                                                    height: 30,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Loading client toast */}
                    {loadingClient && previewCampaign && (
                        <div
                            style={{
                                position: "fixed",
                                bottom: 24,
                                left: "50%",
                                transform: "translateX(-50%)",
                                background: C.white,
                                border: `1px solid ${C.border}`,
                                borderRadius: 10,
                                padding: "10px 18px",
                                fontSize: 13,
                                color: C.slate500,
                                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                zIndex: 2000,
                            }}
                        >
                            <Spin size="small" />
                            Loading client details for Invoice…
                        </div>
                    )}
                </main>
            </div>

            {/* Invoice Preview Modal */}
            <InvoicePreviewModal
                open={!!previewCampaign}
                campaign={previewCampaign}
                client={previewClient}
                onClose={() => {
                    setPreviewCampaign(null);
                    setPreviewClient(null);
                }}
                onDownload={handleDownload}
                downloading={downloading}
            />

            <style>{`
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
        }
      `}</style>
        </div>
    );
}